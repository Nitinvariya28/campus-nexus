import collections
from django.db.models import Count, Case, When, Value, CharField
from django.utils import timezone
from apps.skills.models import UserLearningResource, UserAIUsage, MasterLearningPlatform
from apps.profiles.models import StudentProfile, StudentPlacementRecord, AlumniProfile
from apps.accounts.models import User

def get_learning_ai_analytics(filters):
    role = filters.get('role')
    department_id = filters.get('department_id')
    batch_id = filters.get('batch_id')
    semester = filters.get('semester')
    experience_min = filters.get('experience_min')
    experience_max = filters.get('experience_max')
    platform_id = filters.get('platform_id')
    ai_tool = filters.get('ai_tool')
    primary_purpose = filters.get('primary_purpose')
    placed_status = filters.get('placed_status')

    # Base QS
    learning_qs = UserLearningResource.objects.select_related('user', 'platform').all()
    ai_qs = UserAIUsage.objects.select_related('user').all()

    # Apply global filters to QS
    if role and role != 'None':
        learning_qs = learning_qs.filter(user__role=role)
        ai_qs = ai_qs.filter(user__role=role)
        
    if platform_id and platform_id != 'None':
        learning_qs = learning_qs.filter(platform_id=platform_id)
        
    if ai_tool and ai_tool != 'None':
        ai_qs = ai_qs.filter(ai_tool=ai_tool)
        
    if primary_purpose and primary_purpose != 'None':
        ai_qs = ai_qs.filter(usage_purpose=primary_purpose)

    # Note: We group by platform__name but handle fallback if someone enters other_platform_name
    def build_platform_list(qs, limit=20):
        # Prefer platform.name, if null, ignore (for simplified analytics)
        # Using exact DB aggregation on platform__name
        platforms = qs.filter(platform__isnull=False).values('platform__name').annotate(count=Count('user', distinct=True)).order_by('-count')[:limit]
        return list(platforms)

    # --- Learning Platforms ---
    global_preferences = build_platform_list(learning_qs)
    
    # Categorized by technical domain: Coding / DSA, Web & Project Channels, Structured Course Platforms
    by_platform_type = {
        "coding_platforms": build_platform_list(learning_qs.filter(platform__platform_type='CODING_PLATFORM'), limit=10),
        "web_and_youtube": build_platform_list(learning_qs.filter(platform__platform_type='YOUTUBE_CHANNEL'), limit=10),
        "course_websites": build_platform_list(learning_qs.filter(platform__platform_type='COURSE_WEBSITE'), limit=10),
    }

    by_role = []
    for r in ['STUDENT', 'ALUMNI']:
        by_role.append({
            "role": r,
            "top_platforms": build_platform_list(learning_qs.filter(user__role=r), limit=10)
        })

    # --- AI Usage ---
    tools_overview = list(ai_qs.values('ai_tool').annotate(distinct_users=Count('user', distinct=True)).order_by('-distinct_users')[:20])
    purposes_overview = list(ai_qs.values('usage_purpose').annotate(distinct_users=Count('user', distinct=True)).order_by('-distinct_users')[:20])
    time_range_overview = list(ai_qs.values('daily_time_range').annotate(distinct_users=Count('user', distinct=True)).order_by('-distinct_users')[:20])
    
    tool_by_purpose_matrix = []
    top_tools = ai_qs.values('ai_tool').annotate(count=Count('user', distinct=True)).order_by('-count')[:5]
    top_tool_names = [t['ai_tool'] for t in top_tools]
    if top_tool_names:
        purposes_raw = list(
            ai_qs.filter(ai_tool__in=top_tool_names)
            .values('ai_tool', 'usage_purpose')
            .annotate(count=Count('user', distinct=True))
            .order_by('ai_tool', '-count')
        )
        tool_purpose_map = collections.defaultdict(list)
        for p in purposes_raw:
            if len(tool_purpose_map[p['ai_tool']]) < 5:
                tool_purpose_map[p['ai_tool']].append({
                    "usage_purpose": p['usage_purpose'],
                    "count": p['count']
                })
        for tool_name in top_tool_names:
            tool_by_purpose_matrix.append({
                "ai_tool": tool_name,
                "top_purposes": tool_purpose_map.get(tool_name, [])
            })

    # --- Student Insights ---
    # Apply Student filters (department, batch, semester)
    student_users_qs = StudentProfile.objects.filter(user__role='STUDENT')
    if department_id and department_id != 'None':
        from apps.university.helpers import resolve_department_ids
        dept_ids = resolve_department_ids(department_id)
        if dept_ids:
            student_users_qs = student_users_qs.filter(department_id__in=dept_ids)
    if batch_id and batch_id != 'None':
        student_users_qs = student_users_qs.filter(batch_id=batch_id)
    if semester and semester != 'None':
        student_users_qs = student_users_qs.filter(semester=semester)

    student_user_ids = set(student_users_qs.values_list('user_id', flat=True))
    
    student_learning_qs = learning_qs.filter(user_id__in=student_user_ids)
    student_ai_qs = ai_qs.filter(user_id__in=student_user_ids)

    learning_by_department = []
    ai_by_department_and_semester = []
    
    # 1 bulk query for learning by department
    dept_platforms_raw = list(
        learning_qs.filter(
            user_id__in=student_user_ids, platform__isnull=False
        ).values(
            'user__student_profile__department__name', 'platform__name'
        ).annotate(count=Count('user_id', distinct=True)).order_by('-count')
    )
    
    dept_learn_map = {}
    for item in dept_platforms_raw:
        dept = item['user__student_profile__department__name']
        if not dept:
            continue
        if dept not in dept_learn_map:
            dept_learn_map[dept] = []
        if len(dept_learn_map[dept]) < 5:
            dept_learn_map[dept].append({
                "platform__name": item['platform__name'],
                "count": item['count']
            })
            
    for dept, platforms in dept_learn_map.items():
        learning_by_department.append({
            "department__name": dept,
            "top_platforms": platforms
        })
        
    # 1 bulk query for AI by department and semester
    dept_sem_ai_raw = list(
        ai_qs.filter(
            user_id__in=student_user_ids
        ).values(
            'user__student_profile__department__name',
            'user__student_profile__semester',
            'ai_tool'
        ).annotate(count=Count('user_id', distinct=True)).order_by('-count')
    )
    
    dept_sem_map = {}
    for item in dept_sem_ai_raw:
        dept = item['user__student_profile__department__name']
        sem = item['user__student_profile__semester']
        tool = item['ai_tool']
        if not dept or sem is None or not tool:
            continue
        key = (dept, sem)
        if key not in dept_sem_map:
            dept_sem_map[key] = []
        if len(dept_sem_map[key]) < 5:
            dept_sem_map[key].append({
                "ai_tool": tool,
                "count": item['count']
            })
            
    for (dept, sem), top_tools in dept_sem_map.items():
        ai_by_department_and_semester.append({
            "department__name": dept,
            "semester": sem,
            "top_ai_tools": top_tools
        })

    # B-12: Placed vs Unplaced
    placed_student_ids = set(StudentPlacementRecord.objects.filter(student__user_id__in=student_user_ids).values_list('student__user_id', flat=True))
    unplaced_student_ids = student_user_ids - placed_student_ids
    
    learning_by_placement_status = {
        "placed": build_platform_list(learning_qs.filter(user_id__in=placed_student_ids), limit=5),
        "unplaced": build_platform_list(learning_qs.filter(user_id__in=unplaced_student_ids), limit=5)
    }

    # B-14: Student vs Alumni
    alumni_ai_qs = ai_qs.filter(user__role='ALUMNI')
    
    ai_vs_alumni_comparison = {
        "student_top_tools": list(student_ai_qs.values('ai_tool').annotate(count=Count('user', distinct=True)).order_by('-count')[:5]),
        "alumni_top_tools": list(alumni_ai_qs.values('ai_tool').annotate(count=Count('user', distinct=True)).order_by('-count')[:5]),
        "student_top_purposes": list(student_ai_qs.values('usage_purpose').annotate(count=Count('user', distinct=True)).order_by('-count')[:5]),
        "alumni_top_purposes": list(alumni_ai_qs.values('usage_purpose').annotate(count=Count('user', distinct=True)).order_by('-count')[:5])
    }

    # --- Alumni Insights (B-36) ---
    alumni_users_qs = AlumniProfile.objects.filter(user__role='ALUMNI')
    
    if experience_min and experience_min != 'None':
        alumni_users_qs = alumni_users_qs.filter(years_of_experience__gte=float(experience_min))
    if experience_max and experience_max != 'None':
        alumni_users_qs = alumni_users_qs.filter(years_of_experience__lte=float(experience_max))

    # Experience Banding via Case/When
    alumni_with_bands = alumni_users_qs.annotate(
        experience_band=Case(
            When(years_of_experience__lt=2.0, then=Value('< 2 Years')),
            When(years_of_experience__gte=2.0, years_of_experience__lte=5.0, then=Value('2-5 Years')),
            When(years_of_experience__gt=5.0, then=Value('5+ Years')),
            default=Value('Unknown'),
            output_field=CharField(),
        )
    )

    alumni_insights_by_band = []
    bands = ['< 2 Years', '2-5 Years', '5+ Years']
    
    band_users_map = collections.defaultdict(set)
    for uid, b in alumni_with_bands.values_list('user_id', 'experience_band'):
        band_users_map[b].add(uid)

    for band in bands:
        band_user_ids = band_users_map.get(band, set())
        if band_user_ids:
            top_ai = list(ai_qs.filter(user_id__in=band_user_ids).values('ai_tool').annotate(count=Count('user', distinct=True)).order_by('-count')[:5])
            top_learn = build_platform_list(learning_qs.filter(user_id__in=band_user_ids), limit=5)
            
            alumni_insights_by_band.append({
                "experience_band": band,
                "top_ai_tools": top_ai,
                "top_learning_platforms": top_learn
            })

    return {
        "learning_platforms": {
            "global_preferences": global_preferences,
            "by_role": by_role,
            "by_platform_type": by_platform_type,
        },
        "ai_usage": {
            "tools_overview": tools_overview,
            "purposes_overview": purposes_overview,
            "time_range_overview": time_range_overview,
            "tool_by_purpose_matrix": tool_by_purpose_matrix,
        },
        "student_insights": {
            "learning_by_department": learning_by_department,
            "learning_by_placement_status": learning_by_placement_status,
            "ai_by_department_and_semester": ai_by_department_and_semester,
            "ai_vs_alumni_comparison": ai_vs_alumni_comparison
        },
        "alumni_insights": {
            "by_experience_band": alumni_insights_by_band
        }
    }
