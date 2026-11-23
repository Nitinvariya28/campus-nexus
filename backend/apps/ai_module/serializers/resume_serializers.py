import os
from rest_framework import serializers

MAX_RESUME_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB limit


class PrimaryResumeDetailSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    file_url = serializers.CharField(allow_blank=True)
    file_type = serializers.CharField()
    created_at = serializers.DateTimeField()


class PrimaryResumeResponseSerializer(serializers.Serializer):
    has_primary_resume = serializers.BooleanField()
    resume = PrimaryResumeDetailSerializer(allow_null=True)


class ResumeAnalyzeRequestSerializer(serializers.Serializer):
    job_description = serializers.CharField(
        required=True,
        min_length=15,
        error_messages={
            "required": "Job description is required.",
            "min_length": "Job description must be at least 15 characters long.",
        },
    )
    use_primary = serializers.BooleanField(required=False, default=False)
    use_primary_resume = serializers.BooleanField(required=False, default=False)
    resume_id = serializers.IntegerField(required=False, allow_null=True, default=None)
    resume_file = serializers.FileField(required=False, allow_null=True, default=None)
    save_to_profile = serializers.BooleanField(required=False, default=False)

    def validate_resume_file(self, value):
        if value:
            # Check file extension
            _, ext = os.path.splitext(value.name)
            if ext.lower() not in [".pdf", ".docx", ".doc"]:
                raise serializers.ValidationError("Only PDF and DOCX resume formats are supported.")
            if value.size > MAX_RESUME_SIZE_BYTES:
                raise serializers.ValidationError("Resume file size must not exceed 10 MB.")
        return value

    def validate(self, attrs):
        use_primary = attrs.get("use_primary") or attrs.get("use_primary_resume") or False
        attrs["use_primary"] = use_primary
        resume_id = attrs.get("resume_id")
        resume_file = attrs.get("resume_file")

        # If user did not supply a specific file or ID and explicitly wants primary resume:
        if not resume_file and not resume_id and not use_primary:
            attrs["use_primary"] = True

        return attrs


class DimensionScoreSerializer(serializers.Serializer):
    score = serializers.FloatField()
    weight = serializers.FloatField()


class DimensionsSerializer(serializers.Serializer):
    semantic_similarity = DimensionScoreSerializer()
    skills_match = DimensionScoreSerializer()
    experience_match = DimensionScoreSerializer()
    education_match = DimensionScoreSerializer()
    formatting_parseability = DimensionScoreSerializer()


class AtsScoreResponseSerializer(serializers.Serializer):
    overall_score = serializers.FloatField()
    rating = serializers.CharField()
    dimensions = DimensionsSerializer()
    matched_skills = serializers.ListField(child=serializers.CharField())
    missing_skills = serializers.ListField(child=serializers.CharField())


class BulletPointImprovementSerializer(serializers.Serializer):
    section = serializers.CharField(required=False, allow_blank=True, default="Projects / Experience")
    original = serializers.CharField()
    improved = serializers.CharField()
    reason = serializers.CharField(required=False, allow_blank=True, default="")
    metric = serializers.CharField(required=False, allow_blank=True, default="")


class MissingKeywordsPrioritySerializer(serializers.Serializer):
    high = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    medium = serializers.ListField(child=serializers.CharField(), required=False, default=list)


class KeywordPlacementAdviceSerializer(serializers.Serializer):
    keyword = serializers.CharField()
    recommended_section = serializers.CharField(required=False, allow_blank=True, default="")
    action = serializers.CharField(required=False, allow_blank=True, default="")


class StructuralSuggestionSerializer(serializers.Serializer):
    category = serializers.CharField()
    suggestion = serializers.CharField()


class AiSuggestionsResponseSerializer(serializers.Serializer):
    summary_recommendation = serializers.CharField(required=False, allow_blank=True, default="")
    missing_keywords_priority = MissingKeywordsPrioritySerializer(required=False)
    keyword_placement_advice = serializers.ListField(child=KeywordPlacementAdviceSerializer(), required=False, default=list)
    bullet_point_improvements = serializers.ListField(child=BulletPointImprovementSerializer(), required=False, default=list)
    structural_suggestions = serializers.ListField(child=StructuralSuggestionSerializer(), required=False, default=list)
    strengths = serializers.ListField(child=serializers.CharField(), required=False, default=list)


class ResumeInfoSerializer(serializers.Serializer):
    resume_id = serializers.IntegerField(allow_null=True)
    title = serializers.CharField()
    is_primary = serializers.BooleanField()
    file_type = serializers.CharField()


class ResumeAnalyzeResponseSerializer(serializers.Serializer):
    status = serializers.CharField(default="SUCCESS")
    resume_info = ResumeInfoSerializer()
    ats_score = AtsScoreResponseSerializer()
    ai_suggestions = AiSuggestionsResponseSerializer()
    analysis_id = serializers.IntegerField(allow_null=True)
