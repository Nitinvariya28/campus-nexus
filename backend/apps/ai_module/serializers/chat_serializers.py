from rest_framework import serializers

CATEGORY_CHOICES = ["ALL", "PLACEMENT_CELL", "NIRMA", "NSU", "INTERVIEW_PREP", "INDUSTRY_TECH", "GENERAL"]


class ChatMessageSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=["user", "assistant", "system"])
    content = serializers.CharField(max_length=100000, required=False, allow_blank=True, default="")

    def validate_content(self, value):
        # Gracefully truncate if client passes very long previous response
        if value and len(value) > 4000:
            return value[:4000]
        return value or ""


class ChatRequestSerializer(serializers.Serializer):
    question = serializers.CharField(required=False, allow_blank=True, default="")
    message = serializers.CharField(required=False, allow_blank=True, default="")
    category = serializers.CharField(required=False, default="ALL", allow_blank=True)
    conversation_history = serializers.ListField(
        child=ChatMessageSerializer(),
        required=False,
        default=list,
    )

    def validate(self, attrs):
        raw_text = (attrs.get("question") or attrs.get("message") or "").strip()
        if not raw_text:
            raise serializers.ValidationError({"question": "Please enter a question or message."})
        if len(raw_text) > 1000:
            raise serializers.ValidationError({"question": "Question cannot exceed 1,000 characters."})

        attrs["question"] = raw_text
        return attrs

    def validate_category(self, value):
        if not value or not value.strip():
            return "ALL"
        clean_val = value.strip().upper()
        if clean_val == "PLACEMENT":
            return "PLACEMENT_CELL"
        if clean_val in ["NSU", "NIRMA", "NIRMA UNIVERSITY"]:
            return "NIRMA"
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
