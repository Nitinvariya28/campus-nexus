from django.conf import settings
from django.db import models

class StudentProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="student_profile")
    department = models.ForeignKey("university.Department", on_delete=models.PROTECT, related_name="student_profiles", default=1)
    batch = models.ForeignKey("university.Batch", on_delete=models.PROTECT, related_name="student_profiles", default=1)
    semester = models.PositiveSmallIntegerField(null=True, blank=True)
    bio = models.TextField(blank=True, null=True)
    phone = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.CheckConstraint(condition=(models.Q(semester__gte=1) & models.Q(semester__lte=8)), name="student_semester_1_to_8"),
        ]

    def __str__(self):
        return f"{self.user.email} Profile"

class AlumniProfile(models.Model):
    JOB_CATEGORY_CHOICES = [
        ("SOFTWARE", "Software & Engineering"),
        ("DATA_SCIENCE", "Data Science & AI"),
        ("PRODUCT_MANAGEMENT", "Product Management"),
        ("DESIGN", "Design & UI/UX"),
        ("DEVOPS_CLOUD", "DevOps & Cloud"),
        ("SECURITY", "Cyber Security"),
        ("BUSINESS_SALES", "Business & Sales"),
        ("OTHER", "Other"),
    ]
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="alumni_profile")
    department = models.ForeignKey("university.Department", on_delete=models.PROTECT, related_name="alumni_profiles", default=1)
    batch = models.ForeignKey("university.Batch", on_delete=models.PROTECT, related_name="alumni_profiles", default=1)
    
    # Career Details
    current_job_title = models.CharField(max_length=150, blank=True, null=True)
    job_category = models.CharField(max_length=50, choices=JOB_CATEGORY_CHOICES, db_index=True, null=True, blank=True)
    current_company = models.ForeignKey("companies.Company", on_delete=models.SET_NULL, null=True, blank=True, related_name="alumni_profiles")
    years_of_experience = models.PositiveSmallIntegerField(default=0)
    
    bio = models.TextField(blank=True, null=True)
    phone = models.CharField(max_length=15, blank=True, null=True)
    location = models.CharField(max_length=150, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email} Profile"

class StudentPlacementRecord(models.Model):
    OFFER_TYPE_CHOICES = [
        ("INTERNSHIP", "Internship"),
        ("FULL_TIME_PLACEMENT", "Full Time Placement"),
    ]
    HIRING_MODE_CHOICES = [
        ("ON_CAMPUS", "On-Campus Drive"),
        ("OFF_CAMPUS", "Off-Campus Drive"),
        ("POOL_CAMPUS", "Pool Campus Drive"),
        ("PPO", "Pre-Placement Offer (PPO)"),
        ("HACKATHON", "Hackathon / Competition"),
        ("REFERRAL", "Employee Referral"),
        ("LATERAL", "Lateral Hiring"),
        ("DIRECT_APPLICATION", "Direct Application"),
        ("OTHER", "Other"),
    ]
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name="placements")
    company = models.ForeignKey("companies.Company", on_delete=models.PROTECT, related_name="hired_students", db_index=True)
    opportunity = models.ForeignKey("opportunities.Opportunity", on_delete=models.SET_NULL, null=True, blank=True, related_name="successful_placements")
    
    # Career Details
    job_category = models.CharField(max_length=50, choices=AlumniProfile.JOB_CATEGORY_CHOICES, db_index=True, null=True, blank=True)
    job_title = models.CharField(max_length=150, blank=True, null=True)
    
    offer_type = models.CharField(max_length=30, choices=OFFER_TYPE_CHOICES, db_index=True)
    hiring_mode = models.CharField(max_length=50, choices=HIRING_MODE_CHOICES, null=True, blank=True, db_index=True)
    package_lpa = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    placement_year = models.PositiveSmallIntegerField(db_index=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["student", "company", "placement_year"], name="unique_student_placement")
        ]

    def __str__(self):
        return f"{self.student.user.email} - {self.company.name} ({self.placement_year})"
