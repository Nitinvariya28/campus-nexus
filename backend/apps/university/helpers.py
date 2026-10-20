import re
from datetime import date
from .models import Department, Batch

DEPT_ALIASES = {
    'BCE': ['BCE', 'CSE', 'CE'],
    'CSE': ['BCE', 'CSE', 'CE'],
    'BEC': ['BEC', 'ECE', 'EC'],
    'ECE': ['BEC', 'ECE', 'EC'],
    'BIT': ['IT', 'BIT'],
    'IT': ['IT', 'BIT'],
    'BEE': ['BEE', 'EE'],
    'EE': ['BEE', 'EE'],
    'BME': ['BME', 'ME'],
    'ME': ['BME', 'ME'],
    'BCV': ['BCV', 'CE', 'CL'],
    'BCL': ['BCV', 'CE', 'CL'],
    'CE': ['BCV', 'CE', 'CL'],
    'BCH': ['BCH', 'CH'],
    'CH': ['BCH', 'CH'],
    'BAM': ['BAM', 'AM'],
    'AM': ['BAM', 'AM'],
    'AIDS': ['AIDS', 'AI'],
}

def extract_academic_info_from_email(email):
    """
    Parses university student email format: e.g. 24bce001@nirmauni.ac.in or 22bec513_8311@nirmauni.ac.in.
    Returns (department_object, batch_object).
    Falls back to active database records to strictly prevent NOT NULL constraint violations.
    """
    dept = None
    batch = None

    if email:
        email_clean = str(email).strip().lower()
        match = re.search(r"^(\d{2})([a-zA-Z]{2,4})\d+", email_clean)
        
        if match:
            year_str, dept_code = match.group(1), match.group(2).upper()
            try:
                start_year = 2000 + int(year_str)
                end_year = start_year + 4
                batch = Batch.objects.filter(start_year=start_year, end_year=end_year).first()
                if not batch:
                    batch = Batch.objects.filter(start_year=start_year).first()
            except Exception:
                batch = None

            candidates = DEPT_ALIASES.get(dept_code, [dept_code])
            dept = Department.objects.filter(code__in=candidates).first()
            if not dept:
                dept = Department.objects.filter(name__icontains=dept_code).first()

    # Fallback to ensure department and batch are NEVER None
    if not dept:
        dept = Department.objects.filter(is_active=True).first() or Department.objects.first()
    if not batch:
        batch = Batch.objects.filter(is_active=True).first() or Batch.objects.first()

    return dept, batch

def calculate_student_semester(admission_year=None, current_date=None, student_profile=None, email=None):
    """
    Dynamically calculates student semester (1-8), academic year (1st, 2nd, 3rd, 4th),
    and graduation status based on verified admission year and the official institution calendar:
    - Odd Semesters (1, 3, 5, 7): July 1 - December 31
    - Even Semesters (2, 4, 6, 8): January 1 - June 30

    Returns a dict with complete academic progression metrics.
    """
    if current_date is None:
        current_date = date.today()

    resolved_year = None
    if admission_year:
        try:
            resolved_year = int(admission_year)
            if resolved_year < 100:
                resolved_year += 2000
        except (ValueError, TypeError):
            resolved_year = None

    if not resolved_year and student_profile:
        if hasattr(student_profile, 'batch') and student_profile.batch and student_profile.batch.start_year:
            resolved_year = student_profile.batch.start_year
        if not resolved_year and hasattr(student_profile, 'user') and student_profile.user and student_profile.user.email:
            email = student_profile.user.email

    if not resolved_year and email:
        email_clean = str(email).strip().lower()
        match = re.search(r"^(\d{2})([a-zA-Z]{2,4})\d+", email_clean)
        if match:
            try:
                resolved_year = 2000 + int(match.group(1))
            except Exception:
                pass

    if not resolved_year:
        resolved_year = current_date.year

    curr_year = current_date.year
    curr_month = current_date.month

    years_elapsed = curr_year - resolved_year
    expected_graduation_year = resolved_year + 4

    if years_elapsed < 0:
        calculated_sem = 1
    elif curr_month >= 7:
        calculated_sem = (years_elapsed * 2) + 1
    else:
        calculated_sem = (years_elapsed * 2)

    is_graduated = calculated_sem > 8

    if is_graduated:
        semester = 8
        semester_label = "Graduated"
        academic_year = 4
        academic_year_label = "Graduated"
    elif calculated_sem < 1:
        semester = 1
        semester_label = "Semester 1"
        academic_year = 1
        academic_year_label = "1st Year"
    else:
        semester = calculated_sem
        semester_label = f"Semester {calculated_sem}"
        academic_year = (calculated_sem + 1) // 2
        suffix = {1: "1st", 2: "2nd", 3: "3rd", 4: "4th"}.get(academic_year, f"{academic_year}th")
        academic_year_label = f"{suffix} Year"

    return {
        "semester": semester,
        "academic_year": academic_year,
        "academic_year_label": academic_year_label,
        "is_graduated": is_graduated,
        "admission_year": resolved_year,
        "expected_graduation_year": expected_graduation_year,
        "semester_label": semester_label,
    }
