import logging
from typing import Any, Dict, List, Optional, Union
from django.utils import timezone
from qdrant_client import QdrantClient
from qdrant_client.http import models

from apps.ai_module.vector_store.client import get_qdrant_client
from apps.ai_module.vector_store.collection_manager import (
    COLLECTION_STUDENT_VECTORS,
    COLLECTION_ALUMNI_VECTORS,
    COLLECTION_OPPORTUNITY_POST_VECTORS,
)
from apps.ai_module.vector_store.embedding_service import get_embedding_service
from apps.ai_module.vector_store.point_id_generator import generate_post_point_id
from apps.ai_module.indexing.profile_document_builder import (
    get_user_with_full_profile,
    is_profile_ready,
)
from apps.ai_module.indexing.profile_chunker import (
    chunk_user_profile,
    ProfileChunk,
)
from apps.ai_module.models import VectorIndexState

logger = logging.getLogger(__name__)


def get_target_collection_for_role(role: str) -> str:
    """Returns the dedicated collection name for a given user role."""
    if role == "STUDENT":
        return COLLECTION_STUDENT_VECTORS
    elif role == "ALUMNI":
        return COLLECTION_ALUMNI_VECTORS
    raise ValueError(f"Role '{role}' does not have a dedicated profile vector collection.")


def delete_user_vectors(
    user_id: int,
    role: Optional[str] = None,
    client: Optional[QdrantClient] = None
) -> int:
    """
    Deletes all vector points belonging to a specific user using a FilterSelector on mysql_user_id.
    Executes in sub-millisecond time due to the payload index.
    
    If role is None, cleanses both student_vectors and alumni_vectors (useful during role transition).
    Returns the number of collections cleaned.
    """
    client = client or get_qdrant_client()
    target_collections = []

    if role == "STUDENT":
        target_collections = [COLLECTION_STUDENT_VECTORS]
    elif role == "ALUMNI":
        target_collections = [COLLECTION_ALUMNI_VECTORS]
    else:
        target_collections = [COLLECTION_STUDENT_VECTORS, COLLECTION_ALUMNI_VECTORS]

    cleaned_count = 0
    filter_selector = models.FilterSelector(
        filter=models.Filter(
            must=[
                models.FieldCondition(
                    key="mysql_user_id",
                    match=models.MatchValue(value=int(user_id))
                )
            ]
        )
    )

    for col in target_collections:
        try:
            client.delete(
                collection_name=col,
                points_selector=filter_selector
            )
            logger.info(f"Deleted existing vectors for user #{user_id} in collection '{col}'")
            cleaned_count += 1
        except Exception as e:
            logger.warning(f"Failed deleting points for user #{user_id} in collection '{col}': {e}")

    return cleaned_count


def soft_delete_user_vectors(
    user_id: int,
    role: str,
    is_active: bool = False,
    client: Optional[QdrantClient] = None
):
    """
    Sets the 'is_active' payload flag in Qdrant for all points of a user.
    Instant search exclusion without physically dropping vectors.
    """
    client = client or get_qdrant_client()
    collection_name = get_target_collection_for_role(role)

    user_filter = models.Filter(
        must=[
            models.FieldCondition(
                key="mysql_user_id",
                match=models.MatchValue(value=int(user_id))
            )
        ]
    )

    client.set_payload(
        collection_name=collection_name,
        payload={"is_active": bool(is_active)},
        points=user_filter
    )
    logger.info(f"Updated is_active={is_active} for user #{user_id} in '{collection_name}'")


