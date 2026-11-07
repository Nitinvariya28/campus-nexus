import logging
from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.ai_module.rag.generator import RAGResponseGenerator
from apps.ai_module.serializers.chat_serializers import (
    ChatRequestSerializer,
    ChatResponseSerializer,
)

logger = logging.getLogger(__name__)


class ChatbotView(APIView):
    """
    AI-06: RAG-Based Intelligent Campus & Placement Chatbot.
    Answers student and alumni questions regarding university regulations,
    placement cell eligibility, tiered recruitment policies, and interview preparation.
    Enforces strict PII protection, safety guardrails, MMR diversity retrieval,
    and mandatory source citations.

    POST /api/ai/chat/
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._generator = None

    @property
    def generator(self) -> RAGResponseGenerator:
        """Lazy-loaded RAG response orchestrator."""
        if self._generator is None:
            self._generator = RAGResponseGenerator()
        return self._generator

    def post(self, request):
        serializer = ChatRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        question = serializer.validated_data["question"]
        category = serializer.validated_data.get("category", "ALL")
        conversation_history = serializer.validated_data.get("conversation_history", [])

        try:
            result = self.generator.generate_response(
                question=question,
                category=category,
                conversation_history=conversation_history,
            )
            if isinstance(result, dict):
                ans = result.get("answer", "")
                result["reply"] = ans
                result["answer"] = ans
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"[Chatbot View] Unexpected error processing query '{question[:60]}': {e}", exc_info=True)
            return Response(
                {
                    "status": "ERROR",
                    "answer": (
                        "An unexpected error occurred while processing your request. "
                        "Please try again or contact the Placement Cell directly."
                    ),
                    "category": category,
                    "retrieval_mode": "ERROR",
                    "citations": [],
                    "confidence_score": 0.0,
                    "suggested_followups": [
                        "What are the general placement eligibility criteria?",
                        "What is the official academic calendar schedule?",
                    ],
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
