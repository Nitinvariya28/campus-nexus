from apps.analytics.services.common_services import get_platform_overview
from apps.analytics.services.community_services import get_community_analytics
from apps.analytics.services.resources_services import get_resources_announcements_analytics
from apps.analytics.services.company_services import get_company_landscape_analytics
from apps.analytics.services.placement_summary_services import get_placement_summary_analytics
from apps.analytics.services.opportunities_services import get_opportunities_analytics
from apps.analytics.services.skill_distribution_services import get_skill_distribution_analytics
from apps.analytics.services.student_cohort_services import get_student_cohort_analytics
from apps.analytics.services.market_gap_services import get_market_gap_analytics
from apps.analytics.services.learning_ai_services import get_learning_ai_analytics
from apps.analytics.services.interview_services import get_interview_analytics
from apps.analytics.services.resume_personal_services import get_personal_resume_analytics
from apps.analytics.services.alumni_career_services import get_alumni_career_analytics
from apps.analytics.services.alumni_contribution_services import get_alumni_contribution_analytics
from apps.analytics.services.company_performance_services import get_company_performance_analytics
from apps.analytics.services.readiness_services import get_readiness_analytics
from apps.analytics.services.resume_cohort_services import get_cohort_resume_readiness
from apps.analytics.services.platform_health_services import get_platform_health_analytics

def get_dashboard_analytics(user, view=None, requested_sections=None, filters=None):
    if filters is None:
        filters = {}

    # Define all available common builders
    common_builders = {
        'platform_overview': lambda: get_platform_overview(filters),
        'community_pulse': lambda: get_community_analytics(filters),
        'resources_announcements': lambda: get_resources_announcements_analytics(filters),
        'company_landscape': lambda: get_company_landscape_analytics(filters),
        'placement_snapshot': lambda: get_placement_summary_analytics(filters),
        'opportunities_snapshot': lambda: get_opportunities_analytics(filters),
        'skills_pulse': lambda: get_skill_distribution_analytics(filters),
    }

    # Define role-specific builders
    student_builders = {
        'cohort_metrics': lambda: get_student_cohort_analytics(filters),
        'market_skill_gaps': lambda: get_market_gap_analytics(filters),
        'learning_and_ai': lambda: get_learning_ai_analytics(filters),
        'interview_prep': lambda: get_interview_analytics(filters),
        'my_resume_health': lambda: get_personal_resume_analytics(user, filters.get('resume_id')),
    }

    alumni_builders = {
        'career_paths': lambda: get_alumni_career_analytics(filters),
        'alumni_contributions': lambda: get_alumni_contribution_analytics(filters),
        'skills_in_industry': lambda: get_skill_distribution_analytics(filters),
        'ai_and_learning': lambda: get_learning_ai_analytics(filters),
        'interview_insights': lambda: get_interview_analytics(filters),
    }

    placement_cell_builders = {
        'cohort_outcomes': lambda: get_student_cohort_analytics(filters),
        'placement_kpis': lambda: get_placement_summary_analytics(filters),
        'recruiter_health': lambda: get_company_performance_analytics(filters),
        'unplaced_readiness': lambda: get_readiness_analytics(filters),
        'market_skill_gaps': lambda: get_market_gap_analytics(filters),
        'interview_intelligence': lambda: get_interview_analytics(filters),
        'resume_cohort_health': lambda: get_cohort_resume_readiness(filters),
        'platform_health_operations': lambda: get_platform_health_analytics(filters),
    }

    # Check if selective filtering was requested
    def is_selected(section_name):
        if not requested_sections:
            return True
        return section_name in requested_sections

    common_data = {}
    for section_name, builder in common_builders.items():
        if is_selected(section_name):
            try:
                common_data[section_name] = builder()
            except Exception as e:
                common_data[section_name] = {"error": str(e)}

    # If common view requested, return early
    if view == 'common':
        return {
            "role_detected": user.role,
            "view": "common",
            "common": common_data
        }

    role_data = {}
    role_key = user.role.lower()

    if user.role == 'STUDENT':
        for section_name, builder in student_builders.items():
            if is_selected(section_name):
                try:
                    role_data[section_name] = builder()
                except Exception as e:
                    role_data[section_name] = {"error": str(e)}

    elif user.role == 'ALUMNI':
        for section_name, builder in alumni_builders.items():
            if is_selected(section_name):
                try:
                    role_data[section_name] = builder()
                except Exception as e:
                    role_data[section_name] = {"error": str(e)}

    elif user.role == 'PLACEMENT_CELL':
        for section_name, builder in placement_cell_builders.items():
            if is_selected(section_name):
                try:
                    role_data[section_name] = builder()
                except Exception as e:
                    role_data[section_name] = {"error": str(e)}

    return {
        "role_detected": user.role,
        "common": common_data,
        role_key: role_data
    }
