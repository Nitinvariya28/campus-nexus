from django.db.models import Count, Q, Avg, Max, Min, Case, When, Value, CharField, F
from collections import defaultdict
from decimal import Decimal
from apps.profiles.models import StudentPlacementRecord

def get_placement_summary_analytics(filters):
    placements_qs = StudentPlacementRecord.objects.all()
    
    placement_year = filters.get('placement_year')
    dept_id = filters.get('department_id')
    batch_id = filters.get('batch_id')
    offer_type = filters.get('offer_type')
    hiring_mode = filters.get('hiring_mode')
    job_category = filters.get('job_category')
    company_tier = filters.get('company_tier')
    industry = filters.get('industry')
    
    if placement_year and placement_year != 'None':
        placements_qs = placements_qs.filter(placement_year=placement_year)
    if dept_id and dept_id != 'None':
        placements_qs = placements_qs.filter(student__department_id=dept_id)
    if batch_id and batch_id != 'None':
        placements_qs = placements_qs.filter(student__batch_id=batch_id)
    if offer_type and offer_type != 'None':
        placements_qs = placements_qs.filter(offer_type=offer_type)
    if hiring_mode and hiring_mode != 'None':
        placements_qs = placements_qs.filter(hiring_mode=hiring_mode)
    if job_category and job_category != 'None':
        placements_qs = placements_qs.filter(job_category=job_category)
    if company_tier and company_tier != 'None':
        placements_qs = placements_qs.filter(company__company_tier=company_tier)
    if industry and industry != 'None':
        placements_qs = placements_qs.filter(company__industry=industry)

    # --- A-27: Total Offers & Distinct Students ---
    total_offers = placements_qs.count()
    distinct_students_placed = placements_qs.values('student_id').distinct().count()
    
    # --- A-36: Platform Sourced vs Not ---
    platform_sourced = placements_qs.filter(opportunity__isnull=False).count()
    non_platform = placements_qs.filter(opportunity__isnull=True).count()
    
    # --- A-37: Multiple Offer Students ---
    # Group by student, count offers, filter those > 1. 
    # Using Django ORM to count students with > 1 offer efficiently:
    student_counts = placements_qs.values('student_id').annotate(c=Count('id'))
    multiple_offer_students = sum(1 for s in student_counts if s['c'] > 1)
    
    # --- A-32: Package Statistics ---
    package_qs = placements_qs.filter(package_lpa__isnull=False)
    package_aggs = package_qs.aggregate(
        avg=Avg('package_lpa'),
        min=Min('package_lpa'),
        max=Max('package_lpa')
    )
    
    # Median Calculation (In Memory)
    packages = list(package_qs.values_list('package_lpa', flat=True).order_by('package_lpa'))
    n = len(packages)
    if n == 0:
        median_lpa = None
    elif n % 2 == 1:
        median_lpa = float(packages[n//2])
    else:
        median_lpa = float((packages[n//2 - 1] + packages[n//2]) / 2.0)
        
    avg_lpa = round(float(package_aggs['avg']), 2) if package_aggs['avg'] else None
    min_lpa = round(float(package_aggs['min']), 2) if package_aggs['min'] else None
    max_lpa = round(float(package_aggs['max']), 2) if package_aggs['max'] else None

    # --- A-33: Package Bands ---
    bands_qs = package_qs.annotate(
        band=Case(
            When(package_lpa__lt=5, then=Value('< 5 LPA')),
            When(package_lpa__gte=5, package_lpa__lt=10, then=Value('5 - 10 LPA')),
            When(package_lpa__gte=10, package_lpa__lt=20, then=Value('10 - 20 LPA')),
            When(package_lpa__gte=20, then=Value('20+ LPA')),
            output_field=CharField()
        )
    ).values('band').annotate(count=Count('id'))
    package_bands = list(bands_qs)

    # --- A-29, A-30, A-31: Breakdowns ---
    by_offer_type = list(placements_qs.values('offer_type').annotate(count=Count('id')).order_by('-count'))
    by_hiring_mode = list(placements_qs.values('hiring_mode').annotate(count=Count('id')).order_by('-count'))
    top_job_categories = list(placements_qs.values('job_category').annotate(count=Count('id')).order_by('-count')[:10])
    top_job_titles = list(placements_qs.values('job_title').annotate(count=Count('id')).order_by('-count')[:10])

    # --- A-28, A-34, A-35, B-50: Yearly Trends ---
    yearly_base = placements_qs.values('placement_year').annotate(
        total_offers=Count('id'),
        distinct_students=Count('student_id', distinct=True),
        distinct_companies=Count('company_id', distinct=True),
        internship_offers=Count('id', filter=Q(offer_type='INTERNSHIP')),
        fte_offers=Count('id', filter=Q(offer_type='FTE')),
        average_lpa=Avg('package_lpa'),
        maximum_lpa=Max('package_lpa')
    ).order_by('placement_year')
    
    yearly_summary = []
    prev_offers = None
    for y in yearly_base:
        offers = y['total_offers']
        if prev_offers and prev_offers > 0:
            growth = round(((offers - prev_offers) / prev_offers) * 100, 2)
        else:
            growth = 0.0
            
        yearly_summary.append({
            "placement_year": y['placement_year'],
            "total_offers": offers,
            "distinct_students": y['distinct_students'],
            "distinct_companies": y['distinct_companies'],
            "internship_offers": y['internship_offers'],
            "fte_offers": y['fte_offers'],
            "average_lpa": round(float(y['average_lpa']), 2) if y['average_lpa'] else None,
            "maximum_lpa": round(float(y['maximum_lpa']), 2) if y['maximum_lpa'] else None,
            "yoy_offer_growth_pct": growth
        })
        prev_offers = offers
        
    # --- B-49: Yearly Job Categories ---
    yearly_job_categories = list(
        placements_qs.values('placement_year', 'job_category')
        .annotate(count=Count('id'))
        .order_by('placement_year', '-count')
    )

    # --- B-03: Department Outcomes ---
    department_outcomes = list(
        placements_qs.values('student__department__name').annotate(
            total_offers=Count('id'),
            average_lpa=Avg('package_lpa'),
            maximum_lpa=Max('package_lpa')
        ).order_by('-total_offers')
    )
    for d in department_outcomes:
        d['average_lpa'] = round(float(d['average_lpa']), 2) if d['average_lpa'] else None
        d['maximum_lpa'] = round(float(d['maximum_lpa']), 2) if d['maximum_lpa'] else None

    # --- B-04: Tier Outcomes (by Department and Tier) ---
    tier_outcomes = list(
        placements_qs.values('student__department__name', 'company__company_tier').annotate(
            total_offers=Count('id'),
            average_lpa=Avg('package_lpa')
        ).order_by('student__department__name', 'company__company_tier')
    )
    for t in tier_outcomes:
        t['average_lpa'] = round(float(t['average_lpa']), 2) if t['average_lpa'] else None

    return {
        "summary": {
            "total_offers": total_offers,
            "distinct_students_placed": distinct_students_placed,
            "multiple_offer_students": multiple_offer_students,
            "platform_sourced_offers": platform_sourced,
            "non_platform_offers": non_platform
        },
        "package_statistics": {
            "basis": "per_offer",
            "average_lpa": avg_lpa,
            "median_lpa": median_lpa,
            "minimum_lpa": min_lpa,
            "maximum_lpa": max_lpa
        },
        "package_bands": package_bands,
        "breakdowns": {
            "by_offer_type": by_offer_type,
            "by_hiring_mode": by_hiring_mode,
            "top_job_categories": top_job_categories,
            "top_job_titles": top_job_titles
        },
        "trends": {
            "yearly_summary": yearly_summary,
            "yearly_job_categories": yearly_job_categories
        },
        "department_outcomes": department_outcomes,
        "tier_outcomes": tier_outcomes
    }
