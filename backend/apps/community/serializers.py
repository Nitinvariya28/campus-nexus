from rest_framework import serializers
from .models import Post, PostMedia, PostLike, Comment
from apps.opportunities.models import Opportunity
from apps.announcements.models import Announcement
from apps.interviews.models import InterviewExperience, InterviewRound
from apps.accounts.models import User

class FeedAuthorSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    meta = serializers.SerializerMethodField()
    is_verified_official = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'name', 'role', 'meta', 'is_verified_official', 'avatar']

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
        file_val = str(obj.file) if obj.file else ""
        if not file_val:
            return ""
        if file_val.startswith('http://') or file_val.startswith('https://'):
            return file_val
        if file_val.startswith('/media/'):
            path = file_val
        else:
            path = f"/media/{file_val.lstrip('/')}"
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
    company_id = serializers.IntegerField(source='company.id', read_only=True, allow_null=True)

    class Meta:
        model = Post
        fields = ['feed_type', 'id', 'title', 'content', 'post_type', 'created_at', 'author', 'company', 'company_id', 'media', 'tags', 'interactions']
        
    def get_tags(self, obj):
        return [pt.tag.name for pt in obj.post_tags.all()]
        
    def get_interactions(self, obj):
        request = self.context.get('request')
        user_id = request.user.id if request and request.user.is_authenticated else None
        
        likes_list = obj.likes.all()
        return {
            "likes_count": len(likes_list),
            "comments_count": len(obj.comments.all()),
            "is_liked_by_me": any(like.user_id == user_id for like in likes_list),
            "is_bookmarked_by_me": obj.saved_by_users.filter(user_id=user_id).exists() if user_id else False,
        }

class OpportunityFeedSerializer(serializers.ModelSerializer):
    feed_type = serializers.CharField(default="OPPORTUNITY", read_only=True)
    author = FeedAuthorSerializer(source='posted_by')
    skills = serializers.SerializerMethodField()
    company = serializers.CharField(source='company.name', read_only=True)
    company_id = serializers.IntegerField(source='company.id', read_only=True, allow_null=True)
    role_id = serializers.IntegerField(source='role.id', read_only=True, allow_null=True)
    interactions = serializers.SerializerMethodField()
    
    class Meta:
        model = Opportunity
        fields = ['feed_type', 'id', 'title', 'description', 'opportunity_type', 'work_mode', 'employment_type', 'application_url', 'deadline', 'created_at', 'author', 'company', 'company_id', 'role_id', 'skills', 'interactions']

    def get_skills(self, obj):
        return [os.skill.name for os in obj.opportunity_skills.all()]

    def get_interactions(self, obj):
        request = self.context.get('request')
        user_id = request.user.id if request and request.user.is_authenticated else None
        post = Post.objects.filter(title=f"[Opportunity] {obj.title}").first()
        if post:
            likes_list = post.likes.all()
            return {
                "likes_count": len(likes_list),
                "comments_count": len(post.comments.all()),
                "is_liked_by_me": any(like.user_id == user_id for like in likes_list),
                "is_bookmarked_by_me": post.saved_by_users.filter(user_id=user_id).exists() if user_id else False,
            }
        return {
            "likes_count": 0,
            "comments_count": 0,
            "is_liked_by_me": False,
            "is_bookmarked_by_me": False,
        }

class AnnouncementFeedSerializer(serializers.ModelSerializer):
    feed_type = serializers.CharField(default="ANNOUNCEMENT", read_only=True)
    author = FeedAuthorSerializer(source='created_by')
    interactions = serializers.SerializerMethodField()
    
    class Meta:
        model = Announcement
        fields = ['feed_type', 'id', 'title', 'content', 'announcement_type', 'target_audience', 'created_at', 'author', 'interactions']

    def get_interactions(self, obj):
        request = self.context.get('request')
        user_id = request.user.id if request and request.user.is_authenticated else None
        post = Post.objects.filter(title=f"[Announcement] {obj.title}").first()
        if post:
            likes_list = post.likes.all()
            return {
                "likes_count": len(likes_list),
                "comments_count": len(post.comments.all()),
                "is_liked_by_me": any(like.user_id == user_id for like in likes_list),
                "is_bookmarked_by_me": post.saved_by_users.filter(user_id=user_id).exists() if user_id else False,
            }
        return {
            "likes_count": 0,
            "comments_count": 0,
            "is_liked_by_me": False,
            "is_bookmarked_by_me": False,
        }

class InterviewRoundDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewRound
        fields = [
            'id', 'round_number', 'round_type', 'mode', 'duration_minutes',
            'topics', 'description'
        ]

class InterviewExperienceFeedSerializer(serializers.ModelSerializer):
    feed_type = serializers.CharField(default="INTERVIEW_EXPERIENCE", read_only=True)
    author = FeedAuthorSerializer()
    company = serializers.CharField(source='company.name', read_only=True)
    company_id = serializers.IntegerField(source='company.id', read_only=True, allow_null=True)
    role_id = serializers.IntegerField(source='role.id', read_only=True, allow_null=True)
    role_title = serializers.CharField(source='role.role_name', read_only=True)
    rounds_count = serializers.SerializerMethodField()
    rounds = InterviewRoundDetailSerializer(many=True, read_only=True)
    interactions = serializers.SerializerMethodField()

    class Meta:
        model = InterviewExperience
        fields = [
            'feed_type', 'id', 'author', 'company', 'company_id', 'role_id', 'role_title', 'experience_type',
            'result', 'difficulty', 'experience', 'preparation', 'rounds_count', 'rounds', 'created_at', 'interactions'
        ]

    def get_rounds_count(self, obj):
        return obj.rounds.count()

    def get_interactions(self, obj):
        request = self.context.get('request')
        user_id = request.user.id if request and request.user.is_authenticated else None
        role_name = obj.role.role_name if obj.role else 'Process'
        post = Post.objects.filter(title=f"[Interview] {obj.company.name} - {role_name}").first()
        if post:
            likes_list = post.likes.all()
            return {
                "likes_count": len(likes_list),
                "comments_count": len(post.comments.all()),
                "is_liked_by_me": any(like.user_id == user_id for like in likes_list),
                "is_bookmarked_by_me": post.saved_by_users.filter(user_id=user_id).exists() if user_id else False,
            }
        return {
            "likes_count": 0,
            "comments_count": 0,
            "is_liked_by_me": False,
            "is_bookmarked_by_me": False,
        }

