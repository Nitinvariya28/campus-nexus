from django.contrib import admin
from .models import InterviewExperience, InterviewRound

@admin.register(InterviewExperience)
class InterviewExperienceAdmin(admin.ModelAdmin):
    list_display = ("id", "author", "company", "experience_type", "result", "created_at")
    list_filter = ("experience_type", "result", "difficulty", "company")
    search_fields = ("author__email", "company__name")
    ordering = ("-created_at",)

@admin.register(InterviewRound)
class InterviewRoundAdmin(admin.ModelAdmin):
    list_display = ("id", "interview_experience", "round_number", "round_type", "mode")
    list_filter = ("round_type", "mode")
    search_fields = ("interview_experience__company__name",)
    ordering = ("-id",)
