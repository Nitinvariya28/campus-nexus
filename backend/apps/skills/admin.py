from django.contrib import admin
from .models import SkillCategory, Skill, UserSkill, SocialLink, UserAIUsage, UserLearningResource

@admin.register(SkillCategory)
class SkillCategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name",)
    ordering = ("name",)

@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "category", "is_active")
    list_filter = ("category", "is_active")
    search_fields = ("name", "category__name")
    ordering = ("name",)

@admin.register(UserSkill)
class UserSkillAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "skill", "proficiency")
    list_filter = ("proficiency", "skill")
    search_fields = ("user__email", "skill__name")
    ordering = ("-id",)

@admin.register(SocialLink)
class SocialLinkAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "platform", "url")
    list_filter = ("platform",)
    search_fields = ("user__email",)

@admin.register(UserAIUsage)
class UserAIUsageAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "ai_tool", "usage_frequency", "usage_purpose")
    list_filter = ("ai_tool", "usage_frequency", "usage_purpose")
    search_fields = ("user__email",)

@admin.register(UserLearningResource)
class UserLearningResourceAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "resource_type", "name", "url")
    list_filter = ("resource_type",)
    search_fields = ("user__email", "name")
