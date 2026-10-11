import os
from rest_framework import serializers
from .models import Resume

class ResumeSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Resume
        fields = [
            'id',
            'title',
            'file',
            'file_url',
            'file_type',
            'is_primary',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'file', 'file_url', 'file_type', 'created_at', 'updated_at']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if not obj.file:
            return None
        # Format /media/ URL
        url_path = f"/media/{obj.file}" if not obj.file.startswith('/media/') else obj.file
        if request:
            return request.build_absolute_uri(url_path)
        return url_path

class UploadResumeSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=150, required=False, allow_blank=True)
    file = serializers.FileField(required=True)
    is_primary = serializers.BooleanField(required=False, default=False)

    def validate_file(self, value):
        # 1. Validate File Extension
        ext = os.path.splitext(value.name)[1].lower()
        if ext not in ['.pdf', '.docx']:
            raise serializers.ValidationError("Only PDF and DOCX files are allowed.")

        # 2. Validate File Size (Max 5 MB)
        max_size = 5 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError("File size must not exceed 5 MB.")

        return value
