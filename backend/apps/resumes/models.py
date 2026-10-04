from django.conf import settings
from django.db import models

class Resume(models.Model):
    FILE_TYPE_CHOICES = [("PDF", "PDF"), ("DOCX", "DOCX")]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="resumes")
    title = models.CharField(max_length=150)
    file = models.CharField(max_length=500)
    file_type = models.CharField(max_length=10, choices=FILE_TYPE_CHOICES)
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email} - {self.title}"

class ResumeAnalysis(models.Model):
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name="analyses")
    analysis_version = models.CharField(max_length=50)
    extracted_text = models.TextField(blank=True, null=True)
    extracted_skills = models.JSONField(blank=True, null=True)
    experience_summary = models.TextField(blank=True, null=True)
    education_summary = models.TextField(blank=True, null=True)
    strengths = models.JSONField(blank=True, null=True)
    missing_skills = models.JSONField(blank=True, null=True)
    suggestions = models.JSONField(blank=True, null=True)
    score = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=(models.Q(score__isnull=True) | (models.Q(score__gte=0) & models.Q(score__lte=100))),
                name="resume_analysis_score_0_to_100"
            ),
        ]

    def __str__(self):
        return f"Analysis - {self.resume.title}"
