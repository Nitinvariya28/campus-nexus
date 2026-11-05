from rest_framework import serializers

CATEGORY_CHOICES = ["ALL", "PLACEMENT_CELL", "NSU", "INTERVIEW_PREP", "INDUSTRY_TECH", "GENERAL"]


class ChatMessageSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=["user", "assistant", "system"])
    content = serializers.CharField(max_length=2000)


class ChatRequestSerializer(serializers.Serializer):
    question = serializers.CharField(
        required=True,
        min_length=3,
        max_length=1000,
        error_messages={
            "required": "Question is required.",
            "min_length": "Question must contain at least 3 characters.",
            "max_length": "Question cannot exceed 1,000 characters.",
        },
    )
    category = serializers.CharField(required=False, default="ALL", allow_blank=True)
    conversation_history = serializers.ListField(
        child=ChatMessageSerializer(),
        required=False,
        default=list,
    )

    def validate_category(self, value):
        if not value or not value.strip():
            return "ALL"
        clean_val = value.strip().upper()
        if clean_val == "PLACEMENT":
            return "PLACEMENT_CELL"
        return clean_val


class CitationSerializer(serializers.Serializer):
    source_number = serializers.IntegerField()
    document_id = serializers.CharField()
    title = serializers.CharField()
    section = serializers.CharField()
    relevance_score = serializers.FloatField()


class ChatResponseSerializer(serializers.Serializer):
    status = serializers.CharField()
    answer = serializers.CharField()
    category = serializers.CharField()
    retrieval_mode = serializers.CharField()
    citations = serializers.ListField(child=CitationSerializer())
    confidence_score = serializers.FloatField()
    suggested_followups = serializers.ListField(child=serializers.CharField())
