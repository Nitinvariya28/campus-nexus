from django.contrib import admin
from .models import Opportunity, OpportunitySkill

@admin.register(Opportunity)
class OpportunityAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "company", "opportunity_type", "status", "created_at")
    list_filter = ("opportunity_type", "status", "work_mode")
    search_fields = ("title", "company__name")
    ordering = ("-created_at",)

@admin.register(OpportunitySkill)
class OpportunitySkillAdmin(admin.ModelAdmin):
    list_display = ("id", "opportunity", "skill", "importance")
    list_filter = ("importance",)
    search_fields = ("opportunity__title", "skill__name")
    ordering = ("-id",)
