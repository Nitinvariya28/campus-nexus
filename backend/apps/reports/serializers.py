from rest_framework import serializers
from .models import Report
from apps.community.models import Post, Comment

class UserSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    email = serializers.EmailField()
    role = serializers.CharField()
    name = serializers.SerializerMethodField()

    def get_name(self, obj):
        if hasattr(obj, 'first_name') and hasattr(obj, 'last_name'):
            full = f"{obj.first_name} {obj.last_name}".strip()
            return full if full else obj.email
        return str(obj)

class CreateReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ['target_type', 'target_id', 'reason', 'description']

    def validate(self, attrs):
        target_type = attrs.get('target_type')
        target_id = attrs.get('target_id')
        user = self.context['request'].user

        # 1. Validate Target Entity Exists
        if target_type == 'POST':
            if not Post.objects.filter(id=target_id).exists():
                raise serializers.ValidationError({"target_id": "Post with this ID does not exist."})
        elif target_type == 'COMMENT':
            if not Comment.objects.filter(id=target_id).exists():
                raise serializers.ValidationError({"target_id": "Comment with this ID does not exist."})
        else:
            raise serializers.ValidationError({"target_type": "Invalid target type. Must be POST or COMMENT."})

        # 2. Prevent Duplicate Active Reports
        existing_report = Report.objects.filter(
            reported_by=user,
            target_type=target_type,
            target_id=target_id,
            status__in=['PENDING', 'UNDER_REVIEW']
        ).first()

        if existing_report:
            raise serializers.ValidationError("You have already submitted a pending report for this item.")

        return attrs

class ReportDetailSerializer(serializers.ModelSerializer):
    reported_by = UserSummarySerializer(read_only=True)
    reviewed_by = UserSummarySerializer(read_only=True)
    target_preview = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = [
            'id',
            'reported_by',
            'target_type',
            'target_id',
            'target_preview',
            'reason',
            'description',
            'status',
            'reviewed_by',
            'reviewed_at',
            'created_at',
            'updated_at',
        ]

    def get_target_preview(self, obj):
        if obj.target_type == 'POST':
            post = Post.objects.filter(id=obj.target_id).select_related('author').first()
            if post:
                return {
                    'is_deleted': False,
                    'title': post.title,
                    'content_snippet': post.content[:150] + ('...' if len(post.content) > 150 else ''),
                    'author_email': post.author.email
                }
            return {'is_deleted': True}
        elif obj.target_type == 'COMMENT':
            comment = Comment.objects.filter(id=obj.target_id).select_related('author').first()
            if comment:
                return {
                    'is_deleted': False,
                    'content_snippet': comment.content[:150] + ('...' if len(comment.content) > 150 else ''),
                    'author_email': comment.author.email,
                    'post_id': comment.post_id
                }
            return {'is_deleted': True}
        return None

class ResolveReportSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=['UNDER_REVIEW', 'RESOLVED', 'REJECTED'])
    action_taken = serializers.ChoiceField(
        choices=['NONE', 'DELETE_TARGET'],
        required=False,
        default='NONE'
    )
    admin_notes = serializers.CharField(required=False, allow_blank=True, default='')