def upsert_user_chunks(
    user_id: int,
    role: str,
    chunks: List[ProfileChunk],
    content_hash: str,
    client: Optional[QdrantClient] = None,
    sync_db_state: bool = True,
) -> int:
    """
    Atomically upserts a user's semantic chunks into Qdrant:
    1. Executes a filter delete on mysql_user_id to prevent any orphaned chunks (Scenario 2).
    2. Encodes chunk texts into 384-dimensional dense vectors in a single batch.
    3. Upserts new points with deterministic UUID5 IDs and sanitized payloads.
    4. Updates MySQL Table 31 (VectorIndexState) with sync metadata.
    """
    if not chunks:
        return 0

    client = client or get_qdrant_client()
    collection_name = get_target_collection_for_role(role)

    # 1. Clean delete to guarantee zero orphaned chunks (e.g. if chunk count reduced)
    delete_user_vectors(user_id=user_id, role=role, client=client)

    # 2. Batch encode all chunk texts
    texts = [c.text for c in chunks]
    embeddings = get_embedding_service().embed_documents(texts)

    # 3. Assemble PointStruct objects
    points = []
    for chunk, vector in zip(chunks, embeddings):
        point = models.PointStruct(
            id=chunk.point_id,
            vector=vector,
            payload=chunk.payload
        )
        points.append(point)

    # 4. Upsert into Qdrant
    client.upsert(
        collection_name=collection_name,
        points=points
    )
    logger.info(f"Upserted {len(points)} vector chunks for user #{user_id} into '{collection_name}'")

    # 5. Update Technical Table 31 (VectorIndexState)
    if sync_db_state:
        try:
            state, _ = VectorIndexState.objects.get_or_create(
                source_type="PROFILE",
                source_id=user_id,
                defaults={
                    "status": "PENDING",
                    "embedding_model": "all-MiniLM-L6-v2",
                    "schema_version": 1,
                }
            )
            state.status = "SYNCED"
            state.source_hash = content_hash
            state.indexed_hash = content_hash
            state.chunk_count = len(points)
            state.synced_at = timezone.now()
            state.last_error = None
            state.save()
        except Exception as e:
            logger.warning(f"Could not update VectorIndexState for user #{user_id}: {e}")

    return len(points)


def delete_opportunity_vector(post_id: int, client: Optional[QdrantClient] = None):
    """Deletes an Opportunity or Post vector point from opportunity_post_vectors."""
    client = client or get_qdrant_client()
    point_id = generate_post_point_id(post_id)

    client.delete(
        collection_name=COLLECTION_OPPORTUNITY_POST_VECTORS,
        points_selector=models.PointIdsList(points=[point_id])
    )
    logger.info(f"Deleted vector for Opportunity #{post_id} from '{COLLECTION_OPPORTUNITY_POST_VECTORS}'")


def sync_user_profile_vector(
    user_id: int,
    force: bool = False,
    client: Optional[QdrantClient] = None,
    sync_db_state: bool = True,
) -> Dict[str, Any]:
    """
    High-level synchronization orchestrator for a user profile:
    1. Loads full user profile with optimized prefetching.
    2. Evaluates profile readiness. If not ready, skips.
    3. Checks SHA-256 content_hash against VectorIndexState. If unchanged, skips (0 compute).
    4. Chunks, embeds, and upserts to Qdrant.
    """
    user = get_user_with_full_profile(user_id)

    # Handle account deactivation
    if not getattr(user, "is_active", True):
        delete_user_vectors(user_id=user_id, client=client)
        if sync_db_state:
            VectorIndexState.objects.filter(source_type="PROFILE", source_id=user_id).update(
                status="DELETE_PENDING"
            )
        return {"status": "DEACTIVATED", "user_id": user_id, "chunk_count": 0}

    # Evaluate readiness
    ready, reason = is_profile_ready(user)
    if not ready:
        if sync_db_state:
            VectorIndexState.objects.filter(source_type="PROFILE", source_id=user_id).update(
                status="PENDING",
                last_error=f"Profile not ready: {reason}"
            )
        return {"status": "SKIPPED_NOT_READY", "user_id": user_id, "reason": reason}

    # Generate semantic chunks and SHA-256 hash
    chunks, content_hash, metadata = chunk_user_profile(user)

    # Check for changes in MySQL Table 31
    if sync_db_state and not force:
        existing_state = VectorIndexState.objects.filter(
            source_type="PROFILE",
            source_id=user_id
        ).first()

        if (
            existing_state
            and existing_state.status == "SYNCED"
            and existing_state.indexed_hash == content_hash
        ):
            return {
                "status": "SKIPPED_UNCHANGED",
                "user_id": user_id,
                "chunk_count": existing_state.chunk_count,
                "hash": content_hash,
            }

    # Upsert new vectors
    points_count = upsert_user_chunks(
        user_id=user_id,
        role=user.role,
        chunks=chunks,
        content_hash=content_hash,
        client=client,
        sync_db_state=sync_db_state,
    )

    return {
        "status": "SYNCED",
        "user_id": user_id,
        "role": user.role,
        "chunk_count": points_count,
        "hash": content_hash,
    }
