from django.contrib import admin
from .models import StudentProfile, AlumniProfile

@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "department", "semester")
    list_filter = ("department", "batch", "semester")
    search_fields = ("user__email", "student_id")
    ordering = ("-id",)

@admin.register(AlumniProfile)
class AlumniProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "department", "current_company")
    list_filter = ("department", "batch")
    search_fields = ("user__email", "current_company__name")
    ordering = ("-id",)
