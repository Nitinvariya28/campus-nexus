import logging
import warnings
from typing import Dict, Any, List
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, PayloadSchemaType
from apps.ai_module.vector_store.client import get_qdrant_client

logger = logging.getLogger(__name__)

# Collection Names (4 Domain-Segregated Collections)
COLLECTION_STUDENT_VECTORS = "student_vectors"
COLLECTION_ALUMNI_VECTORS = "alumni_vectors"
COLLECTION_OPPORTUNITY_POST_VECTORS = "opportunity_post_vectors"
COLLECTION_KNOWLEDGE_VECTORS = "knowledge_vectors"

ALL_COLLECTIONS = [
    COLLECTION_STUDENT_VECTORS,
    COLLECTION_ALUMNI_VECTORS,
    COLLECTION_OPPORTUNITY_POST_VECTORS,
    COLLECTION_KNOWLEDGE_VECTORS,
]

DEFAULT_VECTOR_SIZE = 384
DEFAULT_DISTANCE = Distance.COSINE


class CollectionManager:
    """
    Manages the lifecycle and schema provisioning for all 4 Qdrant collections.
    Does NOT insert any data points — handles strictly collection structures and indexes.
    """

    def __init__(self, client: QdrantClient = None):
        self.client = client or get_qdrant_client()

    def ensure_collections_exist(self) -> Dict[str, str]:
        """
        Idempotently verifies or creates all 4 Qdrant collections.
        Returns a dictionary mapping collection name to outcome status ('created' or 'already_exists').
        """
        results = {}
        for collection_name in ALL_COLLECTIONS:
            if not self.client.collection_exists(collection_name):
                self.client.create_collection(
                    collection_name=collection_name,
                    vectors_config=VectorParams(
                        size=DEFAULT_VECTOR_SIZE,
                        distance=DEFAULT_DISTANCE,
                    ),
                )
                logger.info(f"Created Qdrant collection: {collection_name}")
                results[collection_name] = "created"
            else:
                logger.debug(f"Collection already exists: {collection_name}")
                results[collection_name] = "already_exists"

        # Provision payload schema indexes after ensuring collections exist
        self.create_payload_indexes()
        return results

    def create_payload_indexes(self):
        """
        Provisions payload field indexes across all 4 collections for sub-millisecond filtering.
        In local embedded Qdrant, payload filters execute in-memory; indexes are registered for server compatibility.
        """
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", UserWarning)
            # 1. Full-field Indexes for student_vectors
            self._safe_create_index(COLLECTION_STUDENT_VECTORS, "mysql_user_id", PayloadSchemaType.INTEGER)
            self._safe_create_index(COLLECTION_STUDENT_VECTORS, "department_id", PayloadSchemaType.INTEGER)
            self._safe_create_index(COLLECTION_STUDENT_VECTORS, "batch_id", PayloadSchemaType.INTEGER)
            self._safe_create_index(COLLECTION_STUDENT_VECTORS, "semester", PayloadSchemaType.INTEGER)
            self._safe_create_index(COLLECTION_STUDENT_VECTORS, "chunk_type", PayloadSchemaType.KEYWORD)
            self._safe_create_index(COLLECTION_STUDENT_VECTORS, "is_active", PayloadSchemaType.BOOL)

            # 2. Full-field Indexes for alumni_vectors
            self._safe_create_index(COLLECTION_ALUMNI_VECTORS, "mysql_user_id", PayloadSchemaType.INTEGER)
            self._safe_create_index(COLLECTION_ALUMNI_VECTORS, "company_id", PayloadSchemaType.INTEGER)
            self._safe_create_index(COLLECTION_ALUMNI_VECTORS, "department_id", PayloadSchemaType.INTEGER)
            self._safe_create_index(COLLECTION_ALUMNI_VECTORS, "job_category", PayloadSchemaType.KEYWORD)
            self._safe_create_index(COLLECTION_ALUMNI_VECTORS, "company_tier", PayloadSchemaType.KEYWORD)
            self._safe_create_index(COLLECTION_ALUMNI_VECTORS, "experience_years", PayloadSchemaType.FLOAT)
            self._safe_create_index(COLLECTION_ALUMNI_VECTORS, "chunk_type", PayloadSchemaType.KEYWORD)
            self._safe_create_index(COLLECTION_ALUMNI_VECTORS, "is_active", PayloadSchemaType.BOOL)

            # 3. Full-field Indexes for opportunity_post_vectors
            self._safe_create_index(COLLECTION_OPPORTUNITY_POST_VECTORS, "post_id", PayloadSchemaType.INTEGER)
            self._safe_create_index(COLLECTION_OPPORTUNITY_POST_VECTORS, "company_id", PayloadSchemaType.INTEGER)
            self._safe_create_index(COLLECTION_OPPORTUNITY_POST_VECTORS, "status", PayloadSchemaType.KEYWORD)
            self._safe_create_index(COLLECTION_OPPORTUNITY_POST_VECTORS, "opportunity_type", PayloadSchemaType.KEYWORD)
            self._safe_create_index(COLLECTION_OPPORTUNITY_POST_VECTORS, "company_tier", PayloadSchemaType.KEYWORD)
            self._safe_create_index(COLLECTION_OPPORTUNITY_POST_VECTORS, "author_role", PayloadSchemaType.KEYWORD)
            self._safe_create_index(COLLECTION_OPPORTUNITY_POST_VECTORS, "eligible_department_ids", PayloadSchemaType.INTEGER)
            self._safe_create_index(COLLECTION_OPPORTUNITY_POST_VECTORS, "eligible_batch_ids", PayloadSchemaType.INTEGER)
            self._safe_create_index(COLLECTION_OPPORTUNITY_POST_VECTORS, "is_active", PayloadSchemaType.BOOL)

            # 4. Full-field Indexes for knowledge_vectors
            self._safe_create_index(COLLECTION_KNOWLEDGE_VECTORS, "source_id", PayloadSchemaType.KEYWORD)
            self._safe_create_index(COLLECTION_KNOWLEDGE_VECTORS, "category", PayloadSchemaType.KEYWORD)
            self._safe_create_index(COLLECTION_KNOWLEDGE_VECTORS, "company_id", PayloadSchemaType.INTEGER)
            self._safe_create_index(COLLECTION_KNOWLEDGE_VECTORS, "access_level", PayloadSchemaType.KEYWORD)

    def _safe_create_index(self, collection_name: str, field_name: str, schema_type: PayloadSchemaType):
        """Safely creates a payload index without failing if it already exists."""
        try:
            self.client.create_payload_index(
                collection_name=collection_name,
                field_name=field_name,
                field_schema=schema_type,
            )
            logger.debug(f"Created payload index '{field_name}' on '{collection_name}'")
        except Exception as e:
            logger.debug(f"Payload index '{field_name}' on '{collection_name}': {e}")

    def get_collections_status(self) -> Dict[str, Any]:
        """
        Inspects all 4 collections and returns their structural status (dimension, distance, point counts).
        """
        status_report = {}
        for name in ALL_COLLECTIONS:
            if self.client.collection_exists(name):
                info = self.client.get_collection(collection_name=name)
                vectors_cfg = info.config.params.vectors
                dim = getattr(vectors_cfg, "size", DEFAULT_VECTOR_SIZE)
                dist = getattr(vectors_cfg, "distance", DEFAULT_DISTANCE)
                status_report[name] = {
                    "exists": True,
                    "status": str(info.status),
                    "points_count": info.points_count,
                    "vector_dimension": dim,
                    "distance_metric": str(dist),
                }
            else:
                status_report[name] = {
                    "exists": False,
                    "status": "NOT_FOUND",
                    "points_count": 0,
                }
        return status_report
