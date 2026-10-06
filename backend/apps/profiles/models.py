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
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="alumni_profile")
    department = models.ForeignKey("university.Department", on_delete=models.PROTECT, related_name="alumni_profiles", default=1)
    batch = models.ForeignKey("university.Batch", on_delete=models.PROTECT, related_name="alumni_profiles", default=1)
    current_job_title = models.CharField(max_length=150, blank=True, null=True)
    current_company = models.ForeignKey("companies.Company", on_delete=models.SET_NULL, null=True, blank=True, related_name="alumni_profiles")
    bio = models.TextField(blank=True, null=True)
    phone = models.CharField(max_length=15, blank=True, null=True)
    location = models.CharField(max_length=150, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email} Profile"
