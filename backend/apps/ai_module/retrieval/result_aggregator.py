import logging
from typing import Any, Dict, List
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)
User = get_user_model()


class ResultAggregator:
    """
    Candidate Result Aggregator.
    Performs max-similarity pooling across multi-chunk points, enforces
    deduplication, and executes single-query batch hydration from MySQL (zero N+1 queries).
    """

    @staticmethod
    def pool_and_deduplicate(raw_hits: List[Any], caller_user_id: int) -> Dict[int, Dict[str, Any]]:
        """
        Groups raw chunk points by mysql_user_id, taking the maximum similarity score
        across all matching chunks for each unique candidate.

        Args:
            raw_hits: List of ScoredPoint objects from Qdrant
            caller_user_id: Requesting user ID for strict Python-level exclusion

        Returns:
            Dict mapping user_id -> {
                'best_score': float,
                'role': str,
                'chunk_types': List[str],
                'payload': Dict[str, Any],
            }
        """
        pool: Dict[int, Dict[str, Any]] = {}

        for hit in raw_hits:
            payload = getattr(hit, "payload", {}) or {}
            uid = payload.get("mysql_user_id")

            # Strict self-exclusion guardrail
            if not uid or uid == caller_user_id:
                continue

            score = float(getattr(hit, "score", 0.0))
            # Clamp negative cosine scores to 0.0
            score = max(0.0, score)
            chunk_type = payload.get("chunk_type", "UNKNOWN")
            role = payload.get("role", "UNKNOWN")

            if uid not in pool:
                pool[uid] = {
                    "user_id": uid,
                    "best_score": score,
                    "role": role,
                    "chunk_types": [chunk_type],
                    "payload": payload,
                }
            else:
                if score > pool[uid]["best_score"]:
                    pool[uid]["best_score"] = score
                if chunk_type not in pool[uid]["chunk_types"]:
                    pool[uid]["chunk_types"].append(chunk_type)

        return pool

    @staticmethod
    def hydrate_candidate_users(candidate_user_ids: List[int]) -> Dict[int, User]:
        """
        Fetches full relational profiles for all candidate IDs in exactly one SQL query
        with prefetching, eliminating N+1 database queries.

        Args:
            candidate_user_ids: List of unique MySQL user IDs to hydrate

        Returns:
            Dict mapping user_id -> User instance
        """
        if not candidate_user_ids:
            return {}

        users_qs = User.objects.filter(
            id__in=candidate_user_ids,
            is_active=True,
        ).select_related(
            "student_profile__department",
            "student_profile__batch",
            "alumni_profile__department",
            "alumni_profile__batch",
            "alumni_profile__current_company",
        ).prefetch_related(
            "user_skills__skill__category",
            "social_links",
        )

        return {user.id: user for user in users_qs}
