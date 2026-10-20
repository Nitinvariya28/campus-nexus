from django.db.models import Count, Q, F
from apps.companies.models import Company, CompanyRole
from apps.profiles.models import AlumniProfile, StudentPlacementRecord
from apps.interviews.models import InterviewExperience
from apps.opportunities.models import Opportunity

def get_company_landscape_analytics(filters):
    companies_qs = Company.objects.all()
    roles_qs = CompanyRole.objects.all()
    
    alumni_qs = AlumniProfile.objects.all()
    placements_qs = StudentPlacementRecord.objects.all()
    interviews_qs = InterviewExperience.objects.all()
    opportunities_qs = Opportunity.objects.all()
    
    # Base Company Filters
    company_id = filters.get('company_id')
    company_tier = filters.get('company_tier')
    industry = filters.get('industry')
    
    if company_id and company_id != 'None':
        companies_qs = companies_qs.filter(id=company_id)
        alumni_qs = alumni_qs.filter(current_company_id=company_id)
        placements_qs = placements_qs.filter(company_id=company_id)
        interviews_qs = interviews_qs.filter(company_id=company_id)
        opportunities_qs = opportunities_qs.filter(company_id=company_id)
        
    if company_tier and company_tier != 'None':
        companies_qs = companies_qs.filter(company_tier=company_tier)
        alumni_qs = alumni_qs.filter(current_company__company_tier=company_tier)
        placements_qs = placements_qs.filter(company__company_tier=company_tier)
        
    if industry and industry != 'None':
        companies_qs = companies_qs.filter(industry=industry)
        alumni_qs = alumni_qs.filter(current_company__industry=industry)
        placements_qs = placements_qs.filter(company__industry=industry)
        
    # Demographic Filters (only apply to related objects)
    department_id = filters.get('department_id')
    batch_id = filters.get('batch_id')
    placement_year = filters.get('placement_year')
    
    if department_id and department_id != 'None':
        from apps.university.helpers import resolve_department_ids
        dept_ids = resolve_department_ids(department_id)
        if dept_ids:
            alumni_qs = alumni_qs.filter(department_id__in=dept_ids)
            placements_qs = placements_qs.filter(student__department_id__in=dept_ids)
        
    if batch_id and batch_id != 'None':
        alumni_qs = alumni_qs.filter(batch_id=batch_id)
        placements_qs = placements_qs.filter(student__batch_id=batch_id)
        
    if placement_year and placement_year != 'None':
        placements_qs = placements_qs.filter(placement_year=placement_year)

    # --- A-49: Company Counts ---
    total_companies = companies_qs.count()
    active_companies = companies_qs.filter(is_active=True).count()
    
    # --- A-50: Companies by Industry ---
    companies_by_industry = list(
        companies_qs.values('industry').annotate(count=Count('id')).order_by('-count')[:10]
    )
    
    # --- A-51: Companies by Tier, Size, HQ ---
    companies_by_tier = list(companies_qs.values('company_tier').annotate(count=Count('id')).order_by('-count'))
    companies_by_size = list(companies_qs.values('company_size').annotate(count=Count('id')).order_by('-count'))
    companies_by_hq = list(companies_qs.values('headquarters').annotate(count=Count('id')).order_by('-count')[:10])
    
    # --- A-53: Roles by Category ---
    roles_by_category = list(roles_qs.values('role_category').annotate(count=Count('id')).order_by('-count'))
    
    # --- B-22, A-52, B-62, B-64: Company Presence (Top 20 by presence) ---
    # We pre-calculate aggregates per company for alumni, placements, interviews, opportunities
    # Using Django's filtered annotations or subqueries might be slow, so we can group by in memory or do it safely via related lookups if we are careful.
    
    # For a safe and accurate calculation honoring demographic filters (department_id, batch_id), 
    # we shouldn't rely on raw annotations on Company because the reverse lookups would ignore our filtered alumni_qs.
    
    # Calculate counts separately
    alumni_counts = {item['current_company_id']: item['c'] for item in alumni_qs.filter(current_company_id__isnull=False).values('current_company_id').annotate(c=Count('id'))}
    placements_counts = {item['company_id']: item['c'] for item in placements_qs.values('company_id').annotate(c=Count('id'))}
    interviews_counts = {item['company_id']: item['c'] for item in interviews_qs.values('company_id').annotate(c=Count('id'))}
    opportunities_counts = {item['company_id']: item['c'] for item in opportunities_qs.values('company_id').annotate(c=Count('id'))}
    roles_counts = {item['company_id']: item['c'] for item in roles_qs.values('company_id').annotate(c=Count('id'))}
    
    company_presence = []
    companies_map = {item['id']: item['name'] for item in companies_qs.values('id', 'name')}
    
    for c_id, c_name in companies_map.items():
        al_c = alumni_counts.get(c_id, 0)
        pl_c = placements_counts.get(c_id, 0)
        int_c = interviews_counts.get(c_id, 0)
        opp_c = opportunities_counts.get(c_id, 0)
        r_c = roles_counts.get(c_id, 0)
        
        total_score = al_c + pl_c + int_c
        
        if total_score > 0 or r_c > 0 or opp_c > 0:
            company_presence.append({
                "company_id": c_id,
                "company_name": c_name,
                "alumni_count": al_c,
                "placements_count": pl_c,
                "interviews_count": int_c,
                "opportunities_count": opp_c,
                "roles_count": r_c,
                "total_presence_score": total_score
            })
            
    # Sort by total_presence_score descending and take top 20
    company_presence = sorted(company_presence, key=lambda x: x['total_presence_score'], reverse=True)[:20]
    
    # --- B-63: Industry Presence Comparison ---
    alumni_ind_counts = {item['current_company__industry']: item['c'] for item in alumni_qs.filter(current_company__industry__isnull=False).values('current_company__industry').annotate(c=Count('id'))}
    placements_ind_counts = {item['company__industry']: item['c'] for item in placements_qs.filter(company__industry__isnull=False).values('company__industry').annotate(c=Count('id'))}
    
    all_industries = set(alumni_ind_counts.keys()).union(set(placements_ind_counts.keys()))
    industry_presence_comparison = []
    
    for ind in all_industries:
        al_c = alumni_ind_counts.get(ind, 0)
        pl_c = placements_ind_counts.get(ind, 0)
        industry_presence_comparison.append({
            "industry": ind,
            "alumni_employed_count": al_c,
            "recent_placements_count": pl_c
        })
        
    industry_presence_comparison = sorted(industry_presence_comparison, key=lambda x: x['alumni_employed_count'] + x['recent_placements_count'], reverse=True)[:10]

    return {
        "company_metrics": {
            "total_companies": total_companies,
            "active_companies": active_companies
        },
        "companies_by_industry": companies_by_industry,
        "companies_by_tier": companies_by_tier,
        "companies_by_size": companies_by_size,
        "companies_by_hq": companies_by_hq,
        "role_metrics": {
            "roles_by_category": roles_by_category
        },
        "company_presence": company_presence,
        "industry_presence_comparison": industry_presence_comparison
    }
