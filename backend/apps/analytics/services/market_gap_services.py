from django.db.models import Count, Avg, Max
from django.utils import timezone
from apps.opportunities.models import Opportunity, OpportunitySkill
from apps.skills.models import UserSkill, Skill
from apps.profiles.models import StudentProfile, StudentPlacementRecord
from apps.accounts.models import User

def get_market_gap_analytics(filters):
    placement_year = filters.get('placement_year')
    department_id = filters.get('department_id')
    batch_id = filters.get('batch_id')
    semester = filters.get('semester')
    skill_id = filters.get('skill_id')
    company_id = filters.get('company_id')
    company_tier = filters.get('company_tier')
    industry = filters.get('industry')
    employment_type = filters.get('employment_type')

    # Base Querysets
    opp_qs = Opportunity.objects.all()
    if company_id and company_id != 'None':
        opp_qs = opp_qs.filter(company_id=company_id)
    if industry and industry != 'None':
        opp_qs = opp_qs.filter(company__industry=industry)
    if company_tier and company_tier != 'None':
        opp_qs = opp_qs.filter(company__tier=company_tier)
    if employment_type and employment_type != 'None':
        opp_qs = opp_qs.filter(employment_type=employment_type)

    total_opps = opp_qs.count()

    student_qs = StudentProfile.objects.filter(user__role='STUDENT')
    if department_id and department_id != 'None':
        student_qs = student_qs.filter(department_id=department_id)
    if batch_id and batch_id != 'None':
        student_qs = student_qs.filter(batch_id=batch_id)
    if semester and semester != 'None':
        student_qs = student_qs.filter(semester=semester)

    total_students = student_qs.count()
    
    # Pre-fetch sets for efficiency
    eligible_student_user_ids = set(student_qs.values_list('user_id', flat=True))

    # --- A-59: Market Demand Overview ---
    opp_skill_qs = OpportunitySkill.objects.filter(opportunity__in=opp_qs)
    
    top_required_skills = []
    if total_opps > 0:
        skill_counts = opp_skill_qs.values('skill__name', 'skill_id').annotate(count=Count('opportunity', distinct=True)).order_by('-count')[:20]
        for sk in skill_counts:
            top_required_skills.append({
                "skill__name": sk['skill__name'],
                "opportunities_requiring_skill": sk['count'],
                "market_demand_pct": round((sk['count'] / total_opps) * 100, 2)
            })

    # --- B-05: Supply vs Demand Global ---
    supply_vs_demand_global_skills = []
    for req_sk in top_required_skills:
        skill_id_val = next(x['skill_id'] for x in skill_counts if x['skill__name'] == req_sk['skill__name'])
        users_with_skill = set(UserSkill.objects.filter(skill_id=skill_id_val, user_id__in=eligible_student_user_ids).values_list('user_id', flat=True))
        
        supply_pct = round((len(users_with_skill) / total_students) * 100, 2) if total_students else 0.0
        
        supply_vs_demand_global_skills.append({
            "skill__name": req_sk['skill__name'],
            "market_demand_pct": req_sk['market_demand_pct'],
            "student_supply_pct": supply_pct,
            "market_gap_pct": round(supply_pct - req_sk['market_demand_pct'], 2)
        })

    # --- B-06: Department Supply vs Demand ---
    department_supply_vs_demand = []
    departments = student_qs.values_list('department__name', flat=True).distinct()
    
    for dept in departments:
        if not dept: continue
        dept_student_ids = set(student_qs.filter(department__name=dept).values_list('user_id', flat=True))
        dept_student_count = len(dept_student_ids)
        if dept_student_count == 0: continue
        
        dept_skills = []
        for req_sk in top_required_skills:
            skill_id_val = next(x['skill_id'] for x in skill_counts if x['skill__name'] == req_sk['skill__name'])
            dept_users_with_skill = set(UserSkill.objects.filter(skill_id=skill_id_val, user_id__in=dept_student_ids).values_list('user_id', flat=True))
            dept_supply_pct = round((len(dept_users_with_skill) / dept_student_count) * 100, 2)
            
            dept_skills.append({
                "skill__name": req_sk['skill__name'],
                "market_demand_pct": req_sk['market_demand_pct'],
                "department_supply_pct": dept_supply_pct,
                "market_gap_pct": round(dept_supply_pct - req_sk['market_demand_pct'], 2)
            })
            
        department_supply_vs_demand.append({
            "department__name": dept,
            "department_denominator_students": dept_student_count,
            "skills": dept_skills
        })

    # --- B-53: Open Drive Scarcity ---
    open_opps = Opportunity.objects.filter(status='OPEN')
    if deadline := timezone.now():
        open_opps = open_opps.filter(deadline__gt=deadline)
        
    open_drive_scarcity = []
    open_skill_counts = OpportunitySkill.objects.filter(opportunity__in=open_opps).values('skill__name', 'skill_id').annotate(count=Count('opportunity', distinct=True))
    
    for osk in open_skill_counts:
        students_with_skill = UserSkill.objects.filter(skill_id=osk['skill_id'], user__role='STUDENT').values('user_id').distinct().count()
        
        scarcity_status = "HEALTHY"
        if students_with_skill < osk['count'] * 2: # Heuristic for Critical
            scarcity_status = "CRITICAL_SHORTAGE"
        elif students_with_skill < osk['count'] * 5:
            scarcity_status = "MODERATE_SHORTAGE"
            
        if scarcity_status != "HEALTHY":
            open_drive_scarcity.append({
                "skill__name": osk['skill__name'],
                "open_opportunities_requiring_skill": osk['count'],
                "total_eligible_students_with_skill": students_with_skill,
                "scarcity_status": scarcity_status
            })

    # --- B-54: Package Associations ---
    package_associations = []
    placements = StudentPlacementRecord.objects.filter(package_lpa__isnull=False)
    if placement_year and placement_year != 'None':
        placements = placements.filter(placement_year=placement_year)
        
    # Get top 20 skills listed by placed students
    placed_student_ids = list(placements.values_list('student__user_id', flat=True))
    top_placed_skills = UserSkill.objects.filter(user_id__in=placed_student_ids).values('skill__name', 'skill_id').annotate(count=Count('user_id', distinct=True)).order_by('-count')[:20]
    
    for psk in top_placed_skills:
        users_with_skill = set(UserSkill.objects.filter(skill_id=psk['skill_id']).values_list('user_id', flat=True))
        skill_placements = placements.filter(student__user_id__in=users_with_skill)
        
        if skill_placements.count() >= 3: # Sample size threshold
            avg_pkg = skill_placements.aggregate(Avg('package_lpa'))['package_lpa__avg']
            max_pkg = skill_placements.aggregate(Max('package_lpa'))['package_lpa__max']
            
            package_associations.append({
                "skill__name": psk['skill__name'],
                "sample_size": skill_placements.count(),
                "average_package_lpa": round(float(avg_pkg), 2) if avg_pkg else 0.0,
                "max_package_lpa": round(float(max_pkg), 2) if max_pkg else 0.0
            })
            
    package_associations = sorted(package_associations, key=lambda x: x['average_package_lpa'], reverse=True)

    return {
        "market_demand_overview": {
            "total_opportunities_analyzed": total_opps,
            "top_required_skills": top_required_skills
        },
        "supply_vs_demand_global": {
            "denominators": {
                "total_opportunities": total_opps,
                "total_students": total_students
            },
            "skills": supply_vs_demand_global_skills
        },
        "department_supply_vs_demand": department_supply_vs_demand,
        "open_drive_scarcity": open_drive_scarcity,
        "package_associations": package_associations
    }
