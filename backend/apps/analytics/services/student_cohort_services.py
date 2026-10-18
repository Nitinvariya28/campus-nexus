from django.db.models import Count, Q, F, FloatField, ExpressionWrapper
from apps.profiles.models import StudentProfile, StudentPlacementRecord
from apps.university.models import Department, Batch

def get_student_cohort_analytics(filters):
    students_qs = StudentProfile.objects.filter(user__role='STUDENT')
    placements_qs = StudentPlacementRecord.objects.filter(student__user__role='STUDENT')
    
    dept_id = filters.get('department_id')
    batch_id = filters.get('batch_id')
    semester = filters.get('semester')
    
    placement_year = filters.get('placement_year')
    company_tier = filters.get('company_tier')
    industry = filters.get('industry')
    
    # 1. Base Student Cohort Filters
    if dept_id and dept_id != 'None':
        students_qs = students_qs.filter(department_id=dept_id)
        placements_qs = placements_qs.filter(student__department_id=dept_id)
    if batch_id and batch_id != 'None':
        students_qs = students_qs.filter(batch_id=batch_id)
        placements_qs = placements_qs.filter(student__batch_id=batch_id)
    if semester and semester != 'None':
        students_qs = students_qs.filter(semester=semester)
        placements_qs = placements_qs.filter(student__semester=semester)
        
    # 2. Qualifying Placement Filters
    if placement_year and placement_year != 'None':
        placements_qs = placements_qs.filter(placement_year=placement_year)
    if company_tier and company_tier != 'None':
        placements_qs = placements_qs.filter(company__company_tier=company_tier)
    if industry and industry != 'None':
        placements_qs = placements_qs.filter(company__industry=industry)

    # --- A-11: Total Students ---
    total_students = students_qs.count()
    
    # --- A-16: Profile Completeness ---
    if total_students > 0:
        comp_agg = students_qs.aggregate(
            bio=Count('id', filter=Q(bio__isnull=False) & ~Q(bio='')),
            phone=Count('id', filter=Q(phone__isnull=False) & ~Q(phone='')),
            address=Count('id', filter=Q(address__isnull=False) & ~Q(address='')),
        )
        bio_pct = round((comp_agg['bio'] / total_students) * 100, 2)
        phone_pct = round((comp_agg['phone'] / total_students) * 100, 2)
        address_pct = round((comp_agg['address'] / total_students) * 100, 2)
    else:
        bio_pct = phone_pct = address_pct = 0.0

    # --- A-09: University Structure (Active Departments & Batches) ---
    active_departments = list(Department.objects.filter(is_active=True).values('id', 'name', 'is_active'))
    active_batches = list(Batch.objects.filter(is_active=True).values('id', 'start_year', 'end_year', 'is_active'))
    
    # --- A-12, A-13, A-14, A-15: Student Demographics ---
    students_by_department = list(students_qs.values('department__name').annotate(count=Count('id')).order_by('-count'))
    students_by_batch = list(students_qs.values('batch__start_year', 'batch__end_year').annotate(count=Count('id')).order_by('-count'))
    students_by_semester = list(students_qs.values('semester').annotate(count=Count('id')).order_by('semester'))
    
    dept_batch_matrix = list(
        students_qs.values('department__name', 'batch__start_year', 'batch__end_year')
        .annotate(count=Count('id'))
        .order_by('department__name', 'batch__start_year')
    )
    
    # --- B-01, B-02, B-48: Placement Coverage ---
    # Bulk query placement coverage by department and batch to eliminate N+1 loops
    dept_placed_map = dict(
        placements_qs.values_list('student__department__name')
        .annotate(placed=Count('student_id', distinct=True))
    )
    batch_placed_raw = list(
        placements_qs.values('student__batch__start_year', 'student__batch__end_year')
        .annotate(placed=Count('student_id', distinct=True))
    )
    batch_placed_map = {
        (b['student__batch__start_year'], b['student__batch__end_year']): b['placed']
        for b in batch_placed_raw
    }

    # Coverage by Department
    coverage_by_dept = []
    for dept_stat in students_by_department:
        d_name = dept_stat['department__name']
        eligible = dept_stat['count']
        placed = dept_placed_map.get(d_name, 0)
        cov_pct = round((placed / eligible) * 100, 2) if eligible > 0 else 0.0
        coverage_by_dept.append({
            "department__name": d_name,
            "eligible_students": eligible,
            "placed_students": placed,
            "coverage_pct": cov_pct
        })
        
    # Coverage by Batch
    coverage_by_batch = []
    for batch_stat in students_by_batch:
        s_year = batch_stat['batch__start_year']
        e_year = batch_stat['batch__end_year']
        eligible = batch_stat['count']
        placed = batch_placed_map.get((s_year, e_year), 0)
        cov_pct = round((placed / eligible) * 100, 2) if eligible > 0 else 0.0
        coverage_by_batch.append({
            "batch_start_year": s_year,
            "batch_end_year": e_year,
            "eligible_students": eligible,
            "placed_students": placed,
            "coverage_pct": cov_pct
        })
        
    # Coverage by Department and Year
    coverage_by_dept_and_year = list(
        placements_qs.values('student__department__name', 'placement_year')
        .annotate(placed_students=Count('student_id', distinct=True))
        .order_by('student__department__name', '-placement_year')
    )
    
    return {
        "cohort_metrics": {
            "total_students": total_students,
            "profile_completeness": {
                "bio_completed_pct": bio_pct,
                "phone_completed_pct": phone_pct,
                "address_completed_pct": address_pct
            }
        },
        "university_structure": {
            "active_departments": active_departments,
            "active_batches": active_batches
        },
        "students_by_department": students_by_department,
        "students_by_batch": students_by_batch,
        "students_by_semester": students_by_semester,
        "department_by_batch_matrix": dept_batch_matrix,
        "placement_coverage": {
            "by_department": coverage_by_dept,
            "by_batch": coverage_by_batch,
            "by_department_and_year": coverage_by_dept_and_year
        }
    }
