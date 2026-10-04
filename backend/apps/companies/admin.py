from django.contrib import admin
from .models import Company, CompanyRole

@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "industry", "company_size", "is_active")
    list_filter = ("company_size", "is_active", "industry")
    search_fields = ("name", "industry")
    ordering = ("name",)

@admin.register(CompanyRole)
class CompanyRoleAdmin(admin.ModelAdmin):
    list_display = ("id", "company", "role_name", "role_category")
    list_filter = ("role_category", "company")
    search_fields = ("role_name", "company__name")
    ordering = ("role_name",)
