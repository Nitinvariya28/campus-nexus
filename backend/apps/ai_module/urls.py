from django.urls import path
from apps.ai_module.views import (
    HealthCheckView,
    ProfileRecommendationsView,
    PrimaryResumeView,
    ResumeAnalyzeView,
    ChatbotView,
)

app_name = "ai_module"

urlpatterns = [
    # AI-01: Health Check & System Readiness API
    path("health/", HealthCheckView.as_view(), name="ai-health-check"),

    # AI-02: Profile Recommendations API
    path("recommendations/profiles/", ProfileRecommendationsView.as_view(), name="ai-profile-recommendations"),

    # AI-04 & AI-05: Unified Resume ATS Scoring & AI Suggestions API
    path("resume/primary/", PrimaryResumeView.as_view(), name="ai-resume-primary"),
    path("resume/analyze/", ResumeAnalyzeView.as_view(), name="ai-resume-analyze"),

    # AI-06: RAG-Based Intelligent Campus & Placement Chatbot
    path("chat/", ChatbotView.as_view(), name="ai-chat"),
]
