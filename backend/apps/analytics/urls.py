from django.urls import path
from .views.common_views import PlatformOverviewAPIView, LandingStatsAPIView
from .views.community_views import CommunityAnalyticsAPIView
from .views.resources_views import ResourcesAnnouncementsAPIView
from .views.company_views import CompanyLandscapeAPIView
from .views.student_cohort_views import StudentCohortsAPIView
from .views.placement_summary_views import PlacementSummaryAPIView
from .views.company_performance_views import CompanyPerformanceAPIView
from .views.opportunities_views import OpportunitiesAnalyticsAPIView
from .views.readiness_views import PlacementReadinessAPIView
from .views.skill_distribution_views import SkillDistributionAPIView
from .views.market_gap_views import MarketGapAPIView
from .views.learning_ai_views import LearningAIAPIView
from .views.alumni_career_views import AlumniCareerAPIView
from .views.alumni_contribution_views import AlumniContributionAPIView
from .views.interview_views import InterviewAnalyticsAPIView
from .views.resume_personal_views import ResumePersonalAnalyticsAPIView
from .views.resume_cohort_views import ResumeCohortAnalyticsAPIView
from .views.platform_health_views import PlatformHealthAPIView
from .views.admin_security_views import AdminSecurityAPIView
from .views.dashboard_views import DashboardAssemblerAPIView

urlpatterns = [
    path('landing-stats/', LandingStatsAPIView.as_view(), name='landing-stats'),
    path('dashboard/', DashboardAssemblerAPIView.as_view(), name='dashboard-assembler'),
    path('platform/overview/', PlatformOverviewAPIView.as_view(), name='platform-overview'),
    path('community/', CommunityAnalyticsAPIView.as_view(), name='community-analytics'),
    path('resources-announcements/', ResourcesAnnouncementsAPIView.as_view(), name='resources-announcements'),
    path('companies/overview/', CompanyLandscapeAPIView.as_view(), name='company-landscape'),
    path('student-cohorts/', StudentCohortsAPIView.as_view(), name='student-cohorts'),
    path('placements/summary/', PlacementSummaryAPIView.as_view(), name='placement-summary'),
    path('placements/companies/', CompanyPerformanceAPIView.as_view(), name='company-performance'),
    path('opportunities/', OpportunitiesAnalyticsAPIView.as_view(), name='opportunities-analytics'),
    path('placement-cell/readiness/', PlacementReadinessAPIView.as_view(), name='placement-readiness'),
    path('skills/distribution/', SkillDistributionAPIView.as_view(), name='skill-distribution'),
    path('skills/market-gap/', MarketGapAPIView.as_view(), name='market-gap'),
    path('learning-ai/', LearningAIAPIView.as_view(), name='learning-ai'),
    path('alumni/careers/', AlumniCareerAPIView.as_view(), name='alumni-careers'),
    path('alumni/contributions/', AlumniContributionAPIView.as_view(), name='alumni-contributions'),
    path('interviews/', InterviewAnalyticsAPIView.as_view(), name='interview-analytics'),
    path('resumes/me/', ResumePersonalAnalyticsAPIView.as_view(), name='resume-personal'),
    path('placement-cell/resume-readiness/', ResumeCohortAnalyticsAPIView.as_view(), name='resume-cohort'),
    path('placement-cell/platform-health/', PlatformHealthAPIView.as_view(), name='platform-health'),
    path('admin/identity-otp/', AdminSecurityAPIView.as_view(), name='admin-security'),
]
