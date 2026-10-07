from django.conf import settings
from django.db import models

class Opportunity(models.Model):
    OPPORTUNITY_TYPE_CHOICES = [
        ("INTERNSHIP", "Internship"), ("PLACEMENT", "Placement"),
    ]
    WORK_MODE_CHOICES = [
        ("ON_SITE", "On Site"), ("REMOTE", "Remote"), ("HYBRID", "Hybrid"),
    ]
    EMPLOYMENT_TYPE_CHOICES = [
        ("FULL_TIME", "Full Time"), ("PART_TIME", "Part Time"),
        ("CONTRACT", "Contract"), ("INTERNSHIP", "Internship"),
    ]
    STATUS_CHOICES = [
        ("OPEN", "Open"), ("CLOSED", "Closed"),
        ("DRAFT", "Draft"), ("EXPIRED", "Expired"),
    ]
    company = models.ForeignKey("companies.Company", on_delete=models.PROTECT, related_name="opportunities")
    role = models.ForeignKey("companies.CompanyRole", on_delete=models.SET_NULL, null=True, blank=True, related_name="opportunities")
    posted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="opportunities")
    opportunity_type = models.CharField(max_length=20, choices=OPPORTUNITY_TYPE_CHOICES)
    title = models.CharField(max_length=250)
    description = models.TextField()
    location = models.CharField(max_length=200, blank=True, null=True)
    work_mode = models.CharField(max_length=20, choices=WORK_MODE_CHOICES)
    employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_TYPE_CHOICES, blank=True, null=True)
    
    # Placement Cell Specifics
    salary_package = models.CharField(max_length=100, blank=True, null=True)
    min_cgpa = models.DecimalField(max_digits=4, decimal_places=2, blank=True, null=True)
    eligible_departments = models.ManyToManyField("university.Department", related_name="eligible_opportunities", blank=True)
    eligible_batches = models.ManyToManyField("university.Batch", related_name="eligible_opportunities", blank=True)
    
    application_url = models.CharField(max_length=500, blank=True, null=True)
    deadline = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="DRAFT")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class OpportunitySkill(models.Model):
    IMPORTANCE_CHOICES = [
        ("REQUIRED", "Required"), ("PREFERRED", "Preferred"),
    ]
    opportunity = models.ForeignKey(Opportunity, on_delete=models.CASCADE, related_name="opportunity_skills")
    skill = models.ForeignKey("skills.Skill", on_delete=models.PROTECT, related_name="opportunity_skills")
    importance = models.CharField(max_length=20, choices=IMPORTANCE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["opportunity", "skill"], name="unique_opportunity_skill")]

    def __str__(self):
        return f"{self.opportunity.title} - {self.skill.name}"
