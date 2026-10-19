from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import StudentProfile, AlumniProfile, StudentPlacementRecord
from apps.skills.models import SocialLink, UserSkill, UserLearningResource, UserAIUsage
from apps.resumes.models import Resume
from apps.community.models import Post
from apps.interviews.models import InterviewExperience, InterviewRound

User = get_user_model()

class SocialLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocialLink
        fields = ['platform', 'url']

class StudentExperienceSerializer(serializers.ModelSerializer):
    company = serializers.CharField(source='company.name', read_only=True)
    
    class Meta:
        model = StudentPlacementRecord
        fields = ['offer_type', 'company', 'job_category', 'hiring_mode', 'package_lpa', 'placement_year']

class ResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = ['id', 'title', 'file', 'file_type', 'is_primary', 'created_at']

class SkillSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='skill.name', read_only=True)
    category = serializers.CharField(source='skill.category.category_type', read_only=True)
    
    class Meta:
        model = UserSkill
        fields = ['name', 'category', 'proficiency']

class LearningPlatformSerializer(serializers.ModelSerializer):
    platform_name = serializers.CharField(source='platform.name', read_only=True)
    
    class Meta:
        model = UserLearningResource
        fields = ['platform_name', 'other_platform_name']

class AIUsageSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAIUsage
        fields = ['ai_tool', 'usage_purpose', 'usage_frequency', 'daily_time_range']

class RecentPostSerializer(serializers.ModelSerializer):
    likes = serializers.IntegerField(source='likes.count', read_only=True)
    
    class Meta:
        model = Post
        fields = ['id', 'title', 'created_at', 'likes']

# The Master Aggregator Serializer for Student
class StudentProfileMasterSerializer(serializers.Serializer):
    role = serializers.CharField()
    identity = serializers.SerializerMethodField()
    social_links = serializers.SerializerMethodField()
    experience = serializers.SerializerMethodField()
    resumes = serializers.SerializerMethodField()
    analytics_data = serializers.SerializerMethodField()
    activity = serializers.SerializerMethodField()

    def get_identity(self, obj):
        user = obj['user']
        student_profile = obj['student_profile']
        
        # AbstractUser provides get_full_name() which combines first_name and last_name
        full_name = user.get_full_name()
        
        return {
            "user_id": user.id,
            "full_name": full_name if full_name else user.email.split("@")[0],
            "email": user.email,
            "avatar_url": user.profile_photo,
            "bio": student_profile.bio,
            "department": student_profile.department.name if student_profile.department else None,
            "batch": str(student_profile.batch) if student_profile.batch else None,
            "semester": student_profile.semester
        }

    def get_social_links(self, obj):
        links = SocialLink.objects.filter(user=obj['user'])
        return SocialLinkSerializer(links, many=True).data

    def get_experience(self, obj):
        placements = StudentPlacementRecord.objects.filter(student=obj['student_profile']).order_by('-placement_year')
        return StudentExperienceSerializer(placements, many=True).data

    def get_resumes(self, obj):
        resumes = Resume.objects.filter(user=obj['user']).order_by('-is_primary', '-created_at')
        return ResumeSerializer(resumes, many=True).data

    def get_analytics_data(self, obj):
        user = obj['user']
        skills = UserSkill.objects.filter(user=user).select_related('skill', 'skill__category')
        platforms = UserLearningResource.objects.filter(user=user).select_related('platform')
        ai_usage = UserAIUsage.objects.filter(user=user)
        
        return {
            "skills": SkillSerializer(skills, many=True).data,
            "learning_platforms": LearningPlatformSerializer(platforms, many=True).data,
            "ai_usage": AIUsageSerializer(ai_usage, many=True).data
        }

    def get_activity(self, obj):
        posts = Post.objects.filter(author=obj['user']).order_by('-created_at')
        return {
            "recent_posts_count": posts.count(),
            "recent_posts": RecentPostSerializer(posts[:5], many=True).data # Top 5 recent posts
        }

class AlumniProfileMasterSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(source='user.id')
    email = serializers.EmailField(source='user.email')
    full_name = serializers.SerializerMethodField()
    profile_photo = serializers.URLField(source='user.profile_photo')
    is_verified = serializers.BooleanField(source='user.is_verified')
    identity = serializers.SerializerMethodField()
    current_career = serializers.SerializerMethodField()
    skills = serializers.SerializerMethodField()
    social_links = serializers.SerializerMethodField()
    ai_usage = serializers.SerializerMethodField()
    stats = serializers.SerializerMethodField()
    interview_experiences = serializers.SerializerMethodField()

    def get_full_name(self, obj):
        user = obj['user']
        full_name = user.get_full_name()
        return full_name if full_name else user.email.split('@')[0]

    def get_identity(self, obj):
        alumni = obj['alumni_profile']
        return {
            "bio": alumni.bio,
            "department": {"id": alumni.department.id, "name": alumni.department.name} if alumni.department else None,
            "batch": {"id": alumni.batch.id, "name": str(alumni.batch)} if alumni.batch else None,
            "phone": alumni.phone,
            "location": alumni.location
        }

    def get_current_career(self, obj):
        alumni = obj['alumni_profile']
        company_data = None
        if alumni.current_company:
            company_data = {
                "id": alumni.current_company.id,
                "name": alumni.current_company.name,
                "tier": alumni.current_company.company_tier
            }
        return {
            "company": company_data,
            "role": alumni.current_job_title,
            "job_category": alumni.job_category,
            "years_of_experience": alumni.years_of_experience
        }

    def get_skills(self, obj):
        skills = UserSkill.objects.filter(user=obj['user']).select_related('skill', 'skill__category')
        return SkillSerializer(skills, many=True).data

    def get_social_links(self, obj):
        links = SocialLink.objects.filter(user=obj['user'])
        return SocialLinkSerializer(links, many=True).data

    def get_ai_usage(self, obj):
        ai = UserAIUsage.objects.filter(user=obj['user'])
        return AIUsageSerializer(ai, many=True).data

    def get_interview_experiences(self, obj):
        experiences = InterviewExperience.objects.filter(author=obj['user']).prefetch_related('rounds').order_by('-created_at')
        return InterviewExperienceSerializer(experiences, many=True).data

    def get_stats(self, obj):
        user = obj['user']
        return {
            "total_posts": Post.objects.filter(author=user).count(),
            "total_interview_experiences": InterviewExperience.objects.filter(author=user).count()
        }


class InterviewRoundSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewRound
        fields = ['id', 'round_number', 'round_type', 'mode', 'duration_minutes', 'topics', 'description']

class InterviewExperienceSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    role_name = serializers.CharField(source='role.role_name', read_only=True)
    rounds = InterviewRoundSerializer(many=True, read_only=True)

    class Meta:
        model = InterviewExperience
        fields = ['id', 'company_name', 'role_name', 'experience_type', 'result', 'difficulty', 'experience', 'preparation', 'rounds', 'created_at']


from apps.opportunities.models import Opportunity
from apps.resources.models import Resource
from apps.announcements.models import Announcement

class PlacementCellProfileMasterSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(source='user.id')
    email = serializers.EmailField(source='user.email')
    full_name = serializers.SerializerMethodField()
    profile_photo = serializers.URLField(source='user.profile_photo')
    is_verified = serializers.BooleanField(source='user.is_verified')
    stats = serializers.SerializerMethodField()

    def get_full_name(self, obj):
        user = obj['user']
        full_name = user.get_full_name()
        return full_name if full_name else user.email.split('@')[0]

    def get_stats(self, obj):
        user = obj['user']
        return {
            "total_opportunities_posted": Opportunity.objects.filter(posted_by=user).count(),
            "total_announcements_sent": Announcement.objects.filter(created_by=user).count(),
            "total_resources_uploaded": Resource.objects.filter(uploaded_by=user).count()
        }


class PublicUserProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    headline = serializers.SerializerMethodField()
    identity = serializers.SerializerMethodField()
    skills = serializers.SerializerMethodField()
    social_links = serializers.SerializerMethodField()
    experience = serializers.SerializerMethodField()
    interview_experiences = serializers.SerializerMethodField()
    ai_usage = serializers.SerializerMethodField()
    stats = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'role', 'profile_photo', 'is_verified',
            'date_joined', 'headline', 'identity', 'skills', 'social_links',
            'experience', 'interview_experiences', 'ai_usage', 'stats'
        ]

    def get_full_name(self, obj):
        full_name = obj.get_full_name().strip()
        if not full_name:
            full_name = f"{obj.first_name} {obj.last_name}".strip()
        return full_name if full_name else obj.email.split('@')[0]

    def get_headline(self, obj):
        if obj.role == 'ALUMNI' and hasattr(obj, 'alumni_profile'):
            profile = obj.alumni_profile
            job = profile.current_job_title or "Alumni"
            comp = profile.current_company.name if profile.current_company else "Nirma Institute of Technology"
            return f"{job} at {comp}"
        elif obj.role == 'STUDENT' and hasattr(obj, 'student_profile'):
            profile = obj.student_profile
            dept = profile.department.name if profile.department else "Engineering"
            batch = profile.batch.start_year if profile.batch else ""
            sem = f"{profile.semester}th Semester" if profile.semester else ""
            parts = [dept, sem, f"Batch of {batch}" if batch else ""]
            return " • ".join([p for p in parts if p])
        elif obj.role == 'PLACEMENT_CELL':
            return "Training & Placement Cell • Nirma University"
        return "University Community Member"

    def get_identity(self, obj):
        data = {
            "bio": "",
            "phone": "",
            "location": "Ahmedabad, Gujarat",
            "department": None,
            "batch": None,
            "semester": None,
            "current_company": None,
            "current_company_id": None,
            "current_job_title": None,
            "years_of_experience": 0,
        }
        if obj.role == 'STUDENT' and hasattr(obj, 'student_profile'):
            sp = obj.student_profile
            data["bio"] = sp.bio or ""
            data["phone"] = sp.phone or ""
            data["location"] = sp.address or "Ahmedabad, Gujarat"
            data["department"] = sp.department.name if sp.department else None
            data["batch"] = str(sp.batch) if sp.batch else None
            data["semester"] = sp.semester
        elif obj.role == 'ALUMNI' and hasattr(obj, 'alumni_profile'):
            ap = obj.alumni_profile
            data["bio"] = ap.bio or ""
            data["phone"] = ap.phone or ""
            data["location"] = ap.location or "Ahmedabad, Gujarat"
            data["department"] = ap.department.name if ap.department else None
            data["batch"] = str(ap.batch) if ap.batch else None
            data["current_company"] = ap.current_company.name if ap.current_company else None
            data["current_company_id"] = ap.current_company.id if ap.current_company else None
            data["current_job_title"] = ap.current_job_title
            data["years_of_experience"] = ap.years_of_experience
        return data

    def get_skills(self, obj):
        skills = UserSkill.objects.filter(user=obj).select_related('skill', 'skill__category')
        return SkillSerializer(skills, many=True).data

    def get_social_links(self, obj):
        links = SocialLink.objects.filter(user=obj)
        return SocialLinkSerializer(links, many=True).data

    def get_experience(self, obj):
        if hasattr(obj, 'student_profile'):
            placements = StudentPlacementRecord.objects.filter(student=obj.student_profile).order_by('-placement_year')
            return StudentExperienceSerializer(placements, many=True).data
        return []

    def get_interview_experiences(self, obj):
        experiences = InterviewExperience.objects.filter(author=obj).select_related('company', 'role').prefetch_related('rounds').order_by('-created_at')
        return InterviewExperienceSerializer(experiences, many=True).data

    def get_ai_usage(self, obj):
        ai = UserAIUsage.objects.filter(user=obj)
        return AIUsageSerializer(ai, many=True).data

    def get_stats(self, obj):
        return {
            "total_posts": Post.objects.filter(author=obj).count(),
            "total_interview_experiences": InterviewExperience.objects.filter(author=obj).count(),
            "total_opportunities": Opportunity.objects.filter(posted_by=obj).count() if obj.role in ['PLACEMENT_CELL', 'ADMIN'] else 0,
        }


class UserSearchResultSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    headline = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()
    company = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'role', 'profile_photo', 'is_verified', 'headline', 'department', 'company']

    def get_full_name(self, obj):
        full_name = obj.get_full_name().strip()
        if not full_name:
            full_name = f"{obj.first_name} {obj.last_name}".strip()
        return full_name if full_name else obj.email.split('@')[0]

    def get_headline(self, obj):
        if obj.role == 'ALUMNI' and hasattr(obj, 'alumni_profile'):
            job = obj.alumni_profile.current_job_title or "Alumni"
            comp = obj.alumni_profile.current_company.name if obj.alumni_profile.current_company else "Nirma University"
            return f"{job} at {comp}"
        elif obj.role == 'STUDENT' and hasattr(obj, 'student_profile'):
            dept = obj.student_profile.department.name if obj.student_profile.department else "Student"
            batch = str(obj.student_profile.batch) if obj.student_profile.batch else ""
            return f"{dept} ({batch})" if batch else dept
        elif obj.role == 'PLACEMENT_CELL':
            return "Placement & Training Cell"
        return "Community Member"

    def get_department(self, obj):
        if hasattr(obj, 'student_profile') and obj.student_profile.department:
            return obj.student_profile.department.name
        if hasattr(obj, 'alumni_profile') and obj.alumni_profile.department:
            return obj.alumni_profile.department.name
        return None

    def get_company(self, obj):
        if hasattr(obj, 'alumni_profile') and obj.alumni_profile.current_company:
            return obj.alumni_profile.current_company.name
        return None

