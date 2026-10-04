from django.contrib import admin
from .models import Resume, ResumeAnalysis

@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "title", "file_type", "is_primary", "created_at")
    list_filter = ("file_type", "is_primary")
    search_fields = ("user__email", "title")
    ordering = ("-created_at",)

@admin.register(ResumeAnalysis)
class ResumeAnalysisAdmin(admin.ModelAdmin):
    list_display = ("id", "resume", "analysis_version", "score", "created_at")
    list_filter = ("analysis_version",)
    search_fields = ("resume__user__email",)
    ordering = ("-created_at",)
