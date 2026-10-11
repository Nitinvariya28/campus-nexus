from django.db.models import Count, Avg, Case, When, Value, CharField, Q
from django.utils import timezone
from apps.profiles.models import AlumniProfile
from apps.skills.models import UserSkill
from apps.accounts.models import User

def get_alumni_career_analytics(filters):
    department_id = filters.get('department_id')
    batch_id = filters.get('batch_id')
    company_id = filters.get('company_id')
    company_tier = filters.get('company_tier')
    industry = filters.get('industry')
    location = filters.get('location')
    experience_min = filters.get('experience_min')
    experience_max = filters.get('experience_max')
    job_category = filters.get('job_category')
    skill_id = filters.get('skill_id')

    # Base QS strictly enforcing ALUMNI role
    alumni_qs = AlumniProfile.objects.select_related('department', 'batch', 'current_company').filter(user__role='ALUMNI')

    # Apply Filters
    if department_id and department_id != 'None':
        alumni_qs = alumni_qs.filter(department_id=department_id)
    if batch_id and batch_id != 'None':
        alumni_qs = alumni_qs.filter(batch_id=batch_id)
    if company_id and company_id != 'None':
        alumni_qs = alumni_qs.filter(current_company_id=company_id)
    if company_tier and company_tier != 'None':
        alumni_qs = alumni_qs.filter(current_company__company_tier=company_tier)
    if industry and industry != 'None':
        alumni_qs = alumni_qs.filter(current_company__industry=industry)
    if location and location != 'None':
        alumni_qs = alumni_qs.filter(location__icontains=location)
    if experience_min and experience_min != 'None':
        alumni_qs = alumni_qs.filter(years_of_experience__gte=float(experience_min))
    if experience_max and experience_max != 'None':
        alumni_qs = alumni_qs.filter(years_of_experience__lte=float(experience_max))
    if job_category and job_category != 'None':
        alumni_qs = alumni_qs.filter(job_category=job_category)
    if skill_id and skill_id != 'None':
        skilled_users = set(UserSkill.objects.filter(skill_id=skill_id).values_list('user_id', flat=True))
        alumni_qs = alumni_qs.filter(user_id__in=skilled_users)

    # Dynamic Banding
    alumni_qs = alumni_qs.annotate(
        experience_band=Case(
            When(years_of_experience__lt=2.0, then=Value('< 2 Years')),
            When(years_of_experience__gte=2.0, years_of_experience__lte=5.0, then=Value('2-5 Years')),
            When(years_of_experience__gt=5.0, then=Value('5+ Years')),
            default=Value('Unknown'),
            output_field=CharField(),
        )
    )

    total_profiles = alumni_qs.count()

    # Calculate Profile Completeness
    if total_profiles > 0:
        completeness = alumni_qs.aggregate(
            bio_cnt=Count('bio', filter=~Q(bio='')),
            phone_cnt=Count('phone', filter=~Q(phone='')),
            loc_cnt=Count('location', filter=~Q(location='')),
            comp_cnt=Count('current_company')
        )
        bio_pct = round((completeness['bio_cnt'] / total_profiles) * 100, 1)
        phone_pct = round((completeness['phone_cnt'] / total_profiles) * 100, 1)
        loc_pct = round((completeness['loc_cnt'] / total_profiles) * 100, 1)
        comp_pct = round((completeness['comp_cnt'] / total_profiles) * 100, 1)
        avg_exp = alumni_qs.aggregate(Avg('years_of_experience'))['years_of_experience__avg']
        avg_exp = round(float(avg_exp), 1) if avg_exp else 0.0
        without_company = total_profiles - completeness['comp_cnt']
    else:
        bio_pct = phone_pct = loc_pct = comp_pct = 0.0
        avg_exp = 0.0
        without_company = 0

    # Section 1: Overview
    alumni_overview = {
        "total_alumni_profiles": total_profiles,
        "average_experience_years": avg_exp,
        "alumni_without_company": without_company,
        "profile_completeness_pct": {
            "bio": bio_pct,
            "phone": phone_pct,
            "location": loc_pct,
            "current_company": comp_pct
        }
    }

    # Section 2: Demographics
    employment_demographics = {
        "by_job_category": list(alumni_qs.filter(job_category__isnull=False).values('job_category').annotate(count=Count('id')).order_by('-count')[:10]),
        "by_job_title": list(alumni_qs.filter(current_job_title__isnull=False).values('current_job_title').annotate(count=Count('id')).order_by('-count')[:10]),
        "by_location": list(alumni_qs.filter(location__isnull=False).values('location').annotate(count=Count('id')).order_by('-count')[:10]),
        "by_experience_band": list(alumni_qs.values('experience_band').annotate(count=Count('id')).order_by('-count')),
        "by_department": list(alumni_qs.values('department__name').annotate(count=Count('id')).order_by('-count')),
        "by_batch": list(alumni_qs.values('batch__start_year').annotate(count=Count('id')).order_by('-count')),
    }

    # Section 3: Company Insights
    company_insights = {
        "by_company": list(alumni_qs.filter(current_company__isnull=False).values('current_company__name').annotate(count=Count('id')).order_by('-count')[:15]),
        "by_industry": list(alumni_qs.filter(current_company__industry__isnull=False).values('current_company__industry').annotate(count=Count('id')).order_by('-count')[:10]),
        "by_tier": list(alumni_qs.filter(current_company__company_tier__isnull=False).values('current_company__company_tier').annotate(count=Count('id')).order_by('-count'))
    }

    # Section 4: Cross Associations
    # company_by_department
    company_by_dept = []
    top_companies = list(alumni_qs.filter(current_company__isnull=False).values('current_company__name').annotate(count=Count('id')).order_by('-count')[:5])
    for c in top_companies:
        c_name = c['current_company__name']
        depts = list(alumni_qs.filter(current_company__name=c_name).values('department__name').annotate(count=Count('id')).order_by('-count')[:5])
        company_by_dept.append({"company__name": c_name, "departments": depts})

    # company_by_batch
    company_by_batch = []
    for c in top_companies:
        c_name = c['current_company__name']
        batches = list(alumni_qs.filter(current_company__name=c_name).values('batch__start_year').annotate(count=Count('id')).order_by('-count')[:5])
        company_by_batch.append({"company__name": c_name, "batches": batches})

    # job_categories_within_company
    job_categories_within_company = []
    for c in top_companies:
        c_name = c['current_company__name']
        cats = list(alumni_qs.filter(current_company__name=c_name, job_category__isnull=False).values('job_category').annotate(count=Count('id')).order_by('-count')[:5])
        job_categories_within_company.append({"company__name": c_name, "categories": cats})

    # locations_within_company
    locations_within_company = []
    for c in top_companies:
        c_name = c['current_company__name']
        locs = list(alumni_qs.filter(current_company__name=c_name, location__isnull=False).values('location').annotate(count=Count('id')).order_by('-count')[:5])
        locations_within_company.append({"company__name": c_name, "locations": locs})

    # experience_by_tier_and_job_category (B-29)
    experience_by_tier_and_job_category = []
    tiers = alumni_qs.filter(current_company__company_tier__isnull=False).values_list('current_company__company_tier', flat=True).distinct()
    for tier in tiers:
        cats = alumni_qs.filter(current_company__company_tier=tier, job_category__isnull=False).values('job_category').annotate(average_experience=Avg('years_of_experience')).order_by('-average_experience')
        formatted_cats = []
        for cat in cats:
            formatted_cats.append({
                "job_category": cat['job_category'],
                "average_experience": round(float(cat['average_experience']), 1) if cat['average_experience'] else 0.0
            })
        experience_by_tier_and_job_category.append({
            "company__tier": tier,
            "categories": formatted_cats
        })

    # job_categories_by_batch
    job_categories_by_batch = []
    batches = alumni_qs.values_list('batch__start_year', flat=True).distinct()
    for b in batches:
        if b is None: continue
        cats = list(alumni_qs.filter(batch__start_year=b, job_category__isnull=False).values('job_category').annotate(count=Count('id')).order_by('-count')[:5])
        job_categories_by_batch.append({
            "batch__start_year": b,
            "categories": cats
        })

    # job_categories_by_department
    job_categories_by_department = []
    depts = alumni_qs.values_list('department__name', flat=True).distinct()
    for d in depts:
        if not d: continue
        cats = list(alumni_qs.filter(department__name=d, job_category__isnull=False).values('job_category').annotate(count=Count('id')).order_by('-count')[:5])
        job_categories_by_department.append({
            "department__name": d,
            "categories": cats
        })

    cross_associations = {
        "company_by_department": company_by_dept,
        "company_by_batch": company_by_batch,
        "job_categories_within_company": job_categories_within_company,
        "locations_within_company": locations_within_company,
        "experience_by_tier_and_job_category": experience_by_tier_and_job_category,
        "job_categories_by_batch": job_categories_by_batch,
        "job_categories_by_department": job_categories_by_department
    }

    return {
        "alumni_overview": alumni_overview,
        "employment_demographics": employment_demographics,
        "company_insights": company_insights,
        "cross_associations": cross_associations
    }
