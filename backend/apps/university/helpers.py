import re
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
