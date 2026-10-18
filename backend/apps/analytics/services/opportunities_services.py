from django.db.models import Count, Q, Avg, Max, Min
from django.utils import timezone
from datetime import timedelta
from django.db.models.functions import TruncMonth
from apps.opportunities.models import Opportunity
from apps.companies.models import Company

def get_opportunities_analytics(filters):
    opps_qs = Opportunity.objects.all()
    
    date_from = filters.get('date_from')
    date_to = filters.get('date_to')
    company_id = filters.get('company_id')
    opp_type = filters.get('opportunity_type')
    deadline_from = filters.get('deadline_from')
    deadline_to = filters.get('deadline_to')
    status = filters.get('status')
    
    # 1. Apply Filters
    if date_from and date_from != 'None':
        opps_qs = opps_qs.filter(created_at__gte=date_from)
    if date_to and date_to != 'None':
        opps_qs = opps_qs.filter(created_at__lte=date_to)
    if company_id and company_id != 'None':
        opps_qs = opps_qs.filter(company_id=company_id)
    if opp_type and opp_type != 'None':
        opps_qs = opps_qs.filter(opportunity_type=opp_type)
    if deadline_from and deadline_from != 'None':
        opps_qs = opps_qs.filter(deadline__gte=deadline_from)
    if deadline_to and deadline_to != 'None':
        opps_qs = opps_qs.filter(deadline__lte=deadline_to)
    if status and status != 'None':
        opps_qs = opps_qs.filter(status=status)

    now = timezone.now()

    # --- A-54: Inventory Summary ---
    total_opportunities = opps_qs.count()
    by_status = list(opps_qs.values('status').annotate(count=Count('id')).order_by('-count'))
    
    past_deadline = opps_qs.filter(deadline__lt=now).count()
    active_deadline = opps_qs.filter(deadline__gte=now).count()

    # --- A-56: Salary Statistics ---
    # salary_package is a CharField. We do best-effort extraction in Python
    import re
    salaries = []
    for pkg in opps_qs.exclude(salary_package__isnull=True).exclude(salary_package="").values_list('salary_package', flat=True):
        nums = re.findall(r'\d+(?:\.\d+)?', pkg)
        if nums:
            salaries.append(float(nums[0]))
            
    if salaries:
        avg_sal = round(sum(salaries) / len(salaries), 2)
        min_sal = round(min(salaries), 2)
        max_sal = round(max(salaries), 2)
    else:
        avg_sal = min_sal = max_sal = None

    # --- A-58: Urgent Deadlines ---
    next_week = now + timedelta(days=7)
    urgent_deadlines_qs = opps_qs.filter(
        deadline__gte=now,
        deadline__lte=next_week,
        status='OPEN'
    ).values('id', 'title', 'company__name', 'deadline').order_by('deadline')[:10]
    urgent_deadlines = list(urgent_deadlines_qs)

    # --- A-55, A-60: Breakdowns ---
    by_employment_type = list(opps_qs.values('opportunity_type').annotate(count=Count('id')).order_by('-count'))
    by_company = list(opps_qs.values('company__name').annotate(count=Count('id')).order_by('-count')[:50])

    # --- A-57: Trends (Posted Per Month) ---
    posted_per_month = list(
        opps_qs.annotate(month=TruncMonth('created_at'))
        .values('month')
        .annotate(count=Count('id'))
        .order_by('month')
    )
    # Format month dates to strings for JSON
    for p in posted_per_month:
        if p['month']:
            p['month'] = p['month'].strftime('%Y-%m')

    # --- B-55: Platform Effectiveness (ROI) ---
    # Group opportunities by company and aggregate platform-sourced placements in a single query
    eff_qs = (
        opps_qs.values('company__name')
        .annotate(
            opportunities_posted=Count('id', distinct=True),
            platform_sourced_placements=Count('successful_placements', distinct=True)
        )
        .order_by('-platform_sourced_placements')[:50]
    )
    platform_effectiveness = [
        {
            "company__name": item['company__name'],
            "opportunities_posted": item['opportunities_posted'],
            "platform_sourced_placements": item['platform_sourced_placements'],
            "conversion_pct": round((item['platform_sourced_placements'] / item['opportunities_posted']) * 100, 2)
            if item['opportunities_posted'] > 0 else 0.0
        }
        for item in eff_qs if item['company__name']
    ]

    return {
        "inventory_summary": {
            "total_opportunities": total_opportunities,
            "by_status": by_status,
            "deadline_status": {
                "past_deadline": past_deadline,
                "active_deadline": active_deadline
            }
        },
        "salary_statistics": {
            "average_salary": avg_sal,
            "minimum_salary": min_sal,
            "maximum_salary": max_sal
        },
        "urgent_deadlines": urgent_deadlines,
        "breakdowns": {
            "by_employment_type": by_employment_type,
            "by_company": by_company
        },
        "trends": {
            "posted_per_month": posted_per_month
        },
        "platform_effectiveness": platform_effectiveness
    }
