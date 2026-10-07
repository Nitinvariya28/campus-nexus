from django.contrib import admin
from .models import StudentProfile, AlumniProfile, StudentPlacementRecord

@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "department", "semester")
    list_filter = ("department", "batch", "semester")
    search_fields = ("user__email",)
    ordering = ("-id",)

@admin.register(AlumniProfile)
class AlumniProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "department", "job_category", "current_company", "years_of_experience")
    list_filter = ("department", "batch", "job_category")
    search_fields = ("user__email", "current_company__name")
    ordering = ("-id",)

@admin.register(StudentPlacementRecord)
class StudentPlacementRecordAdmin(admin.ModelAdmin):
    list_display = ("id", "student", "company", "offer_type", "hiring_mode", "placement_year", "package_lpa")
    list_filter = ("offer_type", "hiring_mode", "placement_year", "company")
    search_fields = ("student__user__email", "company__name")
    ordering = ("-placement_year", "-id")
