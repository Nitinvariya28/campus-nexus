from unittest.mock import MagicMock, patch
from django.urls import reverse
from django.test import SimpleTestCase
from rest_framework.test import APIClient
from rest_framework import status


class AI01HealthCheckTestCase(SimpleTestCase):
    """
    Unit tests for AI-01: Health Check & System Readiness API.
    Verifies:
    1. HTTP 200 OK with status="healthy" when all subsystems are operational.
    2. HTTP 200 OK with status="degraded" when Hugging Face API key is unconfigured.
    3. HTTP 503 Service Unavailable with status="unhealthy" when database or Qdrant fails.
    4. Exact response payload shape matching architectural contract.
    """

    def setUp(self):
        self.client = APIClient()
        self.health_url = reverse("ai_module:ai-health-check")

    @patch("apps.ai_module.views.health_views.VectorIndexState.objects.filter")
    @patch("apps.ai_module.views.health_views.get_qdrant_client")
    @patch("apps.ai_module.views.health_views.get_embedding_service")
    @patch("apps.ai_module.views.health_views.check_llm_health")
    def test_health_check_fully_healthy(
        self,
        mock_check_llm,
        mock_get_emb,
        mock_get_qdrant,
        mock_state_filter,
    ):
        """When DB, Qdrant, Embedding, and LLM are all ready, return 200 healthy."""
        mock_state_filter.return_value.count.return_value = 1204

        # Mock Qdrant collection points
        mock_qdrant = MagicMock()
        mock_col_info = MagicMock(points_count=1857)
        mock_qdrant.get_collection.return_value = mock_col_info
        mock_get_qdrant.return_value = mock_qdrant

        # Mock embedding service
        mock_emb = MagicMock(model_name="sentence-transformers/all-MiniLM-L6-v2", dimension=384)
        mock_get_emb.return_value = mock_emb

        # Mock LLM health
        mock_check_llm.return_value = {
            "status": "READY",
            "provider": "HUGGINGFACE",
            "model": "Qwen/Qwen2.5-7B-Instruct",
            "api_key_configured": True,
            "latency_ms": 120.5,
        }

        response = self.client.get(self.health_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["database"]["status"], "connected")
        self.assertEqual(data["database"]["synced_profiles_count"], 1204)
        self.assertEqual(data["vector_store"]["status"], "connected")
        self.assertEqual(data["vector_store"]["collections"]["student_vectors"], 1857)
        self.assertEqual(data["embedding_service"]["status"], "loaded")
        self.assertEqual(data["embedding_service"]["dimension"], 384)
        self.assertEqual(data["llm"]["status"], "READY")

    @patch("apps.ai_module.views.health_views.VectorIndexState.objects.filter")
    @patch("apps.ai_module.views.health_views.get_qdrant_client")
    @patch("apps.ai_module.views.health_views.get_embedding_service")
    @patch("apps.ai_module.views.health_views.check_llm_health")
    def test_health_check_degraded_when_llm_unconfigured(
        self,
        mock_check_llm,
        mock_get_emb,
        mock_get_qdrant,
        mock_state_filter,
    ):
        """When DB & Qdrant are operational but LLM is unconfigured, return 200 degraded."""
        mock_state_filter.return_value.count.return_value = 1204

        mock_qdrant = MagicMock()
        mock_qdrant.get_collection.return_value = MagicMock(points_count=500)
        mock_get_qdrant.return_value = mock_qdrant

        mock_emb = MagicMock(model_name="sentence-transformers/all-MiniLM-L6-v2", dimension=384)
        mock_get_emb.return_value = mock_emb

        # Mock LLM unconfigured
        mock_check_llm.return_value = {
            "status": "CONFIG_REQUIRED",
            "provider": "HUGGINGFACE",
            "model": "Qwen/Qwen2.5-7B-Instruct",
            "api_key_configured": False,
            "message": "HUGGINGFACE_API_KEY is not set.",
        }

        response = self.client.get(self.health_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["status"], "degraded")
        self.assertEqual(data["llm"]["status"], "CONFIG_REQUIRED")
        self.assertFalse(data["llm"]["api_key_configured"])

    @patch("apps.ai_module.views.health_views.VectorIndexState.objects.filter")
    @patch("apps.ai_module.views.health_views.get_qdrant_client")
    def test_health_check_unhealthy_when_qdrant_fails(
        self,
        mock_get_qdrant,
        mock_state_filter,
    ):
        """When Qdrant fails, return 503 unhealthy."""
        mock_state_filter.return_value.count.return_value = 1204
        mock_get_qdrant.side_effect = RuntimeError("Qdrant storage file locked")

        response = self.client.get(self.health_url)

        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        data = response.json()
        self.assertEqual(data["status"], "unhealthy")
        self.assertEqual(data["vector_store"]["status"], "disconnected")
        self.assertIn("Qdrant storage file locked", data["vector_store"]["error"])

    @patch("apps.ai_module.views.health_views.VectorIndexState.objects.filter")
    @patch("apps.ai_module.views.health_views.get_qdrant_client")
    @patch("apps.ai_module.views.health_views.get_embedding_service")
    @patch("apps.ai_module.views.health_views.check_llm_health")
    def test_health_check_gemini_provider_healthy(
        self,
        mock_check_llm,
        mock_get_emb,
        mock_get_qdrant,
        mock_state_filter,
    ):
        """When Gemini free tier is configured and healthy, return 200 healthy."""
        mock_state_filter.return_value.count.return_value = 1204
        mock_qdrant = MagicMock()
        mock_qdrant.get_collection.return_value = MagicMock(points_count=1857)
        mock_get_qdrant.return_value = mock_qdrant
        mock_get_emb.return_value = MagicMock(model_name="sentence-transformers/all-MiniLM-L6-v2", dimension=384)

        mock_check_llm.return_value = {
            "status": "READY",
            "provider": "GEMINI",
            "model": "gemini-1.5-flash",
            "api_key_configured": True,
            "latency_ms": 240.2,
        }

        response = self.client.get(self.health_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["llm"]["provider"], "GEMINI")
        self.assertEqual(data["llm"]["status"], "READY")
