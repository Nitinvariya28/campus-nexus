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
        placements_qs = placements_qs.filter(student__department_id=dept_id)
    if batch_id and batch_id != 'None':
        placements_qs = placements_qs.filter(student__batch_id=batch_id)
    if hiring_mode and hiring_mode != 'None':
        placements_qs = placements_qs.filter(hiring_mode=hiring_mode)
    if offer_type and offer_type != 'None':
        placements_qs = placements_qs.filter(offer_type=offer_type)

    # --- B-44: Recruiter Health ---
    latest_year_obj = StudentPlacementRecord.objects.order_by('-placement_year').first()
    latest_year = latest_year_obj.placement_year if latest_year_obj else None
    
    new_recruiters = []
    repeat_recruiters = []
    lapsed_recruiters = []
    
    if latest_year:
        companies_this_year = set(StudentPlacementRecord.objects.filter(placement_year=latest_year).values_list('company_id', flat=True).distinct())
        companies_past_years = set(StudentPlacementRecord.objects.filter(placement_year__lt=latest_year).values_list('company_id', flat=True).distinct())
        
        # New: Hired this year, never before
        new_ids = companies_this_year - companies_past_years
        for c_id in new_ids:
            c = Company.objects.get(id=c_id)
            offers = StudentPlacementRecord.objects.filter(placement_year=latest_year, company_id=c_id).count()
            new_recruiters.append({"company__name": c.name, "offers_this_year": offers})
            
        # Repeat: Hired this year and before
        repeat_ids = companies_this_year.intersection(companies_past_years)
        for c_id in repeat_ids:
            c = Company.objects.get(id=c_id)
            offers_this = StudentPlacementRecord.objects.filter(placement_year=latest_year, company_id=c_id).count()
            offers_last = StudentPlacementRecord.objects.filter(placement_year=latest_year-1, company_id=c_id).count()
            repeat_recruiters.append({"company__name": c.name, "offers_this_year": offers_this, "offers_last_year": offers_last})
            
        # Lapsed: Hired before, not this year
        lapsed_ids = companies_past_years - companies_this_year
        for c_id in lapsed_ids:
            c = Company.objects.get(id=c_id)
            last_visit = StudentPlacementRecord.objects.filter(company_id=c_id).order_by('-placement_year').first().placement_year
            lapsed_recruiters.append({"company__name": c.name, "last_visited_year": last_visit})

    # --- B-56: Outreach Targets ---
    alumni_companies = set(AlumniProfile.objects.filter(current_company__isnull=False).values_list('current_company_id', flat=True).distinct())
    placement_companies = set(StudentPlacementRecord.objects.values_list('company_id', flat=True).distinct())
    
    outreach_ids = alumni_companies - placement_companies
    outreach_targets = []
    for c_id in list(outreach_ids)[:10]:  # limit to top 10 for performance
        c = Company.objects.get(id=c_id)
        alumni_count = AlumniProfile.objects.filter(current_company_id=c_id).count()
        outreach_targets.append({
            "company__name": c.name,
            "alumni_working_here": alumni_count,
            "reason": "Alumni present but 0 placement records"
        })
    outreach_targets.sort(key=lambda x: x['alumni_working_here'], reverse=True)

    # --- B-47: Internship Conversion ---
    # Find students who had an internship
    intern_records = StudentPlacementRecord.objects.filter(offer_type="INTERNSHIP")
    eligible_internships = intern_records.count()
    
    converted = 0
    for ir in intern_records:
        # check if student got FTE at same company in same or future year
        has_fte = StudentPlacementRecord.objects.filter(
            student_id=ir.student_id, 
            company_id=ir.company_id, 
            offer_type="FTE",
            placement_year__gte=ir.placement_year
        ).exists()
        if has_fte:
            converted += 1
            
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
