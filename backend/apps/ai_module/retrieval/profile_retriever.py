import logging
from typing import Any, Dict, List, Optional
from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels
from django.contrib.auth import get_user_model

from apps.ai_module.vector_store.client import get_qdrant_client
from apps.ai_module.vector_store.collection_manager import (
    COLLECTION_STUDENT_VECTORS,
    COLLECTION_ALUMNI_VECTORS,
)
from apps.ai_module.vector_store.embedding_service import get_embedding_service

logger = logging.getLogger(__name__)
User = get_user_model()


class ProfileRetriever:
    """
    Multi-collection vector candidate retrieval engine.
    Executes semantic similarity queries against student_vectors and alumni_vectors
    with strict self-exclusion, active status filtering, and optional relational constraints.
    """

    def __init__(
        self,
        client: Optional[QdrantClient] = None,
        embedding_service: Optional[Any] = None,
    ):
        self.client = client or get_qdrant_client()
        self.embedding_service = embedding_service or get_embedding_service()

    def build_caller_query_text(self, caller: User) -> str:
        """
        Synthesizes a rich semantic query string representing the caller's profile
        when no explicit search prompt is provided.
        """
        parts = []

        # 1. Technical skills
        skills = []
        if hasattr(caller, "user_skills"):
            for us in caller.user_skills.all():
                if hasattr(us, "skill") and us.skill:
                    skills.append(f"{us.skill.name} ({us.proficiency})")
        if skills:
            parts.append("Skills: " + ", ".join(skills))

        # 2. Academic & Bio summary
        if hasattr(caller, "student_profile") and caller.student_profile:
            sp = caller.student_profile
            dept_name = getattr(sp.department, "name", "") if sp.department else ""
            batch_name = getattr(sp.batch, "name", "") if sp.batch else ""
            parts.append(f"Student in {dept_name} {batch_name}")
            if sp.bio:
                parts.append(sp.bio)
        elif hasattr(caller, "alumni_profile") and caller.alumni_profile:
            ap = caller.alumni_profile
            dept_name = getattr(ap.department, "name", "") if ap.department else ""
            job_title = ap.current_job_title or ""
            company_name = getattr(ap.current_company, "name", "") if ap.current_company else ""
            parts.append(f"Alumnus {job_title} at {company_name} ({dept_name})")
            if ap.bio:
                parts.append(ap.bio)

        query_text = " | ".join(parts).strip()
        return query_text or f"User #{caller.id} profile"

    def retrieve_candidates(
        self,
        caller_user_id: int,
        target_role: str = "ALL",
        query_text: Optional[str] = None,
        caller_user: Optional[User] = None,
        top_k: int = 50,
        filters: Optional[Dict[str, Any]] = None,
        query_vector: Optional[List[float]] = None,
    ) -> List[Any]:
        """
        Retrieves top-K candidate vector chunks from Qdrant.

        Args:
            caller_user_id: ID of the user requesting recommendations (strictly excluded)
            target_role: 'STUDENT', 'ALUMNI', or 'ALL'
            query_text: Optional custom semantic query string. If None, derived from caller_user
            caller_user: Optional loaded User object for automatic query formulation
            top_k: Number of raw points to retrieve per collection
            filters: Optional dict of exact-match filters (e.g. {'department_id': 1})
            query_vector: Optional pre-computed embedding vector to eliminate redundant inference

        Returns:
            List of raw Qdrant ScoredPoint objects
        """
        # 1. Use precomputed vector or compute embedding once
        if query_vector is None:
            if not query_text:
                if caller_user:
                    query_text = self.build_caller_query_text(caller_user)
                else:
                    try:
                        loaded_caller = User.objects.select_related(
                            "student_profile__department",
                            "student_profile__batch",
                            "alumni_profile__department",
                            "alumni_profile__current_company",
                        ).prefetch_related("user_skills__skill").get(id=caller_user_id)
                        query_text = self.build_caller_query_text(loaded_caller)
                    except User.DoesNotExist:
                        query_text = f"User #{caller_user_id}"

            query_vector = self.embedding_service.embed_query(query_text)

        # 3. Construct Qdrant payload filters
        must_conditions = [
            qmodels.FieldCondition(
                key="is_active",
                match=qmodels.MatchValue(value=True),
            )
        ]

        if filters:
            for key, val in filters.items():
                if val is not None:
                    must_conditions.append(
                        qmodels.FieldCondition(key=key, match=qmodels.MatchValue(value=val))
                    )

        # Strict Self-Exclusion: caller_user_id must NEVER be returned
        must_not_conditions = [
            qmodels.FieldCondition(
                key="mysql_user_id",
                match=qmodels.MatchValue(value=caller_user_id),
            )
        ]

        qdrant_filter = qmodels.Filter(
            must=must_conditions,
            must_not=must_not_conditions,
        )

        # 4. Determine target collections
        collections_to_query = []
        if target_role == "STUDENT":
            collections_to_query = [COLLECTION_STUDENT_VECTORS]
        elif target_role == "ALUMNI":
            collections_to_query = [COLLECTION_ALUMNI_VECTORS]
        else:
            collections_to_query = [COLLECTION_STUDENT_VECTORS, COLLECTION_ALUMNI_VECTORS]

        # 5. Query each collection and aggregate raw hits
        all_hits = []
        for col_name in collections_to_query:
            try:
                if hasattr(self.client, "query_points"):
                    res = self.client.query_points(
                        collection_name=col_name,
                        query=query_vector,
                        query_filter=qdrant_filter,
                        limit=top_k,
                        with_payload=True,
                    )
                    hits = getattr(res, "points", [])
                else:
                    hits = self.client.search(
                        collection_name=col_name,
                        query_vector=query_vector,
                        query_filter=qdrant_filter,
                        limit=top_k,
                        with_payload=True,
                    )
                all_hits.extend(hits)
            except Exception as e:
                logger.error(f"[ProfileRetriever] Error querying collection '{col_name}': {e}", exc_info=True)

        return all_hits
