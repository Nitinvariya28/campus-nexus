from rest_framework import serializers
from .models import Announcement

class AnnouncementCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = [
            'title', 'content', 'announcement_type', 'target_audience',
            'deadline', 'is_published'
        ]
