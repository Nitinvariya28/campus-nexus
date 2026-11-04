import logging
from django.utils import timezone
from django.db import connection
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

from apps.ai_module.models import VectorIndexState
from apps.ai_module.vector_store.client import get_qdrant_client
from apps.ai_module.vector_store.collection_manager import (
    COLLECTION_STUDENT_VECTORS,
    COLLECTION_ALUMNI_VECTORS,
    COLLECTION_OPPORTUNITY_POST_VECTORS,
    COLLECTION_KNOWLEDGE_VECTORS,
)
from apps.ai_module.vector_store.embedding_service import get_embedding_service
from apps.ai_module.llm.client import check_llm_health

logger = logging.getLogger(__name__)


class HealthCheckView(APIView):
    """
    AI-01: Health Check & System Readiness API.
    Inspects and reports real-time connectivity and readiness metrics across:
    1. MySQL relational database & Technical Table 31 (VectorIndexState)
    2. Local persistent Qdrant vector database & collection point counts
    3. Sentence-Transformers local embedding model
    4. Hugging Face free serverless LLM generation engine
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        is_database_healthy = False
        synced_count = 0
        db_error = None

        # 1. Inspect MySQL Relational Database
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            is_database_healthy = True
            synced_count = VectorIndexState.objects.filter(status="SYNCED").count()
        except Exception as e:
            logger.error(f"[AI-01 Health Check] MySQL connection error: {e}", exc_info=True)
            db_error = str(e)

        # 2. Inspect Qdrant Vector Engine
        is_qdrant_healthy = False
        collection_stats = {}
        qdrant_error = None

        try:
            client = get_qdrant_client()
            for col_name in [
                COLLECTION_STUDENT_VECTORS,
                COLLECTION_ALUMNI_VECTORS,
                COLLECTION_OPPORTUNITY_POST_VECTORS,
                COLLECTION_KNOWLEDGE_VECTORS,
            ]:
                try:
                    info = client.get_collection(col_name)
                    collection_stats[col_name] = info.points_count
                except Exception:
                    collection_stats[col_name] = 0
            is_qdrant_healthy = True
        except Exception as e:
            logger.error(f"[AI-01 Health Check] Qdrant connection error: {e}", exc_info=True)
            qdrant_error = str(e)

        # 3. Inspect SentenceTransformers Embedding Service
        is_embedding_healthy = False
        embedding_meta = {}

        try:
            emb_service = get_embedding_service()
            is_embedding_healthy = True
            embedding_meta = {
                "status": "loaded",
                "model": emb_service.model_name,
                "dimension": emb_service.dimension,
            }
        except Exception as e:
            logger.error(f"[AI-01 Health Check] Embedding model error: {e}", exc_info=True)
            embedding_meta = {
                "status": "error",
                "error": str(e),
            }

        # 4. Inspect LLM Generation Service (Hugging Face)
        llm_meta = check_llm_health()

        # 5. Determine Overall System Status
        if is_database_healthy and is_qdrant_healthy and is_embedding_healthy:
            if llm_meta.get("status") == "READY":
                overall_status = "healthy"
            else:
                # Core vector retrieval operates 100%, but generative features require token
                overall_status = "degraded"
        else:
            overall_status = "unhealthy"

        payload = {
            "status": overall_status,
            "timestamp": timezone.now().isoformat(),
            "database": {
                "status": "connected" if is_database_healthy else "disconnected",
                "synced_profiles_count": synced_count,
                **({"error": db_error} if db_error else {}),
            },
            "vector_store": {
                "status": "connected" if is_qdrant_healthy else "disconnected",
                "engine": "Qdrant",
                "storage_path": str(getattr(settings, "QDRANT_STORAGE_PATH", "")),
                "collections": collection_stats,
                **({"error": qdrant_error} if qdrant_error else {}),
            },
            "embedding_service": embedding_meta,
            "llm": llm_meta,
        }

        http_status = status.HTTP_200_OK if overall_status in ("healthy", "degraded") else status.HTTP_503_SERVICE_UNAVAILABLE
        return Response(payload, status=http_status)
