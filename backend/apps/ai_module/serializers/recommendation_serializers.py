from rest_framework import serializers


class ProfileRecommendationCardSerializer(serializers.Serializer):
    """
    Lightweight candidate profile card for the AI Recommendations Hub.
    Designed for instant UI rendering and direct redirection to the community profile page.
    """
    user_id = serializers.IntegerField(help_text="MySQL User ID for profile redirection")
    full_name = serializers.CharField(help_text="Candidate display full name")
    profile_photo = serializers.CharField(allow_blank=True, help_text="Profile avatar image URL")
    role = serializers.CharField(help_text="STUDENT or ALUMNI")
    headline = serializers.CharField(allow_blank=True, help_text="Dynamic professional or academic headline")
    department = serializers.CharField(allow_blank=True, help_text="Academic department name")
    match_score = serializers.FloatField(help_text="Hybrid match percentage score between 0.0 and 100.0")
    match_reasons = serializers.ListField(
        child=serializers.CharField(),
        help_text="Top 3 explainable, evidence-grounded reasons for the match"
    )
    shared_skills = serializers.ListField(
        child=serializers.CharField(),
        help_text="List of overlapping technical and soft skills"
    )
    profile_url = serializers.CharField(help_text="Relative URI to community profile detail page")


class ProfilePaginatedListSerializer(serializers.Serializer):
    """
    Paginated list wrapper for dual-column profile recommendations.
    Supports 'Load More' pagination for each column independently.
    """
    items = ProfileRecommendationCardSerializer(many=True, help_text="List of recommended profile cards")
    page = serializers.IntegerField(help_text="Current page index (1-based)")
    limit = serializers.IntegerField(help_text="Page size / limit")
    total_count = serializers.IntegerField(help_text="Total matching candidates found")
    total_pages = serializers.IntegerField(help_text="Total available pages")
    has_more = serializers.BooleanField(help_text="Whether more candidate pages exist")


class ProfileRecommendationsResponseSerializer(serializers.Serializer):
    """
    Root response envelope for AI-02 Profile Recommendations API.
    """
    status = serializers.CharField(help_text="SUCCESS, PROFILE_INCOMPLETE, or ERROR")
    caller = serializers.DictField(required=False, help_text="Authenticated caller basic metadata")
    target_role = serializers.CharField(required=False, help_text="ALL, STUDENT, or ALUMNI")
    students = ProfilePaginatedListSerializer(required=False, help_text="Paginated student recommendations (Left Column)")
    alumni = ProfilePaginatedListSerializer(required=False, help_text="Paginated alumni recommendations (Right Column)")
    message = serializers.CharField(required=False, allow_blank=True, help_text="Informational message or guided CTA")
    missing_fields = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        help_text="List of profile fields required to complete cold-start readiness"
    )
    profile_edit_url = serializers.CharField(required=False, allow_blank=True, help_text="Redirect URI to complete profile")
