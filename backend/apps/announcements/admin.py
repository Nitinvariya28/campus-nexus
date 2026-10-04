from django.contrib import admin
from .models import Announcement

@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "announcement_type", "target_audience", "is_published", "created_at")
    list_filter = ("announcement_type", "target_audience", "is_published", "created_at")
    search_fields = ("title", "content")
    ordering = ("-created_at",)
