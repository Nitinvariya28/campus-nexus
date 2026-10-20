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
    
    if department_id and department_id != 'None':
        from apps.university.helpers import resolve_department_ids
        dept_ids = resolve_department_ids(department_id)
        if dept_ids:
            q_resume &= Q(user__student_profile__department_id__in=dept_ids)
            q_analysis &= Q(resume__user__student_profile__department_id__in=dept_ids)
    if batch_id:
        q_resume &= Q(user__student_profile__batch_id=batch_id)
        q_analysis &= Q(resume__user__student_profile__batch_id=batch_id)
        
    # Get latest analysis per resume
    latest_analyses = ResumeAnalysis.objects.filter(resume=OuterRef('resume')).order_by('-created_at')
    
    # Actually for cohort summary we might just use all recent analyses or latest per user.
    # We will use all analyses for simplicity in distribution, or just the latest per user.
    # Let's get the users matching criteria
    resumes = Resume.objects.filter(q_resume)
    resume_ids = resumes.values_list('id', flat=True)
    
    analyses = ResumeAnalysis.objects.filter(resume_id__in=resume_ids, score__isnull=False)
    
    analyses_list = list(
        analyses.order_by('resume_id', 'created_at').values(
            'resume_id', 'resume__user_id', 'score', 'missing_skills'
        )
    )
    
    total_resumes_analyzed = len(set(a['resume_id'] for a in analyses_list))
    students_with_analysis = len(set(a['resume__user_id'] for a in analyses_list))
    
    scores = [float(a['score']) for a in analyses_list if a['score'] is not None]
    average_ats_score = round(sum(scores) / len(scores), 1) if scores else 0.0
    
    # Band distribution per student (using latest score per student)
    user_latest_scores = {}
    for a in analyses_list:
        if a['score'] is not None:
            user_latest_scores[a['resume__user_id']] = float(a['score'])
            
    excellent_count = sum(1 for s in user_latest_scores.values() if s >= 80)
    good_count = sum(1 for s in user_latest_scores.values() if 60 <= s < 80)
    needs_work_count = sum(1 for s in user_latest_scores.values() if s < 60)
    total_band_students = len(user_latest_scores)
    
    ats_band_distribution = []
    if total_band_students > 0:
        ats_band_distribution = [
            {"band": "Excellent (80-100)", "student_count": excellent_count, "percentage": round((excellent_count / total_band_students) * 100, 1)},
            {"band": "Good (60-79)", "student_count": good_count, "percentage": round((good_count / total_band_students) * 100, 1)},
            {"band": "Needs Work (<60)", "student_count": needs_work_count, "percentage": round((needs_work_count / total_band_students) * 100, 1)}
        ]

    # Department distribution - in memory
    from apps.profiles.models import StudentProfile
    student_profiles = StudentProfile.objects.all().values('user_id', 'department_id', 'department__name')
    dept_map = {sp['user_id']: sp for sp in student_profiles if sp['department_id']}
    
    dept_scores = collections.defaultdict(list)
    for a in analyses_list:
        uid = a['resume__user_id']
        if uid in dept_map and a['score'] is not None:
            dept_scores[dept_map[uid]['department_id']].append(float(a['score']))
            
    department_distribution = []
    for did, dscores in dept_scores.items():
        dname = next((sp['department__name'] for sp in dept_map.values() if sp['department_id'] == did), "Unknown")
        department_distribution.append({
            'department_id': did,
            'department__name': dname,
            'average_ats_score': round(sum(dscores) / len(dscores), 1)
        })
    department_distribution.sort(key=lambda x: x['average_ats_score'], reverse=True)
        
    # Improvement metrics: comparing first and last score per resume in memory
    by_resume = collections.defaultdict(list)
    for a in analyses_list:
        if a['score'] is not None:
            by_resume[a['resume_id']].append(float(a['score']))
            
    resume_improvements = []
    for r_id, rscores in by_resume.items():
        if len(rscores) > 1:
            resume_improvements.append(rscores[-1] - rscores[0])
                
    average_score_improvement = sum(resume_improvements) / len(resume_improvements) if resume_improvements else 0.0
    students_improved = len([x for x in resume_improvements if x > 0])
    
    # Placement Correlation
    placed_student_ids = set(StudentPlacementRecord.objects.values_list('student__user_id', flat=True).distinct())
    placed_scores = [float(a['score']) for a in analyses_list if a['resume__user_id'] in placed_student_ids and a['score'] is not None]
    unplaced_scores = [float(a['score']) for a in analyses_list if a['resume__user_id'] not in placed_student_ids and a['score'] is not None]
    
    placed_avg = round(sum(placed_scores) / len(placed_scores), 1) if placed_scores else 0.0
    unplaced_avg = round(sum(unplaced_scores) / len(unplaced_scores), 1) if unplaced_scores else 0.0
    
    placement_correlation = {
        "placed_students_avg_ats": placed_avg,
        "unplaced_students_avg_ats": unplaced_avg
    }
    
    # Missing skills for unplaced
    unplaced_missing_skills_counter = collections.Counter()
    for ua in analyses_list:
        if ua['resume__user_id'] not in placed_student_ids and ua.get('missing_skills'):
            for skill in ua['missing_skills']:
                unplaced_missing_skills_counter[skill] += 1
                
    unplaced_missing_skills = [{"skill": k, "flagged_count": v} for k, v in unplaced_missing_skills_counter.most_common(10)]
    
    # Students below threshold
    threshold = float(filters.get('threshold', 60))
    students_below_ids = [uid for uid, sc in user_latest_scores.items() if sc < threshold]
    
    user_info_map = {
        sp['user_id']: sp for sp in StudentProfile.objects.filter(user_id__in=students_below_ids).values('user_id', 'user__first_name', 'user__last_name')
    }
    
    students_below_threshold = [
        {
            "student_id": uid,
            "first_name": user_info_map.get(uid, {}).get('user__first_name', ''),
            "last_name": user_info_map.get(uid, {}).get('user__last_name', ''),
            "latest_ats_score": user_latest_scores[uid]
        }
        for uid in students_below_ids[:10]
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
