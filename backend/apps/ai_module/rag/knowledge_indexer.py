import logging
import time
from typing import Any, Dict, List, Optional
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct

from apps.ai_module.rag.chunker import MarkdownSemanticChunker, KnowledgeChunk
from apps.ai_module.rag.document_loader import KnowledgeDocumentLoader, KnowledgeDocument
from apps.ai_module.vector_store.client import get_qdrant_client
from apps.ai_module.vector_store.collection_manager import (
    COLLECTION_KNOWLEDGE_VECTORS,
    CollectionManager,
)
from apps.ai_module.vector_store.embedding_service import get_embedding_service

logger = logging.getLogger(__name__)


class KnowledgeIndexer:
    """
    RAG Knowledge Indexing Engine (Steps 3 & 4).
    Embeds structured Markdown chunks and upserts them into Qdrant collection
    `knowledge_vectors` with payload indexes for domain routing.
    """

    def __init__(
        self,
        client: Optional[QdrantClient] = None,
        loader: Optional[KnowledgeDocumentLoader] = None,
        chunker: Optional[MarkdownSemanticChunker] = None,
    ):
        self.client = client or get_qdrant_client()
        self.loader = loader or KnowledgeDocumentLoader()
        self.chunker = chunker or MarkdownSemanticChunker()
        self.embedder = get_embedding_service()

        # Ensure collection and payload indexes exist
        cm = CollectionManager(client=self.client)
        cm.ensure_collections_exist()

    def index_all(
        self,
        category_filter: Optional[str] = None,
        batch_size: int = 32,
    ) -> Dict[str, Any]:
        """
        Loads all substantive documents, chunks them, computes dense embeddings,
        and upserts points into Qdrant.
        """
        start_time = time.time()
        docs: List[KnowledgeDocument] = self.loader.load_documents(category_filter=category_filter)

        if not docs:
            logger.warning("[Knowledge Indexer] No documents discovered to index.")
            return {
                "status": "EMPTY",
                "documents_count": 0,
                "chunks_count": 0,
                "points_upserted": 0,
                "elapsed_seconds": 0.0,
            }

        all_chunks: List[KnowledgeChunk] = []
        for doc in docs:
            chunks = self.chunker.chunk_document(doc)
            all_chunks.extend(chunks)

        logger.info(
            f"[Knowledge Indexer] Generated {len(all_chunks)} chunks from {len(docs)} documents. "
            f"Beginning batch embedding and Qdrant upsert..."
        )

        total_upserted = 0

        # Process in batches for memory throughput
        for i in range(0, len(all_chunks), batch_size):
            chunk_batch = all_chunks[i : i + batch_size]
            texts = [c.text for c in chunk_batch]

            # Step 3: Batch embedding generation (SentenceTransformers)
            embeddings = self.embedder.embed_documents(texts, batch_size=batch_size)

            # Step 4: Construct Qdrant points with metadata payload
            points: List[PointStruct] = []
            for chunk, vec in zip(chunk_batch, embeddings):
                payload = {
                    "document_id": chunk.document_id,
                    "title": chunk.title,
                    "category": chunk.category,
                    "section": chunk.section,
                    "chunk_index": chunk.chunk_index,
                    "total_chunks": chunk.total_chunks,
                    "text": chunk.text,
                    "access_level": "PUBLIC",
                    "char_count": chunk.char_count,
                    "approx_tokens": chunk.approx_tokens,
                }
                points.append(
                    PointStruct(
                        id=chunk.chunk_id,
                        vector=vec,
                        payload=payload,
                    )
                )

            # Upsert into Qdrant knowledge_vectors
            self.client.upsert(
                collection_name=COLLECTION_KNOWLEDGE_VECTORS,
                points=points,
                wait=True,
            )
            total_upserted += len(points)
            logger.debug(f"[Knowledge Indexer] Upserted batch {i // batch_size + 1}: {len(points)} points.")

        elapsed = round(time.time() - start_time, 2)
        logger.info(
            f"[Knowledge Indexer] Completed indexing: {len(docs)} documents, "
            f"{total_upserted} chunks indexed in {elapsed}s."
        )

        return {
            "status": "SUCCESS",
            "documents_count": len(docs),
            "chunks_count": len(all_chunks),
            "points_upserted": total_upserted,
            "elapsed_seconds": elapsed,
        }

    def get_collection_info(self) -> Dict[str, Any]:
        """Returns live point count and status for knowledge_vectors."""
        info = self.client.get_collection(COLLECTION_KNOWLEDGE_VECTORS)
        return {
            "collection_name": COLLECTION_KNOWLEDGE_VECTORS,
            "status": str(info.status),
            "points_count": info.points_count,
            "vector_dimension": info.config.params.vectors.size,
            "distance": str(info.config.params.vectors.distance),
        }
