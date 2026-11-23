import logging
from typing import Any, Dict, List, Optional
import numpy as np
from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels

from apps.ai_module.vector_store.client import get_qdrant_client
from apps.ai_module.vector_store.collection_manager import COLLECTION_KNOWLEDGE_VECTORS
from apps.ai_module.vector_store.embedding_service import get_embedding_service

logger = logging.getLogger(__name__)

DEFAULT_SIMILARITY_THRESHOLD = 0.15
DEFAULT_MMR_LAMBDA = 0.60


def _cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Calculates cosine similarity between two normalized vectors."""
    a = np.array(vec1, dtype=np.float32)
    b = np.array(vec2, dtype=np.float32)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


class KnowledgeRetriever:
    """
    RAG Semantic Knowledge Retriever (Step 5).
    Retrieves and re-ranks knowledge chunks from Qdrant using Maximum Marginal
    Relevance (MMR), domain category filtering, similarity score thresholding,
    and Primacy-Recency context positioning.
    """

    def __init__(
        self,
        client: Optional[QdrantClient] = None,
        embedding_service: Optional[Any] = None,
    ):
        self.client = client or get_qdrant_client()
        self.embedder = embedding_service or get_embedding_service()

    def _apply_mmr(
        self,
        query_vec: List[float],
        candidates: List[Any],
        k: int = 4,
        lambda_mult: float = DEFAULT_MMR_LAMBDA,
    ) -> List[Any]:
        """
        Applies Maximum Marginal Relevance (MMR) re-ranking (Handbook Chapter 8.2).
        Formula: argmax [ lambda * Sim(d_i, q) - (1 - lambda) * max_{d_j in S} Sim(d_i, d_j) ]
        """
        if len(candidates) <= k:
            return candidates

        candidate_vectors = [c.vector for c in candidates]
        query_sims = [_cosine_similarity(query_vec, v) for v in candidate_vectors]

        selected_indices: List[int] = []
        remaining_indices = list(range(len(candidates)))

        # 1. Pick the candidate with highest similarity to query first
        best_first = int(np.argmax(query_sims))
        selected_indices.append(best_first)
        remaining_indices.remove(best_first)

        # 2. Iteratively pick diverse candidates
        while len(selected_indices) < k and remaining_indices:
            best_mmr_score = -float("inf")
            best_idx = None

            for r_idx in remaining_indices:
                sim_to_query = query_sims[r_idx]
                sim_to_selected = max(
                    _cosine_similarity(candidate_vectors[r_idx], candidate_vectors[s_idx])
                    for s_idx in selected_indices
                )
                mmr_score = (lambda_mult * sim_to_query) - ((1.0 - lambda_mult) * sim_to_selected)

                if mmr_score > best_mmr_score:
                    best_mmr_score = mmr_score
                    best_idx = r_idx

            if best_idx is not None:
                selected_indices.append(best_idx)
                remaining_indices.remove(best_idx)
            else:
                break

        return [candidates[i] for i in selected_indices]

    def _arrange_primacy_recency(self, chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Addresses the 'Lost in the Middle' problem (Handbook Chapter 12.3 Q2).
        Places top-1 chunk at index 0 (primacy) and top-2 chunk at index -1 (recency).
        """
        if len(chunks) <= 2:
            return chunks

        sorted_by_score = sorted(chunks, key=lambda x: x["relevance_score"], reverse=True)
        arranged = [sorted_by_score[0]]  # Top 1 at the beginning

        for c in sorted_by_score[2:]:
            arranged.append(c)

        arranged.append(sorted_by_score[1])  # Top 2 at the end
        return arranged

    def search(
        self,
        query: str,
        category: Optional[str] = None,
        top_k: int = 4,
        score_threshold: float = DEFAULT_SIMILARITY_THRESHOLD,
        use_mmr: bool = True,
    ) -> Dict[str, Any]:
        """
        Executes semantic vector retrieval with category routing and score thresholding.
        """
        clean_query = query.strip()
        if not clean_query:
            return {"status": "NO_MATCHES", "chunks": [], "max_score": 0.0}

        query_vec = self.embedder.embed_query(clean_query)

        # Build category filter if not "ALL"
        query_filter = None
        if category and category.upper() not in ["ALL", ""]:
            cat_val = category.upper()
            if cat_val == "PLACEMENT":
                cat_val = "PLACEMENT_CELL"
            if cat_val in ["NSU", "NIRMA", "NIRMA UNIVERSITY"]:
                cat_val = "NIRMA"
            query_filter = qmodels.Filter(
                must=[
                    qmodels.FieldCondition(
                        key="category",
                        match=qmodels.MatchValue(value=cat_val),
                    )
                ]
            )

        fetch_k = top_k * 4 if use_mmr else top_k

        # Fetch candidate points from Qdrant (compatible with modern and legacy qdrant-client)
        try:
            if hasattr(self.client, "query_points"):
                res = self.client.query_points(
                    collection_name=COLLECTION_KNOWLEDGE_VECTORS,
                    query=query_vec,
                    query_filter=query_filter,
                    limit=fetch_k,
                    with_payload=True,
                    with_vectors=use_mmr,
                )
                search_results = getattr(res, "points", [])
            else:
                search_results = self.client.search(
                    collection_name=COLLECTION_KNOWLEDGE_VECTORS,
                    query_vector=query_vec,
                    query_filter=query_filter,
                    limit=fetch_k,
                    with_payload=True,
                    with_vectors=use_mmr,
                )
        except Exception as e:
            logger.error(f"[Knowledge Retriever] Qdrant query error: {e}", exc_info=True)
            search_results = []

        if not search_results:
            return {"status": "NO_MATCHES", "chunks": [], "max_score": 0.0}

        # Apply MMR re-ranking if enabled
        if use_mmr and len(search_results) > top_k:
            selected_points = self._apply_mmr(query_vec, search_results, k=top_k)
        else:
            selected_points = search_results[:top_k]

        max_score = max((p.score for p in selected_points), default=0.0)

        # Quality threshold gate (Handbook Q10, Page 23)
        if max_score < score_threshold:
            logger.info(
                f"[Knowledge Retriever] Query max score {max_score:.3f} below threshold {score_threshold}."
            )
            return {"status": "NO_MATCHES", "chunks": [], "max_score": round(max_score, 3)}

        # Format retrieved chunks
        formatted_chunks = []
        for p in selected_points:
            payload = p.payload or {}
            formatted_chunks.append({
                "chunk_id": str(p.id),
                "document_id": payload.get("document_id", ""),
                "title": payload.get("title", "Official Policy"),
                "category": payload.get("category", "GENERAL"),
                "section": payload.get("section", "Policy Guidelines"),
                "text": payload.get("text", ""),
                "relevance_score": round(float(p.score), 3),
            })

        # Apply Primacy-Recency positioning
        arranged_chunks = self._arrange_primacy_recency(formatted_chunks)

        return {
            "status": "FOUND",
            "chunks": arranged_chunks,
            "max_score": round(max_score, 3),
        }
