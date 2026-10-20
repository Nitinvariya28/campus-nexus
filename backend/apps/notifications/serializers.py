from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Notification

User = get_user_model()

class NotificationActorSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    is_verified_official = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'role', 'is_verified_official', 'avatar']

    def get_name(self, obj):
        if obj.role in ['PLACEMENT_CELL', 'ADMIN']:
            return "Official Placement Cell" if obj.role == 'PLACEMENT_CELL' else "University Admin"
        full = f"{obj.first_name} {obj.last_name}".strip()
        return full if full else obj.email.split('@')[0]

    def get_avatar(self, obj):
        if not obj.profile_photo:
            return None
        val = str(obj.profile_photo)
        if val.startswith('http://') or val.startswith('https://'):
            return val
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(val)
        return val

    def get_is_verified_official(self, obj):
        return obj.role in ['PLACEMENT_CELL', 'ADMIN']


class NotificationSerializer(serializers.ModelSerializer):
    actor = NotificationActorSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id',
            'actor',
            'notification_type',
            'title',
            'message',
            'reference_type',
            'reference_id',
            'is_read',
            'read_at',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'actor',
            'notification_type',
            'title',
            'message',
            'reference_type',
            'reference_id',
            'is_read',
            'read_at',
            'created_at',
        ]
