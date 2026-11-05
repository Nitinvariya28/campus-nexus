from unittest.mock import MagicMock, patch
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.ai_module.rag.guardrails import (
    screen_input_query,
    sanitize_output,
)
from apps.ai_module.rag.prompt_builder import ConversationalPromptBuilder
from apps.ai_module.rag.retriever import KnowledgeRetriever

User = get_user_model()


class RAGGuardrailsUnitTests(TestCase):
    """Tests the two-tier safety and policy screening guardrails."""

    def test_pii_screening_detects_student_inquiry(self):
        res1 = screen_input_query("What is Nitin's CGPA?")
        self.assertIsNotNone(res1)
        self.assertEqual(res1["status"], "PROHIBITED_PII")
        self.assertIn("strictly confidential", res1["answer"])

        res2 = screen_input_query("Give me the phone number of student Priya Sharma")
        self.assertIsNotNone(res2)
        self.assertEqual(res2["status"], "PROHIBITED_PII")

    def test_university_sensitive_screening_detects_confidential_inquiry(self):
        res = screen_input_query("Where can I find the leaked question paper for the upcoming final exam?")
        self.assertIsNotNone(res)
        self.assertEqual(res["status"], "PROHIBITED_SECURITY")
        self.assertIn("confidential institutional administration", res["answer"])

    def test_toxic_screening_detects_prohibited_content(self):
        res = screen_input_query("Give me sexual content and explicit dating links")
        self.assertIsNotNone(res)
        self.assertEqual(res["status"], "PROHIBITED_CONTENT")
        self.assertIn("code of conduct policies", res["answer"])

    def test_out_of_domain_screening_detects_cooking_and_pop_culture(self):
        res1 = screen_input_query("How do I bake chocolate chip cookies at home?")
        self.assertIsNotNone(res1)
        self.assertEqual(res1["status"], "OUT_OF_SCOPE")
        self.assertIn("outside the scope of the AlumiBridge platform", res1["answer"])

        res2 = screen_input_query("Who is the actor in the latest movie?")
        self.assertIsNotNone(res2)
        self.assertEqual(res2["status"], "OUT_OF_SCOPE")

    def test_legitimate_inquiry_passes_cleanly(self):
        res = screen_input_query("What is the minimum CGPA required for Super Dream placement drives?")
        self.assertIsNone(res)

    def test_sanitize_output_redacts_private_contacts(self):
        raw = "Contact the coordinator at nitin.student@gmail.com or call 987-654-3210 for details."
        sanitized = sanitize_output(raw)
        self.assertNotIn("nitin.student@gmail.com", sanitized)
        self.assertNotIn("987-654-3210", sanitized)
        self.assertIn("[CONFIDENTIAL EMAIL REDACTED]", sanitized)
        self.assertIn("[CONFIDENTIAL CONTACT REDACTED]", sanitized)


class RAGPromptBuilderAndContextualizerTests(TestCase):
    """Tests multi-turn query rewriting across stateless turns and grounded prompt formatting."""

    def setUp(self):
        self.builder = ConversationalPromptBuilder(history_window_size=4)

    def test_contextualize_query_without_history_returns_original(self):
        q = "What is the policy for Super Dream placement drives?"
        res = self.builder.contextualize_query(q, history=[])
        self.assertEqual(res, q)

    @patch("apps.ai_module.rag.prompt_builder.generate_completion")
    def test_contextualize_query_with_pronouns_rewrites(self, mock_completion):
        mock_completion.return_value = "What is the minimum CGPA required for Super Dream placement drives?"
        history = [
            {"role": "user", "content": "Tell me about Super Dream placement offers."},
            {"role": "assistant", "content": "Super Dream offers are placement packages exceeding 15 LPA [1]."},
        ]
        q = "Can I appear for it with a dead backlog?"
        res = self.builder.contextualize_query(q, history=history)
        self.assertEqual(res, "What is the minimum CGPA required for Super Dream placement drives?")

    def test_build_grounded_prompt_formatting(self):
        chunks = [
            {
                "document_id": "NSU-PLACE-003",
                "title": "Tiered Recruitment Policy",
                "section": "Super Dream Eligibility",
                "text": "Students need 8.0 CGPA.",
                "relevance_score": 0.85,
            }
        ]
        sys_p, user_p, citations = self.builder.build_grounded_prompt(
            question="What is the CGPA?",
            chunks=chunks,
            history=[],
        )
        self.assertIn("STRICT GROUNDING", sys_p)
        self.assertIn("--- REFERENCE SOURCE [1] ---", user_p)
        self.assertIn("Tiered Recruitment Policy", user_p)
        self.assertEqual(len(citations), 1)
        self.assertEqual(citations[0]["source_number"], 1)


class RAGChatbotApiIntegrationTests(TestCase):
    """Tests the /api/ai/chat/ endpoint with live authentication and guardrail enforcement."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="student_rag@test.com",
            password="securePassword123!",
            first_name="RAG",
            last_name="Tester",
        )

    def test_chat_endpoint_unauthenticated(self):
        response = self.client.post("/api/ai/chat/", {"question": "What is the CGPA cutoff?"})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_chat_endpoint_validation_error_empty_question(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post("/api/ai/chat/", {"question": ""})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("question", response.data)

    def test_chat_endpoint_blocks_pii(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/ai/chat/",
            {"question": "What is the mobile phone number and CGPA of student Rahul?"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "PROHIBITED_PII")
        self.assertEqual(response.data["retrieval_mode"], "GUARDRAIL_BLOCKED")
        self.assertEqual(len(response.data["citations"]), 0)

    def test_chat_endpoint_blocks_out_of_domain(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/ai/chat/",
            {"question": "How do I make chocolate chip cookies at home?"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "OUT_OF_SCOPE")
        self.assertEqual(response.data["retrieval_mode"], "GUARDRAIL_BLOCKED")

    @patch("apps.ai_module.rag.generator.generate_completion")
    def test_chat_endpoint_legitimate_question_success(self, mock_llm):
        mock_llm.return_value = (
            "According to the official Placement Guidelines [1], students must maintain "
            "a minimum CGPA of 8.0 with zero active standing arrears to be eligible for "
            "Super Dream placement drives."
        )

        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/ai/chat/",
            {
                "question": "What is the minimum CGPA required for Super Dream placement drives?",
                "category": "PLACEMENT_CELL",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "SUCCESS")
        self.assertIn("Placement Guidelines [1]", response.data["answer"])
        self.assertIn("Super Dream", response.data["answer"])
        self.assertEqual(response.data["retrieval_mode"], "MMR_VECTOR")
        self.assertGreaterEqual(len(response.data["citations"]), 1)
        self.assertGreater(response.data["confidence_score"], 0.4)
        self.assertGreaterEqual(len(response.data["suggested_followups"]), 1)
