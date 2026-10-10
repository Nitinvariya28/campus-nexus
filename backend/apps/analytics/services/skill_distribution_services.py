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
        
        # Tech stack by dept
        for dept in StudentProfile.objects.values_list('department__name', flat=True).distinct():
            if not dept: continue
            dept_skills = student_qs.filter(user__student_profile__department__name=dept).values('skill__name').annotate(count=Count('id')).order_by('-count')[:5]
            tech_stack_by_department.append({
                "department__name": dept,
                "top_skills": list(dept_skills)
            })
            
        # Tech stack by batch
        for start_year in StudentProfile.objects.values_list('batch__start_year', flat=True).distinct():
            if not start_year: continue
            batch_skills = student_qs.filter(user__student_profile__batch__start_year=start_year).values('skill__name').annotate(count=Count('id')).order_by('-count')[:5]
            tech_stack_by_batch.append({
                "batch__start_year": start_year,
                "top_skills": list(batch_skills)
            })

    # --- B-32 to B-35: Alumni Associations ---
    alumni_qs = qs.filter(user__role='ALUMNI')
    skills_by_company = []
    skills_by_job_category = []
    skills_by_batch = []
    proficiency_by_experience_band = []
    
    if alumni_qs.exists():
        # By Company
        for comp in AlumniProfile.objects.values_list('current_company__name', flat=True).distinct():
            if not comp: continue
            comp_skills = alumni_qs.filter(user__alumni_profile__current_company__name=comp).values('skill__name').annotate(count=Count('id')).order_by('-count')[:5]
            skills_by_company.append({
                "company__name": comp,
                "top_skills": list(comp_skills)
            })
            
        # By Job Category
        for job in AlumniProfile.objects.values_list('job_category', flat=True).distinct():
            if not job: continue
            job_skills = alumni_qs.filter(user__alumni_profile__job_category=job).values('skill__name').annotate(count=Count('id')).order_by('-count')[:5]
            skills_by_job_category.append({
                "job_category": job,
                "top_skills": list(job_skills)
            })
            
        # By Batch
        for start_year in AlumniProfile.objects.values_list('batch__start_year', flat=True).distinct():
            if not start_year: continue
            batch_skills = alumni_qs.filter(user__alumni_profile__batch__start_year=start_year).values('skill__name').annotate(count=Count('id')).order_by('-count')[:5]
            skills_by_batch.append({
                "batch__start_year": start_year,
                "top_skills": list(batch_skills)
            })
            
        # Proficiency by Experience Band
        alumni_with_bands = alumni_qs.annotate(
            experience_band=Case(
                When(user__alumni_profile__years_of_experience__lt=2, then=Value('< 2 Years')),
                When(user__alumni_profile__years_of_experience__lte=5, then=Value('2-5 Years')),
                When(user__alumni_profile__years_of_experience__gt=5, then=Value('5+ Years')),
                default=Value('Unknown'),
                output_field=CharField(),
            )
        )
        
        bands = ['< 2 Years', '2-5 Years', '5+ Years']
        for band in bands:
            profs = alumni_with_bands.filter(experience_band=band).values('proficiency').annotate(count=Count('id')).order_by('-count')
            proficiency_by_experience_band.append({
                "experience_band": band,
                "proficiencies": list(profs)
            })

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
