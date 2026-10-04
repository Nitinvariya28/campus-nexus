from django.conf import settings
from django.db import models

class InterviewExperience(models.Model):
    EXPERIENCE_TYPE_CHOICES = [
        ("PLACEMENT", "Placement"), ("INTERNSHIP", "Internship"), ("OTHER", "Other"),
    ]
    RESULT_CHOICES = [
        ("SELECTED", "Selected"), ("NOT_SELECTED", "Not Selected"),
        ("IN_PROGRESS", "In Progress"), ("NOT_DISCLOSED", "Not Disclosed"),
    ]
    DIFFICULTY_CHOICES = [
        ("EASY", "Easy"), ("MEDIUM", "Medium"),
        ("HARD", "Hard"), ("VERY_HARD", "Very Hard"),
        ("NOT_SPECIFIED", "Not Specified"),
    ]
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="interview_experiences")
    company = models.ForeignKey("companies.Company", on_delete=models.PROTECT, related_name="interview_experiences")
    role = models.ForeignKey("companies.CompanyRole", on_delete=models.SET_NULL, null=True, blank=True, related_name="interview_experiences")
    experience_type = models.CharField(max_length=20, choices=EXPERIENCE_TYPE_CHOICES)
    result = models.CharField(max_length=20, choices=RESULT_CHOICES)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, blank=True, null=True)
    experience = models.TextField()
    preparation = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.company.name} Interview"

class InterviewRound(models.Model):
    ROUND_TYPE_CHOICES = [
        ("ONLINE_ASSESSMENT", "Online Assessment"), ("TECHNICAL", "Technical"),
        ("CODING", "Coding"), ("SYSTEM_DESIGN", "System Design"),
        ("MANAGERIAL", "Managerial"), ("HR", "HR"),
        ("GROUP_DISCUSSION", "Group Discussion"), ("OTHER", "Other"),
    ]
    MODE_CHOICES = [
        ("ONLINE", "Online"), ("OFFLINE", "Offline"),
        ("HYBRID", "Hybrid"), ("NOT_SPECIFIED", "Not Specified"),
    ]
    interview_experience = models.ForeignKey(InterviewExperience, on_delete=models.CASCADE, related_name="rounds")
    round_number = models.PositiveSmallIntegerField()
    round_type = models.CharField(max_length=30, choices=ROUND_TYPE_CHOICES)
    mode = models.CharField(max_length=20, choices=MODE_CHOICES, blank=True, null=True)
    duration_minutes = models.PositiveSmallIntegerField(blank=True, null=True)
    topics = models.TextField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.CheckConstraint(condition=models.Q(round_number__gt=0), name="interview_round_number_positive"),
            models.UniqueConstraint(fields=["interview_experience", "round_number"], name="unique_interview_round_number"),
        ]

    def __str__(self):
        return f"Round {self.round_number} - {self.interview_experience.company.name}"
