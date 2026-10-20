from django.db.models import Count, OuterRef, Subquery, Q, Prefetch
from apps.profiles.models import StudentProfile, StudentPlacementRecord
from apps.resumes.models import Resume, ResumeAnalysis
from django.utils import timezone

def get_readiness_analytics(filters):
    department_id = filters.get('department_id')
    batch_id = filters.get('batch_id')
    readiness_band = filters.get('readiness_band')

    # Step 1: Define Unplaced Students
    # An unplaced student is one who does NOT have a StudentPlacementRecord
    placed_student_ids = StudentPlacementRecord.objects.values_list('student_id', flat=True)
    unplaced_qs = StudentProfile.objects.exclude(id__in=placed_student_ids).select_related('user', 'department', 'batch')

    # Apply filters to the unplaced cohort
    if department_id and department_id != 'None':
        from apps.university.helpers import resolve_department_ids
        dept_ids = resolve_department_ids(department_id)
        if dept_ids:
            unplaced_qs = unplaced_qs.filter(department_id__in=dept_ids)
    if batch_id and batch_id != 'None':
        unplaced_qs = unplaced_qs.filter(batch_id=batch_id)

    # Step 2: Extract Resume & ATS info for these students
    # We prefetch resumes and their analyses to avoid N+1 queries.
    unplaced_qs = unplaced_qs.prefetch_related(
        Prefetch('user__resumes', queryset=Resume.objects.prefetch_related(
            Prefetch('analyses', queryset=ResumeAnalysis.objects.order_by('-created_at'))
        ))
    )

    action_list = []
    no_resume_count = 0
    low_ats_count = 0
    ready_count = 0
    
    LOW_SCORE_THRESHOLD = 70.0

    for student in unplaced_qs:
        resumes = list(student.user.resumes.all())
        
        status = "NO_RESUME"
        latest_score = None
        
        if resumes:
            # Get the most recent analysis across all resumes for this user, or just the primary one
            # We'll just check all analyses and find the latest one, or the highest score.
            # Usually, you take the most recent analysis.
            analyses = []
            for r in resumes:
                analyses.extend(list(r.analyses.all()))
            
            if analyses:
                analyses.sort(key=lambda x: x.created_at, reverse=True)
                latest_analysis = analyses[0]
                if latest_analysis.score is not None:
                    latest_score = float(latest_analysis.score)
                    if latest_score < LOW_SCORE_THRESHOLD:
                        status = "LOW_SCORE"
                    else:
                        status = "READY"
                else:
                    status = "LOW_SCORE" # Unscored is treated as needs attention
            else:
                # Has resume but no analysis
                status = "LOW_SCORE"

        # Apply readiness band filter if requested
        if readiness_band and readiness_band != 'None' and status != readiness_band:
            continue
            
        if status == "NO_RESUME":
            no_resume_count += 1
        elif status == "LOW_SCORE":
            low_ats_count += 1
        else:
            ready_count += 1

        action_list.append({
            "student_id": student.id,
            "department__name": student.department.name if student.department else None,
            "batch__start_year": student.batch.start_year if student.batch else None,
            "batch__end_year": student.batch.end_year if student.batch else None,
            "resume_status": status,
            "latest_ats_score": round(latest_score, 2) if latest_score is not None else None
        })

    # Step 3: Summarize Cohort
    total_unplaced = len(action_list)
    
    # We must manually aggregate the filtered list since we did python-level filtering
    by_dept_dict = {}
    by_batch_dict = {}
    
    for item in action_list:
        dept = item["department__name"] or "Unknown"
        batch_key = f"{item['batch__start_year']}-{item['batch__end_year']}"
        
        by_dept_dict[dept] = by_dept_dict.get(dept, 0) + 1
        by_batch_dict[batch_key] = by_batch_dict.get(batch_key, 0) + 1

    by_department = [{"department__name": k, "count": v} for k, v in by_dept_dict.items()]
    by_batch = [{"batch": k, "count": v} for k, v in by_batch_dict.items()]

    # Sort action list by score ascending to bubble up the worst ones first
    # None scores go first
    action_list.sort(key=lambda x: x['latest_ats_score'] if x['latest_ats_score'] is not None else -1)
    
    # Pagination simulated by taking top 50 (In real life, use DRF pagination, but for dashboard API we return top actionable items)
    action_list = action_list[:50]

    return {
        "unplaced_cohort_summary": {
            "total_unplaced_students": total_unplaced,
            "by_department": sorted(by_department, key=lambda x: x['count'], reverse=True),
            "by_batch": sorted(by_batch, key=lambda x: x['count'], reverse=True)
        },
        "readiness_metrics": {
            "no_resume_uploaded": no_resume_count,
            "low_ats_score": low_ats_count,
            "ready_for_placements": ready_count
        }
    }
