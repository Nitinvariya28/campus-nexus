from django.db.models import Count, Q, Avg, Subquery, OuterRef
from apps.profiles.models import StudentPlacementRecord, AlumniProfile
from apps.companies.models import Company

def get_company_performance_analytics(filters):
    placements_qs = StudentPlacementRecord.objects.all()
    
    placement_year = filters.get('placement_year')
    company_id = filters.get('company_id')
    company_tier = filters.get('company_tier')
    industry = filters.get('industry')
    dept_id = filters.get('department_id')
    batch_id = filters.get('batch_id')
    hiring_mode = filters.get('hiring_mode')
    offer_type = filters.get('offer_type')
    
    # 1. Apply Filters
    if placement_year and placement_year != 'None':
        placements_qs = placements_qs.filter(placement_year=placement_year)
    if company_id and company_id != 'None':
        placements_qs = placements_qs.filter(company_id=company_id)
    if company_tier and company_tier != 'None':
        placements_qs = placements_qs.filter(company__company_tier=company_tier)
    if industry and industry != 'None':
        placements_qs = placements_qs.filter(company__industry=industry)
    if dept_id and dept_id != 'None':
        from apps.university.helpers import resolve_department_ids
        dept_ids = resolve_department_ids(dept_id)
        if dept_ids:
            placements_qs = placements_qs.filter(student__department_id__in=dept_ids)
    if batch_id and batch_id != 'None':
        placements_qs = placements_qs.filter(student__batch_id=batch_id)
    if hiring_mode and hiring_mode != 'None':
        placements_qs = placements_qs.filter(hiring_mode=hiring_mode)
    if offer_type and offer_type != 'None':
        placements_qs = placements_qs.filter(offer_type=offer_type)

    # --- B-44: Recruiter Health ---
    from django.db.models import Max
    latest_year_obj = StudentPlacementRecord.objects.order_by('-placement_year').first()
    latest_year = latest_year_obj.placement_year if latest_year_obj else None
    
    new_recruiters = []
    repeat_recruiters = []
    lapsed_recruiters = []
    
    if latest_year:
        companies_this_year = set(StudentPlacementRecord.objects.filter(placement_year=latest_year).values_list('company_id', flat=True).distinct())
        companies_past_years = set(StudentPlacementRecord.objects.filter(placement_year__lt=latest_year).values_list('company_id', flat=True).distinct())
        
        all_comp_ids = companies_this_year.union(companies_past_years)
        comp_name_map = {c['id']: c['name'] for c in Company.objects.filter(id__in=all_comp_ids).values('id', 'name')}
        
        # Pre-fetch counts for this year and last year in 1 query
        offers_by_company_year = {
            (p['company_id'], p['placement_year']): p['c']
            for p in StudentPlacementRecord.objects.filter(
                placement_year__gte=latest_year - 1, company_id__in=companies_this_year
            ).values('company_id', 'placement_year').annotate(c=Count('id'))
        }
        
        # New: Hired this year, never before
        new_ids = companies_this_year - companies_past_years
        for c_id in new_ids:
            c_name = comp_name_map.get(c_id, f"Company {c_id}")
            offers = offers_by_company_year.get((c_id, latest_year), 0)
            new_recruiters.append({"company__name": c_name, "offers_this_year": offers})
            
        # Repeat: Hired this year and before
        repeat_ids = companies_this_year.intersection(companies_past_years)
        for c_id in repeat_ids:
            c_name = comp_name_map.get(c_id, f"Company {c_id}")
            offers_this = offers_by_company_year.get((c_id, latest_year), 0)
            offers_last = offers_by_company_year.get((c_id, latest_year - 1), 0)
            repeat_recruiters.append({
                "company__name": c_name,
                "offers_this_year": offers_this,
                "offers_last_year": offers_last
            })
            
        # Lapsed: Hired before, not this year (1 bulk query)
        lapsed_ids = companies_past_years - companies_this_year
        lapsed_max_years = {
            p['company_id']: p['max_yr']
            for p in StudentPlacementRecord.objects.filter(
                company_id__in=lapsed_ids
            ).values('company_id').annotate(max_yr=Max('placement_year'))
        }
        for c_id in lapsed_ids:
            c_name = comp_name_map.get(c_id, f"Company {c_id}")
            last_visit = lapsed_max_years.get(c_id)
            lapsed_recruiters.append({"company__name": c_name, "last_visited_year": last_visit})

    # --- B-56: Outreach Targets ---
    alumni_companies = set(AlumniProfile.objects.filter(current_company__isnull=False).values_list('current_company_id', flat=True).distinct())
    placement_companies = set(StudentPlacementRecord.objects.values_list('company_id', flat=True).distinct())
    
    outreach_ids = list(alumni_companies - placement_companies)[:10]
    outreach_targets = []
    if outreach_ids:
        outreach_name_map = {c['id']: c['name'] for c in Company.objects.filter(id__in=outreach_ids).values('id', 'name')}
        outreach_counts_map = {
            a['current_company_id']: a['c']
            for a in AlumniProfile.objects.filter(
                current_company_id__in=outreach_ids
            ).values('current_company_id').annotate(c=Count('id'))
        }
        for c_id in outreach_ids:
            outreach_targets.append({
                "company__name": outreach_name_map.get(c_id, f"Company {c_id}"),
                "alumni_working_here": outreach_counts_map.get(c_id, 0),
                "reason": "Alumni present but 0 placement records"
            })
        outreach_targets.sort(key=lambda x: x['alumni_working_here'], reverse=True)

    # --- B-47: Internship Conversion (2 fast bulk queries instead of 140) ---
    intern_pairs = set(
        StudentPlacementRecord.objects.filter(
            offer_type="INTERNSHIP"
        ).values_list('student_id', 'company_id')
    )
    eligible_internships = len(intern_pairs)
    
    fte_pairs = set(
        StudentPlacementRecord.objects.filter(
            offer_type__in=["FTE", "FULL_TIME_PLACEMENT"]
        ).values_list('student_id', 'company_id')
    )
    
    converted = len(intern_pairs.intersection(fte_pairs))
    conversion_rate = round((converted / eligible_internships) * 100, 2) if eligible_internships > 0 else 0.0

    # --- B-42, B-43: Company Outcomes ---
    company_outcomes = list(
        placements_qs.values('company__name', 'company__company_tier', 'placement_year').annotate(
            distinct_students=Count('student_id', distinct=True),
            total_offers=Count('id'),
            average_lpa=Avg('package_lpa')
        ).order_by('-placement_year', '-total_offers')[:50]
    )
    for co in company_outcomes:
        co['average_lpa'] = round(float(co['average_lpa']), 2) if co['average_lpa'] else None

    # --- B-41: Yearly Overall Outcomes ---
    yearly_overall = list(
        placements_qs.values('placement_year').annotate(
            distinct_companies=Count('company_id', distinct=True),
            total_offers=Count('id')
        ).order_by('placement_year')
    )

    # --- B-45: Yearly Trends By Tier and Industry ---
    yearly_by_tier = list(
        placements_qs.values('placement_year', 'company__company_tier').annotate(
            total_offers=Count('id')
        ).order_by('placement_year', 'company__company_tier')
    )
    
    yearly_by_industry = list(
        placements_qs.values('placement_year', 'company__industry').annotate(
            total_offers=Count('id')
        ).order_by('placement_year', 'company__industry')
    )

    # --- B-46: Hiring Mode By Tier ---
    hiring_mode_by_tier = list(
        placements_qs.values('hiring_mode', 'company__company_tier').annotate(
            total_offers=Count('id')
        ).order_by('hiring_mode', 'company__company_tier')
    )

    return {
        "recruiter_health": {
            "latest_year": latest_year,
            "new_recruiters": new_recruiters,
            "repeat_recruiters": repeat_recruiters,
            "lapsed_recruiters": lapsed_recruiters
        },
        "outreach_targets": outreach_targets,
        "internship_conversion": {
            "eligible_internships": eligible_internships,
            "converted_to_ppo_or_fte": converted,
            "conversion_rate_pct": conversion_rate
        },
        "company_outcomes": company_outcomes,
        "yearly_trends": {
            "overall": yearly_overall,
            "by_tier": yearly_by_tier,
            "by_industry": yearly_by_industry
        },
        "hiring_mode_by_tier": hiring_mode_by_tier
    }
