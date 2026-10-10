from django.urls import path
from .views.common_views import PlatformOverviewAPIView
from .views.community_views import CommunityAnalyticsAPIView
from .views.resources_views import ResourcesAnnouncementsAPIView
from .views.company_views import CompanyLandscapeAPIView
from .views.student_cohort_views import StudentCohortsAPIView
from .views.placement_summary_views import PlacementSummaryAPIView
from .views.company_performance_views import CompanyPerformanceAPIView
from .views.opportunities_views import OpportunitiesAnalyticsAPIView
from .views.readiness_views import PlacementReadinessAPIView
from .views.skill_distribution_views import SkillDistributionAPIView

urlpatterns = [
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
]
