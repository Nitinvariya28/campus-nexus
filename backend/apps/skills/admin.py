from django.contrib import admin
from .models import SkillCategory, Skill, UserSkill, SocialLink, UserAIUsage, MasterLearningPlatform, UserLearningResource

@admin.register(SkillCategory)
class SkillCategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "category_type", "is_active")
    list_filter = ("category_type", "is_active")
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

@admin.register(MasterLearningPlatform)
class MasterLearningPlatformAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "platform_type", "is_active")
    list_filter = ("platform_type", "is_active")
    search_fields = ("name",)
    ordering = ("name",)

@admin.register(UserLearningResource)
class UserLearningResourceAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "platform", "other_platform_name")
    list_filter = ("platform__platform_type",)
    search_fields = ("user__email", "platform__name", "other_platform_name")
