import logging
from typing import Any, Dict, Optional
from django.db import transaction
from django.contrib.auth import get_user_model

from apps.ai_module.vector_store.client import get_qdrant_client
from apps.ai_module.vector_store.vector_lifecycle import (
    sync_user_profile_vector,
    delete_user_vectors,
    soft_delete_user_vectors,
)
from apps.ai_module.models import VectorIndexState

logger = logging.getLogger(__name__)

User = get_user_model()


def schedule_profile_sync(user_id: int, force: bool = False) -> None:
    """
    Schedules real-time profile vector synchronization upon MySQL transaction commit.
    Guarantees relational data is safely committed before vector generation begins.
    """
    def _execute_sync():
        try:
            logger.info(f"[AI Sync] Executing post-commit vector sync for User #{user_id}")
            result = sync_user_profile_vector(user_id=user_id, force=force, sync_db_state=True)
            logger.info(f"[AI Sync] User #{user_id} sync result: {result.get('status')}")
        except Exception as e:
            logger.error(f"[AI Sync] Post-commit sync failed for User #{user_id}: {e}", exc_info=True)
            VectorIndexState.objects.update_or_create(
                source_type="PROFILE",
                source_id=user_id,
                defaults={"status": "FAILED", "last_error": str(e)},
            )

    transaction.on_commit(_execute_sync)


def schedule_profile_deletion(user_id: int, role: Optional[str] = None) -> None:
    """
    Schedules complete vector point purging from Qdrant upon account or profile deletion.
    Drops points via filter selector on mysql_user_id and cleans VectorIndexState.
    """
    def _execute_deletion():
        try:
            logger.info(f"[AI Sync] Purging Qdrant vectors for deleted User #{user_id} (role={role})")
            delete_user_vectors(user_id=user_id, role=role)
            VectorIndexState.objects.filter(source_type="PROFILE", source_id=user_id).delete()
            logger.info(f"[AI Sync] Purged vectors and Table 31 state for User #{user_id}")
        except Exception as e:
            logger.error(f"[AI Sync] Vector deletion failed for User #{user_id}: {e}", exc_info=True)

    transaction.on_commit(_execute_deletion)


def schedule_profile_deactivation(user_id: int, role: Optional[str] = None) -> None:
    """
    Schedules soft-deletion in Qdrant payloads (is_active=False) when a user deactivates.
    Preserves points for fast reactivation while excluding them from search queries.
    """
    def _execute_deactivation():
        try:
            logger.info(f"[AI Sync] Soft-deleting Qdrant vectors for deactivated User #{user_id}")
            soft_delete_user_vectors(user_id=user_id, role=role, is_active=False)
            VectorIndexState.objects.filter(
                source_type="PROFILE", source_id=user_id
            ).update(status="DEACTIVATED")
            logger.info(f"[AI Sync] Soft-deleted vectors for User #{user_id}")
        except Exception as e:
            logger.error(f"[AI Sync] Vector deactivation failed for User #{user_id}: {e}", exc_info=True)

    transaction.on_commit(_execute_deactivation)
