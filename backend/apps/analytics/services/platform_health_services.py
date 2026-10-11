from django.db.models import Count, Q
from django.db.models.functions import TruncMonth, TruncDate
from apps.accounts.models import User, OTPVerification
from apps.skills.models import SocialLink, UserSkill
from apps.profiles.models import StudentProfile, AlumniProfile
from apps.reports.models import Report
from django.utils import timezone
from datetime import timedelta

def get_platform_health_analytics(filters):
    date_from = filters.get('date_from')
    date_to = filters.get('date_to')
    
    q_user = Q()
    if date_from:
        q_user &= Q(date_joined__gte=date_from)
    if date_to:
        q_user &= Q(date_joined__lte=date_to)
        
    now = timezone.now()
    active_last_7_days = User.objects.filter(last_login__gte=now - timedelta(days=7)).count()
    active_last_30_days = User.objects.filter(last_login__gte=now - timedelta(days=30)).count()
    
    never_logged_in_by_role = list(
        User.objects.filter(last_login__isnull=True)
        .values('role')
        .annotate(count=Count('id'))
    )
    
    # OTP Metrics
    requests_per_day = list(
        OTPVerification.objects.annotate(day=TruncDate('created_at'))
        .values('day')
        .annotate(count=Count('id'))
        .order_by('-day')[:30]
    )
    
    distinct_otp_emails = OTPVerification.objects.values('email').distinct().count()
    successful_registrations = User.objects.count()
    conversion_rate_percentage = round((successful_registrations / distinct_otp_emails * 100), 1) if distinct_otp_emails > 0 else 0.0
    
    # Social Linking
    social_linking = list(
        SocialLink.objects.values('platform')
        .annotate(count=Count('id'))
        .order_by('-count')
    )
    
    # Onboarding Funnel
    stage_1_otp_requests = OTPVerification.objects.count()
    stage_2_registered = User.objects.count()
    stage_3_verified = User.objects.filter(is_verified=True).count()
    
    students_with_bio = StudentProfile.objects.filter(bio__isnull=False).count()
    alumni_with_bio = AlumniProfile.objects.filter(bio__isnull=False).count()
    stage_4_profile_completed = students_with_bio + alumni_with_bio
    
    stage_5_skills_added = UserSkill.objects.values('user_id').distinct().count()
    
    # Moderation Reports
    by_reason_and_month = list(
        Report.objects.annotate(month=TruncMonth('created_at'))
        .values('month', 'reason', 'status')
        .annotate(count=Count('id'))
        .order_by('-month')
    )
    
    by_target_type_and_status = list(
        Report.objects.values('target_type', 'status')
        .annotate(count=Count('id'))
    )
    
    # Show last 10 report details
    report_details = list(
        Report.objects.select_related('reported_by').order_by('-created_at')[:10]
        .values(
            'id', 'reported_by__email', 'target_type', 'reason', 'status', 'created_at'
        )
    )
    
    for rd in report_details:
        rd['report_id'] = rd.pop('id')
        rd['reported_by_email'] = rd.pop('reported_by__email')

    return {
        "recent_activity": {
            "active_last_7_days": active_last_7_days,
            "active_last_30_days": active_last_30_days,
            "never_logged_in_by_role": never_logged_in_by_role
        },
        "otp_metrics": {
            "requests_per_day": requests_per_day,
            "conversion_metrics": {
                "distinct_otp_emails": distinct_otp_emails,
                "successful_registrations": successful_registrations,
                "conversion_rate_percentage": conversion_rate_percentage
            }
        },
        "social_linking": social_linking,
        "onboarding_funnel": {
            "stage_1_otp_requests": stage_1_otp_requests,
            "stage_2_registered": stage_2_registered,
            "stage_3_verified": stage_3_verified,
            "stage_4_profile_completed": stage_4_profile_completed,
            "stage_5_skills_added": stage_5_skills_added
        },
        "moderation_reports": {
            "by_reason_and_month": by_reason_and_month,
            "by_target_type_and_status": by_target_type_and_status,
            "report_details": report_details
        }
    }