class OpportunityDetailSerializer(serializers.ModelSerializer):
    feed_type = serializers.CharField(default="OPPORTUNITY", read_only=True)
    author = FeedAuthorSerializer(source='posted_by', read_only=True)
    company = serializers.CharField(source='company.name', read_only=True)
    role_title = serializers.CharField(source='role.role_name', read_only=True)
    skills = serializers.SerializerMethodField()
    eligible_departments = serializers.StringRelatedField(many=True, read_only=True)
    eligible_batches = serializers.StringRelatedField(many=True, read_only=True)

    class Meta:
        model = Opportunity
        fields = [
            'feed_type', 'id', 'title', 'description', 'opportunity_type', 'location', 'work_mode',
            'employment_type', 'salary_package', 'min_cgpa', 'application_url', 'deadline',
            'status', 'created_at', 'author', 'company', 'role_title', 'skills',
            'eligible_departments', 'eligible_batches'
        ]

    def get_skills(self, obj):
        return [{'name': os.skill.name, 'importance': os.importance} for os in obj.opportunity_skills.all()]

class AnnouncementDetailSerializer(serializers.ModelSerializer):
    feed_type = serializers.CharField(default="ANNOUNCEMENT", read_only=True)
    author = FeedAuthorSerializer(source='created_by', read_only=True)

    class Meta:
        model = Announcement
        fields = [
            'feed_type', 'id', 'title', 'content', 'announcement_type', 'target_audience',
            'deadline', 'is_published', 'published_at', 'created_at', 'author'
        ]


class InterviewExperienceDetailSerializer(serializers.ModelSerializer):
    feed_type = serializers.CharField(default="INTERVIEW_EXPERIENCE", read_only=True)
    author = FeedAuthorSerializer(read_only=True)
    company = serializers.CharField(source='company.name', read_only=True)
    role_title = serializers.CharField(source='role.role_name', read_only=True)
    rounds = InterviewRoundDetailSerializer(many=True, read_only=True)

    class Meta:
        model = InterviewExperience
        fields = [
            'feed_type', 'id', 'author', 'company', 'role_title', 'experience_type',
            'result', 'difficulty', 'experience', 'preparation', 'rounds', 'created_at'
        ]

class StandardPostSerializer(serializers.ModelSerializer):
    company_id = serializers.IntegerField(required=False, allow_null=True)
    new_company_name = serializers.CharField(required=False, allow_blank=True)
    tag_ids = serializers.ListField(child=serializers.IntegerField(), required=False, default=list)
    new_tags = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    media_files = serializers.ListField(
        child=serializers.DictField(child=serializers.CharField()),
        required=False, default=list
    )

    class Meta:
        model = Post
        fields = ['title', 'content', 'post_type', 'company_id', 'new_company_name', 'tag_ids', 'new_tags', 'media_files']

    def create(self, validated_data):
        tag_ids = validated_data.pop('tag_ids', [])
        new_tags = validated_data.pop('new_tags', [])
        media_files = validated_data.pop('media_files', [])
        company_id = validated_data.pop('company_id', None)
        new_company_name = validated_data.pop('new_company_name', None)
        
        from apps.companies.models import Company
        if new_company_name:
            company, _ = Company.objects.get_or_create(name=new_company_name, defaults={"is_active": False})
            validated_data['company'] = company
        elif company_id:
            validated_data['company_id'] = company_id
            
        post = Post.objects.create(**validated_data)
        
        from .models import Tag, PostTag, PostMedia
        final_tags = list(Tag.objects.filter(id__in=tag_ids))
        for tag_name in new_tags:
            tag_obj, _ = Tag.objects.get_or_create(name=tag_name)
            final_tags.append(tag_obj)
            
        if final_tags:
            PostTag.objects.bulk_create([PostTag(post=post, tag=tag) for tag in final_tags], ignore_conflicts=True)
            
        if media_files:
            PostMedia.objects.bulk_create([
                PostMedia(post=post, media_type=m.get('media_type', 'IMAGE'), file=m.get('file')) for m in media_files
            ])
            
        return post


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
            "is_liked_by_me": any(like.user_id == user_id for like in likes_list),
            "is_bookmarked_by_me": obj.saved_by_users.filter(user_id=user_id).exists() if user_id else False,
        }

class CreateCommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ['content']

class UpdatePostSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255, required=False)
    content = serializers.CharField(required=False)
    post_type = serializers.CharField(max_length=50, required=False)
    company_id = serializers.IntegerField(required=False, allow_null=True)
    new_company_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    tag_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False
    )
    new_tags = serializers.ListField(
        child=serializers.CharField(max_length=50), required=False
    )
    media_files = serializers.ListField(
        child=serializers.DictField(), required=False
    )
