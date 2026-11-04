import logging
import time
from typing import Any, Dict, List, Optional
from django.contrib.auth import get_user_model
from django.db.models import QuerySet
from qdrant_client import QdrantClient

from apps.ai_module.vector_store.client import get_qdrant_client
from apps.ai_module.vector_store.vector_lifecycle import sync_user_profile_vector
from apps.ai_module.indexing.profile_document_builder import is_profile_ready
from apps.ai_module.indexing.profile_chunker import chunk_user_profile
from apps.ai_module.models import VectorIndexState

logger = logging.getLogger(__name__)

User = get_user_model()


def get_eligible_users(role: Optional[str] = None) -> QuerySet:
    """
    Returns an optimized QuerySet of active users eligible for vector indexing.
    Streams with prefetching to avoid N+1 queries.
    """
    qs = User.objects.filter(is_active=True).select_related(
        "student_profile__department",
        "student_profile__batch",
        "alumni_profile__department",
        "alumni_profile__batch",
        "alumni_profile__current_company",
    ).prefetch_related(
        "user_skills__skill__category",
        "ai_usages",
        "social_links",
    )

    if role in ("STUDENT", "ALUMNI"):
        qs = qs.filter(role=role)
    else:
        qs = qs.filter(role__in=["STUDENT", "ALUMNI"])

    return qs.order_by("id")


class ProfileIndexer:
    """
    Industrial batch indexing service for large user populations.
    Handles streaming cursors, readiness gating, SHA-256 change detection,
    fault-tolerant error isolation, and dry-run simulation.
    """

    def __init__(self, client: Optional[QdrantClient] = None):
        self.client = client or get_qdrant_client()

    def index_single_user(self, user_id: int, force: bool = False) -> Dict[str, Any]:
        """Indexes or updates a single user's vectors idempotently."""
        return sync_user_profile_vector(user_id=user_id, force=force, client=self.client)

    def run_batch_index(
        self,
        role: str = "ALL",
        batch_size: int = 50,
        limit: Optional[int] = None,
        dry_run: bool = False,
        force: bool = False,
        progress_callback: Optional[Any] = None,
    ) -> Dict[str, Any]:
        """
        Executes a memory-safe batch indexing run.

        Args:
            role: 'STUDENT', 'ALUMNI', or 'ALL'
            batch_size: Database cursor chunk size
            limit: Maximum records to process (for testing/partial runs)
            dry_run: If True, evaluates readiness and hashes without writing to Qdrant or DB
            force: If True, re-indexes even if content_hash matches indexed_hash
            progress_callback: Optional callable(stats) for UI/CLI updates

        Returns:
            Dict containing complete execution statistics and error logs
        """
        start_time = time.time()
        users_qs = get_eligible_users(role=role)
        total_eligible = users_qs.count()

        if limit and limit > 0:
            users_qs = users_qs[:limit]
            scan_target = limit
        else:
            scan_target = total_eligible

        stats: Dict[str, Any] = {
            "role": role,
            "dry_run": dry_run,
            "total_scanned": 0,
            "synced_users": 0,
            "total_points_upserted": 0,
            "skipped_unchanged": 0,
            "skipped_not_ready": 0,
            "failed": 0,
            "errors": [],
            "elapsed_seconds": 0.0,
        }

        # Cache existing indexed hashes in memory for high-speed batch checking
        indexed_states = {
            s.source_id: (s.indexed_hash, s.chunk_count, s.status)
            for s in VectorIndexState.objects.filter(source_type="PROFILE")
        }

        # Stream records using database cursor
        for user in users_qs.iterator(chunk_size=batch_size):
            stats["total_scanned"] += 1
            user_id = user.id

            try:
                # 1. Readiness Check
                ready, reason = is_profile_ready(user)
                if not ready:
                    stats["skipped_not_ready"] += 1
                    if not dry_run:
                        VectorIndexState.objects.update_or_create(
                            source_type="PROFILE",
                            source_id=user_id,
                            defaults={"status": "PENDING", "last_error": f"Not ready: {reason}"},
                        )
                    continue

                # 2. Chunking & Content Hash Generation
                chunks, content_hash, _ = chunk_user_profile(user)

                # 3. Check for Changes
                if not force and user_id in indexed_states:
                    old_hash, old_chunk_count, old_status = indexed_states[user_id]
                    if old_status == "SYNCED" and old_hash == content_hash:
                        stats["skipped_unchanged"] += 1
                        continue

                # 4. Upsert (or Dry-Run Record)
                if dry_run:
                    stats["synced_users"] += 1
                    stats["total_points_upserted"] += len(chunks)
                else:
                    outcome = sync_user_profile_vector(
                        user_id=user_id,
                        force=force,
                        client=self.client,
                        sync_db_state=True,
                    )
                    status_code = outcome.get("status")

                    if status_code == "SYNCED":
                        stats["synced_users"] += 1
                        stats["total_points_upserted"] += outcome.get("chunk_count", 0)
                        indexed_states[user_id] = (content_hash, outcome.get("chunk_count", 0), "SYNCED")
                    elif status_code == "SKIPPED_UNCHANGED":
                        stats["skipped_unchanged"] += 1
                    elif status_code == "SKIPPED_NOT_READY":
                        stats["skipped_not_ready"] += 1

            except Exception as e:
                logger.error(f"Error processing user #{user_id}: {e}", exc_info=True)
                stats["failed"] += 1
                stats["errors"].append({"user_id": user_id, "error": str(e)})

                if not dry_run:
                    VectorIndexState.objects.update_or_create(
                        source_type="PROFILE",
                        source_id=user_id,
                        defaults={"status": "FAILED", "last_error": str(e)},
                    )

            if progress_callback and stats["total_scanned"] % 25 == 0:
                progress_callback(stats, scan_target)

        stats["elapsed_seconds"] = round(time.time() - start_time, 2)
        if progress_callback:
            progress_callback(stats, scan_target)

        return stats
