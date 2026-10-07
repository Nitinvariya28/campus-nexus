from rest_framework import serializers
from .models import Post, PostMedia, PostLike, Comment
from apps.opportunities.models import Opportunity
from apps.announcements.models import Announcement
from apps.accounts.models import User

class FeedAuthorSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    meta = serializers.SerializerMethodField()
    is_verified_official = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'name', 'role', 'meta', 'is_verified_official']

    def get_name(self, obj):
        if obj.role in ['PLACEMENT_CELL', 'ADMIN']:
            return "Official Placement Cell" if obj.role == 'PLACEMENT_CELL' else "University Admin"
        return f"{obj.first_name} {obj.last_name}"
        
    def get_is_verified_official(self, obj):
        return obj.role in ['PLACEMENT_CELL', 'ADMIN']
        
    def get_meta(self, obj):
        if obj.role == 'ALUMNI' and hasattr(obj, 'alumni_profile'):
            profile = obj.alumni_profile
            company_name = profile.current_company.name if profile.current_company else "Nirma Alumni"
            return f"{company_name}"
        elif obj.role == 'STUDENT' and hasattr(obj, 'student_profile'):
            profile = obj.student_profile
            dept = profile.department.name if profile.department else ""
            batch = profile.batch.start_year if profile.batch else ""
            return f"{dept} ({batch} Batch)"
        return None

class PostMediaSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = PostMedia
        fields = ['id', 'url', 'media_type']

    def get_url(self, obj):
        request = self.context.get('request')
        # Since file is a CharField, we format the absolute URL manually
        path = f"/media/{obj.file}"
        if request:
            return request.build_absolute_uri(path)
        return path

class PostFeedSerializer(serializers.ModelSerializer):
    feed_type = serializers.CharField(default="POST", read_only=True)
    author = FeedAuthorSerializer()
    media = PostMediaSerializer(many=True)
    tags = serializers.SerializerMethodField()
    interactions = serializers.SerializerMethodField()
    company = serializers.CharField(source='company.name', read_only=True)

    class Meta:
        model = Post
        fields = ['feed_type', 'id', 'title', 'content', 'post_type', 'created_at', 'author', 'company', 'media', 'tags', 'interactions']
        
    def get_tags(self, obj):
        return [pt.tag.name for pt in obj.post_tags.all()]
        
    def get_interactions(self, obj):
        request = self.context.get('request')
        user_id = request.user.id if request and request.user.is_authenticated else None
        
        likes_list = obj.likes.all()
        return {
            "likes_count": len(likes_list),
            "comments_count": len(obj.comments.all()),
            "is_liked_by_me": any(like.user_id == user_id for like in likes_list)
        }

class OpportunityFeedSerializer(serializers.ModelSerializer):
    feed_type = serializers.CharField(default="OPPORTUNITY", read_only=True)
    author = FeedAuthorSerializer(source='posted_by')
    skills = serializers.SerializerMethodField()
    company = serializers.CharField(source='company.name', read_only=True)
    
    class Meta:
        model = Opportunity
        fields = ['feed_type', 'id', 'title', 'description', 'opportunity_type', 'work_mode', 'employment_type', 'application_url', 'deadline', 'created_at', 'author', 'company', 'skills']

    def get_skills(self, obj):
        # We can safely use obj.opportunity_skills.all() if we prefetch it in the view
        return [os.skill.name for os in obj.opportunity_skills.all()]

class AnnouncementFeedSerializer(serializers.ModelSerializer):
    feed_type = serializers.CharField(default="ANNOUNCEMENT", read_only=True)
    author = FeedAuthorSerializer(source='created_by')
    
    class Meta:
        model = Announcement
        fields = ['feed_type', 'id', 'title', 'content', 'announcement_type', 'target_audience', 'created_at', 'author']

class CreatePostSerializer(serializers.ModelSerializer):
    company_id = serializers.IntegerField(required=False, allow_null=True)
    new_company_name = serializers.CharField(required=False, allow_blank=True)
    tag_ids = serializers.ListField(child=serializers.IntegerField(), required=False, default=list)
    new_tags = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    media_files = serializers.ListField(
        child=serializers.DictField(child=serializers.CharField()),
        required=False, default=list
    ) # expects [{"media_type": "IMAGE", "file": "path/to/img.jpg"}]

    class Meta:
        model = Post
        fields = ['title', 'content', 'post_type', 'company_id', 'new_company_name', 'tag_ids', 'new_tags', 'media_files']


class CommentSerializer(serializers.ModelSerializer):
    author = FeedAuthorSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'author', 'content', 'created_at']

class PostDetailSerializer(serializers.ModelSerializer):
    author = FeedAuthorSerializer(read_only=True)
    media = PostMediaSerializer(many=True, read_only=True)
    tags = serializers.SerializerMethodField()
    interactions = serializers.SerializerMethodField()
    company = serializers.CharField(source='company.name', read_only=True)
    class Meta:
        model = Post
        fields = ['id', 'title', 'content', 'post_type', 'created_at', 'author', 'company', 'media', 'tags', 'interactions']
        
    def get_tags(self, obj):
        return [pt.tag.name for pt in obj.post_tags.all()]
        
    def get_interactions(self, obj):
        request = self.context.get('request')
        user_id = request.user.id if request and request.user.is_authenticated else None
        
        likes_list = obj.likes.all()
        return {
            "likes_count": len(likes_list),
            "comments_count": len(obj.comments.all()),
            "is_liked_by_me": any(like.user_id == user_id for like in likes_list)
        }

class CreateCommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ['content']

class UpdatePostSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255, required=False)
    content = serializers.CharField(required=False)
    tag_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False
    )
    new_tags = serializers.ListField(
        child=serializers.CharField(max_length=50), required=False
    )
    media_files = serializers.ListField(
        child=serializers.DictField(), required=False
    )
