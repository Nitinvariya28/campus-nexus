from django.db.models import Count, Q, Avg, OuterRef, Subquery, Case, When, Value, CharField
from apps.skills.models import UserSkill, Skill, SkillCategory
from apps.profiles.models import StudentProfile, AlumniProfile, StudentPlacementRecord
from apps.accounts.models import User

def get_skill_distribution_analytics(filters):
    role = filters.get('role')
    department_id = filters.get('department_id')
    batch_id = filters.get('batch_id')
    company_id = filters.get('company_id')
    job_category = filters.get('job_category')
    skill_id = filters.get('skill_id')
    proficiency = filters.get('proficiency')

    qs = UserSkill.objects.select_related('skill', 'skill__category', 'user').all()

    if role and role != 'None':
        qs = qs.filter(user__role=role)
    if skill_id and skill_id != 'None':
        qs = qs.filter(skill_id=skill_id)
    if proficiency and proficiency != 'None':
        qs = qs.filter(proficiency=proficiency)

    # --- A-38, A-42: Inventory Summary ---
    total_unique_skills = qs.values('skill').distinct().count()
    
    # Calculate avg skills per user by role
    student_users_count = User.objects.filter(role='STUDENT').count()
    alumni_users_count = User.objects.filter(role='ALUMNI').count()
    
    student_skills_count = qs.filter(user__role='STUDENT').count()
    alumni_skills_count = qs.filter(user__role='ALUMNI').count()
    
    avg_student = round(student_skills_count / student_users_count, 2) if student_users_count else 0.0
    avg_alumni = round(alumni_skills_count / alumni_users_count, 2) if alumni_users_count else 0.0

    by_category = list(qs.values('skill__category__name').annotate(skill_count=Count('skill_id', distinct=True)).order_by('-skill_count'))

    # --- A-39: Top Skills ---
    top_skills = list(qs.values('skill__name').annotate(distinct_users=Count('user_id', distinct=True)).order_by('-distinct_users')[:20])

    # --- A-40: Proficiency Distribution ---
    proficiency_distribution = list(qs.values('proficiency').annotate(count=Count('id')).order_by('-count'))

    # --- B-07 to B-10: Student Associations ---
    student_qs = qs.filter(user__role='STUDENT')
    
    placement_correlation = []
    advanced_skill_impact = {}
    tech_stack_by_department = []
    tech_stack_by_batch = []
    
    if student_qs.exists():
        # Top 10 skills for placement correlation
        top_student_skills = student_qs.values('skill__name', 'skill_id').annotate(users_with_skill=Count('user_id', distinct=True)).order_by('-users_with_skill')[:10]
        
        placed_students = set(StudentPlacementRecord.objects.values_list('student__user_id', flat=True))
        
        for sk in top_student_skills:
            users_with_this_skill = set(student_qs.filter(skill_id=sk['skill_id']).values_list('user_id', flat=True))
            placed_users = len(users_with_this_skill.intersection(placed_students))
            unplaced_users = len(users_with_this_skill) - placed_users
            rate = round((placed_users / len(users_with_this_skill)) * 100, 2) if users_with_this_skill else 0.0
            
            placement_correlation.append({
                "skill__name": sk['skill__name'],
                "users_with_skill": len(users_with_this_skill),
                "placed_users": placed_users,
                "unplaced_users": unplaced_users,
                "placement_rate_pct": rate
            })
            
        # Advanced skill impact
        adv_skills_per_user = student_qs.filter(proficiency='ADVANCED').values('user_id').annotate(adv_count=Count('id'))
        adv_dict = {item['user_id']: item['adv_count'] for item in adv_skills_per_user}
        
        placed_adv_counts = [adv_dict.get(u, 0) for u in placed_students if u in adv_dict or True] # Only users in DB
        # Refine:
        all_student_users = set(User.objects.filter(role='STUDENT').values_list('id', flat=True))
        unplaced_student_users = all_student_users - placed_students
        
        placed_adv = sum(adv_dict.get(u, 0) for u in placed_students)
        unplaced_adv = sum(adv_dict.get(u, 0) for u in unplaced_student_users)
        
        avg_placed_adv = round(placed_adv / len(placed_students), 2) if placed_students else 0.0
        avg_unplaced_adv = round(unplaced_adv / len(unplaced_student_users), 2) if unplaced_student_users else 0.0
        
        advanced_skill_impact = {
            "avg_placed_user_advanced_skills": avg_placed_adv,
            "avg_unplaced_user_advanced_skills": avg_unplaced_adv
        }
        
        # Tech stack by dept (1 bulk query)
        dept_skills_raw = list(
            student_qs.filter(
                user__student_profile__department__name__isnull=False
            ).values(
                'user__student_profile__department__name', 'skill__name'
            ).annotate(count=Count('id')).order_by('-count')
        )
        dept_skill_map = {}
        for item in dept_skills_raw:
            dept = item['user__student_profile__department__name']
            if dept not in dept_skill_map:
                dept_skill_map[dept] = []
            if len(dept_skill_map[dept]) < 5:
                dept_skill_map[dept].append({"skill__name": item['skill__name'], "count": item['count']})
        tech_stack_by_department = [{"department__name": d, "top_skills": s} for d, s in dept_skill_map.items()]
            
        # Tech stack by batch (1 bulk query)
        batch_skills_raw = list(
            student_qs.filter(
                user__student_profile__batch__start_year__isnull=False
            ).values(
                'user__student_profile__batch__start_year', 'skill__name'
            ).annotate(count=Count('id')).order_by('-count')
        )
        batch_skill_map = {}
        for item in batch_skills_raw:
            byear = item['user__student_profile__batch__start_year']
            if byear not in batch_skill_map:
                batch_skill_map[byear] = []
            if len(batch_skill_map[byear]) < 5:
                batch_skill_map[byear].append({"skill__name": item['skill__name'], "count": item['count']})
        tech_stack_by_batch = [{"batch__start_year": b, "top_skills": s} for b, s in batch_skill_map.items()]

    # --- B-32 to B-35: Alumni Associations ---
    alumni_qs = qs.filter(user__role='ALUMNI')
    skills_by_company = []
    skills_by_job_category = []
    skills_by_batch = []
    proficiency_by_experience_band = []
    
    if alumni_qs.exists():
        # By Company (top 10 companies by alumni count instead of all 146)
        top_comps = list(
            AlumniProfile.objects.filter(
                current_company__name__isnull=False
            ).values('current_company__name').annotate(c=Count('id')).order_by('-c')[:10]
        )
        top_comp_names = [c['current_company__name'] for c in top_comps]
        
        comp_skills_raw = list(
            alumni_qs.filter(
                user__alumni_profile__current_company__name__in=top_comp_names
            ).values(
                'user__alumni_profile__current_company__name', 'skill__name'
            ).annotate(count=Count('id')).order_by('-count')
        )
        comp_skill_map = {cname: [] for cname in top_comp_names}
        for item in comp_skills_raw:
            cname = item['user__alumni_profile__current_company__name']
            if cname in comp_skill_map and len(comp_skill_map[cname]) < 5:
                comp_skill_map[cname].append({"skill__name": item['skill__name'], "count": item['count']})
        skills_by_company = [{"company__name": c, "top_skills": s} for c, s in comp_skill_map.items()]
            
        # By Job Category (1 bulk query)
        job_skills_raw = list(
            alumni_qs.filter(
                user__alumni_profile__job_category__isnull=False
            ).values(
                'user__alumni_profile__job_category', 'skill__name'
            ).annotate(count=Count('id')).order_by('-count')
        )
        job_skill_map = {}
        for item in job_skills_raw:
            job = item['user__alumni_profile__job_category']
            if job not in job_skill_map:
                job_skill_map[job] = []
            if len(job_skill_map[job]) < 5:
                job_skill_map[job].append({"skill__name": item['skill__name'], "count": item['count']})
        skills_by_job_category = [{"job_category": j, "top_skills": s} for j, s in job_skill_map.items()]
            
        # By Batch (1 bulk query)
        batch_alumni_raw = list(
            alumni_qs.filter(
                user__alumni_profile__batch__start_year__isnull=False
            ).values(
                'user__alumni_profile__batch__start_year', 'skill__name'
            ).annotate(count=Count('id')).order_by('-count')
        )
        batch_alumni_map = {}
        for item in batch_alumni_raw:
            byear = item['user__alumni_profile__batch__start_year']
            if byear not in batch_alumni_map:
                batch_alumni_map[byear] = []
            if len(batch_alumni_map[byear]) < 5:
                batch_alumni_map[byear].append({"skill__name": item['skill__name'], "count": item['count']})
        skills_by_batch = [{"batch__start_year": b, "top_skills": s} for b, s in batch_alumni_map.items()]
            
        # Proficiency by Experience Band (1 bulk query)
        alumni_with_bands = alumni_qs.annotate(
            experience_band=Case(
                When(user__alumni_profile__years_of_experience__lt=2, then=Value('< 2 Years')),
                When(user__alumni_profile__years_of_experience__lte=5, then=Value('2-5 Years')),
                When(user__alumni_profile__years_of_experience__gt=5, then=Value('5+ Years')),
                default=Value('Unknown'),
                output_field=CharField(),
            )
        )
        band_profs_raw = list(
            alumni_with_bands.values('experience_band', 'proficiency').annotate(count=Count('id')).order_by('-count')
        )
        band_map = {'< 2 Years': [], '2-5 Years': [], '5+ Years': []}
        for item in band_profs_raw:
            b = item['experience_band']
            if b in band_map:
                band_map[b].append({"proficiency": item['proficiency'], "count": item['count']})
        proficiency_by_experience_band = [{"experience_band": b, "proficiencies": p} for b, p in band_map.items()]

    return {
        "inventory_summary": {
            "total_unique_skills_listed": total_unique_skills,
            "average_skills_per_user_by_role": {
                "STUDENT": avg_student,
                "ALUMNI": avg_alumni
            },
            "by_category": by_category
        },
        "top_skills": top_skills,
        "proficiency_distribution": proficiency_distribution,
        "student_associations": {
            "placement_correlation": placement_correlation,
            "advanced_skill_impact": advanced_skill_impact,
            "tech_stack_by_department": tech_stack_by_department,
            "tech_stack_by_batch": tech_stack_by_batch
        },
        "alumni_associations": {
            "skills_by_company": skills_by_company,
            "skills_by_job_category": skills_by_job_category,
            "skills_by_batch": skills_by_batch,
            "proficiency_by_experience_band": proficiency_by_experience_band
        }
    }
