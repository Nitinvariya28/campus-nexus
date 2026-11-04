from django.urls import path
from apps.ai_module.views import HealthCheckView

app_name = "ai_module"

urlpatterns = [
    # AI-01: Health Check & System Readiness API
    path("health/", HealthCheckView.as_view(), name="ai-health-check"),
]
