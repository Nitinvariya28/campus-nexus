import collections
import re
from django.db.models import Count, Q, Avg
from django.db.models.functions import TruncMonth
from apps.interviews.models import InterviewExperience, InterviewRound
from apps.companies.models import Company

def get_interview_analytics(filters):
    q_exp = Q()
    q_round = Q()

    date_from = filters.get('date_from')
    date_to = filters.get('date_to')
    company_id = filters.get('company_id')

    if date_from:
        q_exp &= Q(created_at__gte=date_from)
        q_round &= Q(interview_experience__created_at__gte=date_from)
    if date_to:
        q_exp &= Q(created_at__lte=date_to)
        q_round &= Q(interview_experience__created_at__lte=date_to)
    if company_id and str(company_id).lower() != 'none':
        q_exp &= Q(company_id=company_id)
        q_round &= Q(interview_experience__company_id=company_id)

    # Basic Metrics
    # A-61
    total_by_type = list(
        InterviewExperience.objects.filter(q_exp)
        .values('experience_type')
        .annotate(count=Count('id'))
        .order_by('-count')
    )

    # A-62
    reported_results = list(
        InterviewExperience.objects.filter(q_exp)
        .values('result')
        .annotate(count=Count('id'))
        .order_by('-count')
    )

    # A-63
    difficulty_distribution = list(
        InterviewExperience.objects.filter(q_exp)
        .values('difficulty')
        .annotate(count=Count('id'))
        .order_by('-count')
    )

    # A-64
    monthly_volume = list(
        InterviewExperience.objects.filter(q_exp)
        .annotate(month=TruncMonth('created_at'))
        .values('month')
        .annotate(count=Count('id'))
        .order_by('month')
    )

    # A-65
    top_companies = list(
        InterviewExperience.objects.filter(q_exp)
        .values('company_id', 'company__name')
        .annotate(count=Count('id'))
        .order_by('-count')[:10]
    )

    # Round Analytics
    total_experiences = InterviewExperience.objects.filter(q_exp).count()
    total_rounds = InterviewRound.objects.filter(q_round).count()
    # A-66
    avg_rounds_per_experience = round(total_rounds / total_experiences, 1) if total_experiences > 0 else 0

    # A-67
    round_distribution = list(
        InterviewRound.objects.filter(q_round)
        .values('round_type', 'mode')
        .annotate(count=Count('id'))
        .order_by('-count')
    )

    # A-68
    avg_duration_by_type = list(
        InterviewRound.objects.filter(q_round, duration_minutes__isnull=False)
        .values('round_type')
        .annotate(avg_duration_minutes=Avg('duration_minutes'))
        .order_by('-avg_duration_minutes')
    )

    # A-69
    top_topics = []
    rounds_with_topics = InterviewRound.objects.filter(q_round, topics__isnull=False).values_list('topics', flat=True)
    if rounds_with_topics:
        topic_counter = collections.Counter()
        for t in rounds_with_topics:
            # Simple comma split and cleanup
            terms = [term.strip().title() for term in re.split(r'[,|;]', t) if term.strip()]
            topic_counter.update(terms)
        top_topics = [{"topic": topic, "count": count} for topic, count in topic_counter.most_common(10)]

    # Advanced Insights
    # B-18
    highest_rejection_companies = list(
        InterviewExperience.objects.filter(q_exp)
        .values('company_id', 'company__name')
        .annotate(
            total_interviews=Count('id'),
            rejections=Count('id', filter=Q(result='NOT_SELECTED'))
        )
        .filter(total_interviews__gte=5)
        .annotate(
            rejection_rate=Count('id', filter=Q(result='NOT_SELECTED')) * 100.0 / Count('id')
        )
        .order_by('-rejection_rate')[:10]
    )

    # B-19
    result_by_difficulty = list(
        InterviewExperience.objects.filter(q_exp)
        .values('difficulty', 'result')
        .annotate(count=Count('id'))
        .order_by('difficulty', '-count')
    )

    # B-20
    rejections_by_round_type = list(
        InterviewRound.objects.filter(q_round, interview_experience__result='NOT_SELECTED')
        .values('round_type')
        .annotate(rejection_count=Count('id'))
        .order_by('-rejection_count')
    )

    # B-21
    target_company_expectations = None
    if company_id and str(company_id).lower() != 'none':
        expected_rounds = list(
            InterviewRound.objects.filter(q_round)
            .values_list('round_type', flat=True)
            .annotate(count=Count('id'))
            .order_by('-count')[:3]
        )
        most_common_mode = list(
            InterviewRound.objects.filter(q_round)
            .values('mode')
            .annotate(count=Count('id'))
            .order_by('-count')[:1]
        )
        most_common_difficulty = list(
            InterviewExperience.objects.filter(q_exp)
            .values('difficulty')
            .annotate(count=Count('id'))
            .order_by('-count')[:1]
        )
        target_company_expectations = {
            "expected_rounds": expected_rounds,
            "most_common_mode": most_common_mode[0]['mode'] if most_common_mode else None,
            "average_difficulty": most_common_difficulty[0]['difficulty'] if most_common_difficulty else None,
        }

    # B-57
    companies_missing_experiences = list(
        Company.objects.annotate(
            placement_count=Count('hired_students', distinct=True),
            experience_count=Count('interview_experiences', distinct=True)
        ).filter(placement_count__gt=0, experience_count=0)
        .values('id', 'name', 'placement_count')
        .order_by('-placement_count')[:15]
    )

    # B-58
    experience_vs_placement_comparison = list(
        Company.objects.annotate(
            reported_selected_experiences=Count('interview_experiences', filter=Q(interview_experiences__result='SELECTED'), distinct=True),
            actual_recorded_placements=Count('hired_students', distinct=True)
        ).filter(Q(reported_selected_experiences__gt=0) | Q(actual_recorded_placements__gt=0))
        .values('id', 'name', 'reported_selected_experiences', 'actual_recorded_placements')
        .order_by('-actual_recorded_placements')[:15]
    )

    # Remap company names for B-57 and B-58 to match JSON response
    for c in companies_missing_experiences:
        c['company_id'] = c.pop('id')
        c['company__name'] = c.pop('name')
        c['actual_recorded_placements'] = c.pop('placement_count')
        
    for c in experience_vs_placement_comparison:
        c['company_id'] = c.pop('id')
        c['company__name'] = c.pop('name')

    return {
        "basic_metrics": {
            "total_by_type": total_by_type,
            "reported_results": reported_results,
            "difficulty_distribution": difficulty_distribution,
            "monthly_volume": monthly_volume,
            "top_companies": top_companies
        },
        "round_analytics": {
            "avg_rounds_per_experience": avg_rounds_per_experience,
            "round_distribution": round_distribution,
            "avg_duration_by_type": avg_duration_by_type,
            "top_topics": top_topics
        },
        "advanced_insights": {
            "highest_rejection_companies": highest_rejection_companies,
            "result_by_difficulty": result_by_difficulty,
            "rejections_by_round_type": rejections_by_round_type,
            "target_company_expectations": target_company_expectations
        },
        "placement_comparison": {
            "companies_missing_experiences": companies_missing_experiences,
            "experience_vs_placement_comparison": experience_vs_placement_comparison
        }
    }
