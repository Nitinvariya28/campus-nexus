from django.conf import settings
from django.db import models

class SkillCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Skill(models.Model):
    category = models.ForeignKey(SkillCategory, on_delete=models.PROTECT, related_name="skills")
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["category", "name"], name="unique_skill_in_category")]

    def __str__(self):
        return self.name

class UserSkill(models.Model):
    PROFICIENCY_CHOICES = [
        ("BEGINNER", "Beginner"), ("INTERMEDIATE", "Intermediate"), ("ADVANCED", "Advanced"),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="user_skills")
    skill = models.ForeignKey(Skill, on_delete=models.PROTECT, related_name="user_skills")
    proficiency = models.CharField(max_length=20, choices=PROFICIENCY_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["user", "skill"], name="unique_user_skill")]

    def __str__(self):
        return f"{self.user.email} - {self.skill.name}"

class SocialLink(models.Model):
    PLATFORM_CHOICES = [
        ("LINKEDIN", "LinkedIn"), ("GITHUB", "GitHub"),
        ("PORTFOLIO", "Portfolio"), ("LEETCODE", "LeetCode"),
        ("KAGGLE", "Kaggle"), ("OTHER", "Other"),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="social_links")
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES)
    url = models.CharField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["user", "platform"], name="unique_user_social_platform")]

    def __str__(self):
        return f"{self.user.email} - {self.platform}"

class UserAIUsage(models.Model):
    AI_TOOL_CHOICES = [
        ("CHATGPT", "ChatGPT"), ("GEMINI", "Gemini"),
        ("CLAUDE", "Claude"), ("GITHUB_COPILOT", "GitHub Copilot"),
        ("CURSOR", "Cursor"), ("PERPLEXITY", "Perplexity"), ("OTHER", "Other"),
    ]
    FREQUENCY_CHOICES = [
        ("NEVER", "Never"), ("OCCASIONALLY", "Occasionally"),
        ("REGULARLY", "Regularly"), ("HEAVILY", "Heavily"),
    ]
    DAILY_USAGE_CHOICES = [
        ("LESS_THAN_30_MIN", "Less than 30 min"), ("30_TO_60_MIN", "30 to 60 min"),
        ("1_TO_2_HOURS", "1 to 2 hours"), ("2_TO_4_HOURS", "2 to 4 hours"),
        ("MORE_THAN_4_HOURS", "More than 4 hours"),
    ]
    PURPOSE_CHOICES = [
        ("CODING", "Coding"), ("DEBUGGING", "Debugging"),
        ("LEARNING", "Learning"), ("RESEARCH", "Research"),
        ("DOCUMENTATION", "Documentation"), ("DATA_ANALYSIS", "Data Analysis"),
        ("INTERVIEW_PREPARATION", "Interview Preparation"), ("PROJECT_DEVELOPMENT", "Project Development"),
        ("CONTENT_GENERATION", "Content Generation"), ("OTHER", "Other"),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="ai_usages")
    ai_tool = models.CharField(max_length=30, choices=AI_TOOL_CHOICES)
    usage_frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
    daily_time_range = models.CharField(max_length=30, choices=DAILY_USAGE_CHOICES)
    usage_purpose = models.CharField(max_length=30, choices=PURPOSE_CHOICES)
    other_tool_name = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email} - {self.ai_tool}"
