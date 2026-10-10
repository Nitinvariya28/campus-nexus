from django.db.models import Count, Q
from django.db.models.functions import TruncMonth
from django.utils import timezone
from apps.accounts.models import User
from apps.profiles.models import StudentProfile, AlumniProfile, StudentPlacementRecord
from apps.companies.models import Company
from apps.interviews.models import InterviewExperience
from apps.opportunities.models import Opportunity
from apps.community.models import Post

def get_platform_overview(filters):
    users_qs = User.objects.all()
    students_qs = StudentProfile.objects.filter(user__role='STUDENT')
    alumni_qs = AlumniProfile.objects.filter(user__role='ALUMNI')
    
    
    department_id = filters.get('department_id')
    batch_id = filters.get('batch_id')
    date_from = filters.get('date_from')
    date_to = filters.get('date_to')
    
    if department_id and department_id != 'None':
        users_qs = users_qs.filter(
            Q(student_profile__department_id=department_id) | 
            Q(alumni_profile__department_id=department_id)
        ).distinct()
        students_qs = students_qs.filter(department_id=department_id)
        alumni_qs = alumni_qs.filter(department_id=department_id)
        
    if batch_id and batch_id != 'None':
        users_qs = users_qs.filter(
            Q(student_profile__batch_id=batch_id) | 
            Q(alumni_profile__batch_id=batch_id)
        ).distinct()
        students_qs = students_qs.filter(batch_id=batch_id)
        alumni_qs = alumni_qs.filter(batch_id=batch_id)
        
    if date_from and date_from != 'None':
        users_qs = users_qs.filter(date_joined__gte=date_from)
    if date_to and date_to != 'None':
        users_qs = users_qs.filter(date_joined__lte=date_to)

    total_users = users_qs.count()
    
    # Role Breakdown
    role_breakdown = []
    roles = users_qs.values('role').annotate(
        count=Count('id'),
        verified=Count('id', filter=Q(is_verified=True)),
        unverified=Count('id', filter=Q(is_verified=False))
    )
    for r in roles:
        role_breakdown.append({
            "role": r['role'],
            "count": r['count'],
            "verified": r['verified'],
            "unverified": r['unverified']
        })

    # Monthly Growth
    monthly_growth = list(
        users_qs.annotate(month=TruncMonth('date_joined'))
        .values('month', 'role')
        .annotate(new_users=Count('id'))
        .order_by('month', 'role')
    )
    
    formatted_growth = []
    for item in monthly_growth:
        if item['month']:
            formatted_growth.append({
                "month": item['month'].strftime('%Y-%m'),
                "role": item['role'],
                "new_users": item['new_users']
            })

    # Platform Snapshot (Global metrics do not require batch/department filters unless strictly demanded, but question B-60 wants the overall snapshot)
    platform_snapshot = {
        "total_students": students_qs.count(),
        "total_alumni": alumni_qs.count(),
        "total_companies": Company.objects.count(),
        "total_offers": StudentPlacementRecord.objects.count(),
        "total_interview_experiences": InterviewExperience.objects.count(),
        "total_opportunities": Opportunity.objects.count(),
        "total_posts": Post.objects.count()
    }
    
    return {
        "total_users": total_users,
        "role_breakdown": role_breakdown,
        "monthly_growth": formatted_growth,
        "platform_snapshot": platform_snapshot
    }
