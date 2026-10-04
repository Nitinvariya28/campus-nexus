from django.contrib import admin
from .models import Report

@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ("id", "reported_by", "target_type", "reason", "status", "created_at")
    list_filter = ("status", "target_type", "reason")
    search_fields = ("reported_by__email",)
    ordering = ("-created_at",)
