from django.contrib import admin
from .models import Department, Batch, UniversityIdentity

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "code", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name", "code")
    ordering = ("name",)

@admin.register(Batch)
class BatchAdmin(admin.ModelAdmin):
    list_display = ("id", "start_year", "end_year", "is_active")
    list_filter = ("is_active",)
    ordering = ("-id",)

@admin.register(UniversityIdentity)
class UniversityIdentityAdmin(admin.ModelAdmin):
    list_display = ("id", "full_name", "university_email", "program_code")
    list_filter = ("program_code", "admission_year")
    search_fields = ("full_name", "university_email")
