import collections
from django.db.models import Count, Q, Avg, Subquery, OuterRef
from apps.resumes.models import Resume, ResumeAnalysis
from apps.profiles.models import StudentPlacementRecord
from apps.university.models import Department

def get_cohort_resume_readiness(filters):
    q_resume = Q()
    q_analysis = Q()
    
    department_id = filters.get('department_id')
    batch_id = filters.get('batch_id')
    
    if department_id:
        q_resume &= Q(user__studentprofile__department_id=department_id)
        q_analysis &= Q(resume__user__studentprofile__department_id=department_id)
    if batch_id:
        q_resume &= Q(user__studentprofile__batch_id=batch_id)
        q_analysis &= Q(resume__user__studentprofile__batch_id=batch_id)
        
    # Get latest analysis per resume
    latest_analyses = ResumeAnalysis.objects.filter(resume=OuterRef('resume')).order_by('-created_at')
    
    # Actually for cohort summary we might just use all recent analyses or latest per user.
    # We will use all analyses for simplicity in distribution, or just the latest per user.
    # Let's get the users matching criteria
    resumes = Resume.objects.filter(q_resume)
    resume_ids = resumes.values_list('id', flat=True)
    
    analyses = ResumeAnalysis.objects.filter(resume_id__in=resume_ids, score__isnull=False)
    
    total_resumes_analyzed = analyses.values('resume_id').distinct().count()
    students_with_analysis = analyses.values('resume__user_id').distinct().count()
    
    average_ats_score = analyses.aggregate(avg=Avg('score'))['avg']
    average_ats_score = float(average_ats_score) if average_ats_score else 0.0
    
    # Band distribution
    excellent_count = analyses.filter(score__gte=80).values('resume__user_id').distinct().count()
    good_count = analyses.filter(score__gte=60, score__lt=80).values('resume__user_id').distinct().count()
    needs_work_count = analyses.filter(score__lt=60).values('resume__user_id').distinct().count()
    
    total_band_students = excellent_count + good_count + needs_work_count
    
    ats_band_distribution = []
    if total_band_students > 0:
        ats_band_distribution = [
            {"band": "Excellent (80-100)", "student_count": excellent_count, "percentage": round((excellent_count / total_band_students) * 100, 1)},
            {"band": "Good (60-79)", "student_count": good_count, "percentage": round((good_count / total_band_students) * 100, 1)},
            {"band": "Needs Work (<60)", "student_count": needs_work_count, "percentage": round((needs_work_count / total_band_students) * 100, 1)}
        ]

    # Department distribution - done in memory to avoid reverse OneToOne bugs
    from apps.profiles.models import StudentProfile
    student_profiles = StudentProfile.objects.all().values('user_id', 'department_id', 'department__name')
    dept_map = {sp['user_id']: sp for sp in student_profiles if sp['department_id']}
    
    dept_scores = collections.defaultdict(list)
    analysis_scores = analyses.values('resume__user_id', 'score')
    for a in analysis_scores:
        uid = a['resume__user_id']
        if uid in dept_map:
            dept_scores[dept_map[uid]['department_id']].append(float(a['score']))
            
    department_distribution = []
    for did, scores in dept_scores.items():
        # Find department name
        dname = next((sp['department__name'] for sp in dept_map.values() if sp['department_id'] == did), "Unknown")
        department_distribution.append({
            'department_id': did,
            'department__name': dname,
            'average_ats_score': round(sum(scores) / len(scores), 1)
        })
    department_distribution.sort(key=lambda x: x['average_ats_score'], reverse=True)

        
    # Improvement metrics: approximation using python logic (comparing first and last score per resume)
    # Group by resume_id
    resume_improvements = []
    for r_id in resume_ids:
        r_analyses = analyses.filter(resume_id=r_id).order_by('created_at')
        if r_analyses.count() > 1:
            first = r_analyses.first().score
            last = r_analyses.last().score
            if last and first:
                resume_improvements.append(float(last) - float(first))
                
    average_score_improvement = sum(resume_improvements) / len(resume_improvements) if resume_improvements else 0.0
    students_improved = len([x for x in resume_improvements if x > 0])
    
    # Placement Correlation
    placed_student_ids = StudentPlacementRecord.objects.values_list('student__user_id', flat=True).distinct()
    placed_avg = analyses.filter(resume__user_id__in=placed_student_ids).aggregate(avg=Avg('score'))['avg']
    unplaced_avg = analyses.exclude(resume__user_id__in=placed_student_ids).aggregate(avg=Avg('score'))['avg']
    
    placement_correlation = {
        "placed_students_avg_ats": float(placed_avg) if placed_avg else 0.0,
        "unplaced_students_avg_ats": float(unplaced_avg) if unplaced_avg else 0.0
    }
    
    # Missing skills for unplaced
    unplaced_missing_skills_counter = collections.Counter()
    unplaced_analyses = analyses.exclude(resume__user_id__in=placed_student_ids)
    for ua in unplaced_analyses:
        if ua.missing_skills:
            for skill in ua.missing_skills:
                unplaced_missing_skills_counter[skill] += 1
                
    unplaced_missing_skills = [{"skill": k, "flagged_count": v} for k, v in unplaced_missing_skills_counter.most_common(10)]
    
    # Students below threshold
    threshold = float(filters.get('threshold', 60))
    # We fetch latest score per student below threshold
    latest_score_subquery = ResumeAnalysis.objects.filter(
        resume__user_id=OuterRef('resume__user_id')
    ).order_by('-created_at').values('score')[:1]
    
    students_below = analyses.annotate(
        latest_score=Subquery(latest_score_subquery)
    ).filter(latest_score__lt=threshold).values(
        'resume__user_id', 'resume__user__first_name', 'resume__user__last_name', 'latest_score'
    ).distinct()[:10]
    
    students_below_threshold = [
        {
            "student_id": s['resume__user_id'],
            "first_name": s['resume__user__first_name'],
            "last_name": s['resume__user__last_name'],
            "latest_ats_score": float(s['latest_score'])
        } for s in students_below
    ]

    return {
        "cohort_ats_summary": {
            "average_ats_score": average_ats_score,
            "total_resumes_analyzed": total_resumes_analyzed,
            "students_with_analysis": students_with_analysis
        },
        "ats_band_distribution": ats_band_distribution,
        "department_distribution": department_distribution,
        "improvement_metrics": {
            "average_score_improvement": round(average_score_improvement, 2),
            "students_improved": students_improved
        },
        "placement_correlation": placement_correlation,
        "unplaced_missing_skills": unplaced_missing_skills,
        "students_below_threshold": students_below_threshold
    }
