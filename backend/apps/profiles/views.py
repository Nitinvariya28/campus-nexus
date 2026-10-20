from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
from django.db import transaction
from django.db.models import Q
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import os
import uuid
from apps.accounts.models import User

from .models import StudentProfile, AlumniProfile, StudentPlacementRecord
from .serializers import (
    StudentProfileMasterSerializer,
    PublicUserProfileSerializer,
    UserSearchResultSerializer,
)

from apps.university.models import Department, Batch
from apps.university.helpers import extract_academic_info_from_email
from apps.companies.models import Company, CompanyRole
from apps.skills.models import SkillCategory, Skill, UserSkill, SocialLink, UserAIUsage, MasterLearningPlatform, UserLearningResource
from apps.resumes.models import Resume
from apps.community.models import Tag, Post, PostMedia
from apps.opportunities.models import Opportunity, OpportunitySkill
from apps.announcements.models import Announcement
from apps.interviews.models import InterviewExperience, InterviewRound
from apps.resources.models import Resource, ResourceCategory

class ProfileMeAPIView(APIView):
    """
    GET, PATCH /api/profiles/me/
    Unified profile endpoint that returns and updates the deeply connected profile 
    data based on the authenticated user's role.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user

        if user.role == 'STUDENT':
            student_profile = get_object_or_404(StudentProfile, user=user)
            context_obj = {'role': 'STUDENT', 'user': user, 'student_profile': student_profile}
            serializer = StudentProfileMasterSerializer(context_obj)
            return Response(serializer.data, status=status.HTTP_200_OK)

        elif user.role == 'ALUMNI':
            alumni_profile = get_object_or_404(AlumniProfile, user=user)
            context_obj = {'role': 'ALUMNI', 'user': user, 'alumni_profile': alumni_profile}
            from .serializers import AlumniProfileMasterSerializer
            serializer = AlumniProfileMasterSerializer(context_obj)
            return Response(serializer.data, status=status.HTTP_200_OK)

        elif user.role == 'PLACEMENT_CELL':
            context_obj = {'role': 'PLACEMENT_CELL', 'user': user}
            from .serializers import PlacementCellProfileMasterSerializer
            serializer = PlacementCellProfileMasterSerializer(context_obj)
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response({"error": "Invalid or missing user role."}, status=status.HTTP_403_FORBIDDEN)

    def patch(self, request, *args, **kwargs):
        user = request.user
        data = request.data

        if user.role == 'STUDENT':
            student_profile = get_object_or_404(StudentProfile, user=user)
            
            try:
                with transaction.atomic():
                    # 1. Update Identity (StudentProfile & User)
                    identity_data = data.get('identity', {})
                    if identity_data:
                        if 'bio' in identity_data:
                            student_profile.bio = identity_data['bio']
                        if 'semester' in identity_data:
                            sem = identity_data['semester']
                            if sem is not None and sem != '':
                                try:
                                    sem_int = int(sem)
                                    if not (1 <= sem_int <= 8):
                                        raise ValueError("Semester must be between 1 and 8.")
                                    student_profile.semester = sem_int
                                except (ValueError, TypeError):
                                    raise ValueError("Semester must be an integer between 1 and 8.")
                            else:
                                student_profile.semester = None
                        if 'phone' in identity_data:
                            phone_val = str(identity_data['phone'] or '').strip()
                            student_profile.phone = phone_val[:15] if phone_val else None
                        if 'address' in identity_data:
                            student_profile.address = identity_data['address']

                        # Note: For students, department and batch cohort are permanently fixed
                        # to their university enrollment ID and cannot be modified.
                        if not student_profile.department_id or not student_profile.batch_id:
                            d, b = extract_academic_info_from_email(user.email)
                            if not student_profile.department_id and d:
                                student_profile.department = d
                            if not student_profile.batch_id and b:
                                student_profile.batch = b

                        student_profile.save()

                        # Update User avatar if provided
                        if 'profile_photo' in identity_data:
                            user.profile_photo = identity_data['profile_photo']
                            user.save()

                    # 2. Overwrite Skills (with deduplication to satisfy unique_user_skill)
                    if 'skills' in data and data['skills'] is not None:
                        seen_skills = set()
                        unique_skills = []
                        for item in data['skills']:
                            s_id = item.get('skill_id')
                            if s_id and s_id not in seen_skills:
                                seen_skills.add(s_id)
                                unique_skills.append(item)

                        skill_ids = [item['skill_id'] for item in unique_skills]
                        existing_skills = Skill.objects.filter(id__in=skill_ids).values_list('id', flat=True)
                        missing_skills = set(skill_ids) - set(existing_skills)
                        if missing_skills:
                            raise ValueError(f"Skills with the following IDs do not exist: {list(missing_skills)}")

                        UserSkill.objects.filter(user=user).delete()
                        skills_to_create = []
                        for skill_item in unique_skills:
                            skills_to_create.append(
                                UserSkill(
                                    user=user, 
                                    skill_id=skill_item['skill_id'], 
                                    proficiency=skill_item.get('proficiency', 'BEGINNER')
                                )
                            )
                        UserSkill.objects.bulk_create(skills_to_create)

                    # 3. Overwrite Social Links (with deduplication to satisfy unique_user_social_platform)
                    if 'social_links' in data and data['social_links'] is not None:
                        seen_platforms = set()
                        unique_socials = []
                        for item in data['social_links']:
                            platform = item.get('platform')
                            if platform and platform not in seen_platforms:
                                seen_platforms.add(platform)
                                unique_socials.append(item)

                        SocialLink.objects.filter(user=user).delete()
                        socials_to_create = []
                        for social_item in unique_socials:
                            socials_to_create.append(
                                SocialLink(
                                    user=user,
                                    platform=social_item['platform'],
                                    url=social_item.get('url', '')
                                )
                            )
                        SocialLink.objects.bulk_create(socials_to_create)

                    # 4. Overwrite AI Usage
                    if 'ai_usage' in data and data['ai_usage'] is not None:
                        UserAIUsage.objects.filter(user=user).delete()
                        ai_to_create = []
                        for ai_item in data['ai_usage']:
                            tool = ai_item.get('ai_tool')
                            if not tool:
                                continue
                            ai_to_create.append(
                                UserAIUsage(
                                    user=user,
                                    ai_tool=tool,
                                    usage_frequency=ai_item.get('usage_frequency') or 'REGULARLY',
                                    daily_time_range=ai_item.get('daily_time_range') or 'LESS_THAN_30_MIN',
                                    usage_purpose=ai_item.get('usage_purpose') or 'CODING'
                                )
                            )
                        if ai_to_create:
                            UserAIUsage.objects.bulk_create(ai_to_create)

                    # 5. Overwrite Learning Platforms (UserLearningResource)
                    if 'learning_platforms' in data:
                        UserLearningResource.objects.filter(user=user).delete()
                        lps_to_create = []
                        seen_lps = set()
                        for lp_item in data['learning_platforms']:
                            p_id = lp_item.get('platform_id')
                            other_name = lp_item.get('other_platform_name')
                            url_val = lp_item.get('url', '')
                            if p_id:
                                if p_id in seen_lps:
                                    continue
                                seen_lps.add(p_id)
                                if not MasterLearningPlatform.objects.filter(id=p_id).exists():
                                    raise ValueError(f"Learning platform with ID '{p_id}' does not exist.")
                                lps_to_create.append(
                                    UserLearningResource(
                                        user=user,
                                        platform_id=p_id,
                                        url=url_val
                                    )
                                )
                            elif other_name:
                                lps_to_create.append(
                                    UserLearningResource(
                                        user=user,
                                        platform=None,
                                        other_platform_name=str(other_name)[:150],
                                        url=url_val
                                    )
                                )
                        UserLearningResource.objects.bulk_create(lps_to_create)

            except Exception as e:
                return Response({"error": f"Update failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

            context_obj = {'role': 'STUDENT', 'user': user, 'student_profile': student_profile}
            serializer = StudentProfileMasterSerializer(context_obj)
            return Response(serializer.data, status=status.HTTP_200_OK)

        elif user.role == 'ALUMNI':
            alumni_profile = get_object_or_404(AlumniProfile, user=user)
            
            try:
                with transaction.atomic():
                    # 1. Update Identity (AlumniProfile & User)
                    identity_data = data.get('identity', {})
                    if identity_data:
                        if 'bio' in identity_data:
                            alumni_profile.bio = identity_data['bio']
                        if 'department_id' in identity_data:
                            dept_id = identity_data['department_id']
                            if dept_id and str(dept_id).strip() != '':
                                if Department.objects.filter(id=dept_id).exists():
                                    alumni_profile.department_id = int(dept_id)
                        if 'batch_id' in identity_data:
                            batch_id = identity_data['batch_id']
                            if batch_id and str(batch_id).strip() != '':
                                if Batch.objects.filter(id=batch_id).exists():
                                    alumni_profile.batch_id = int(batch_id)
                        if 'phone' in identity_data:
                            phone_val = str(identity_data['phone'] or '').strip()
                            alumni_profile.phone = phone_val[:15] if phone_val else None
                        if 'location' in identity_data:
                            loc_val = str(identity_data['location'] or '').strip()
                            alumni_profile.location = loc_val[:150] if loc_val else None

                        # Ensure valid department and batch exist before saving
                        if not alumni_profile.department_id or not alumni_profile.batch_id:
                            d, b = extract_academic_info_from_email(user.email)
                            if not alumni_profile.department_id and d:
                                alumni_profile.department = d
                            if not alumni_profile.batch_id and b:
                                alumni_profile.batch = b

                        # Update User full name and avatar if provided
                        user_dirty = False
                        if 'full_name' in identity_data:
                            full_name = str(identity_data['full_name'] or '').strip()
                            if full_name:
                                parts = full_name.split(" ", 1)
                                user.first_name = parts[0]
                                user.last_name = parts[1] if len(parts) > 1 else ""
                                user_dirty = True
                        if 'profile_photo' in identity_data:
                            user.profile_photo = identity_data['profile_photo']
                            user_dirty = True
                        if user_dirty:
                            user.save()
                        
                    # 2. Update Current Career
                    career_data = data.get('current_career', {})
                    if career_data:
                        if 'company_id' in career_data:
                            company_id = career_data['company_id']
                            if company_id:
                                if not Company.objects.filter(id=company_id).exists():
                                    raise ValueError(f"Company with ID '{company_id}' does not exist.")
                                alumni_profile.current_company_id = int(company_id)
                            else:
                                alumni_profile.current_company_id = None
                        if 'role' in career_data:
                            role_val = str(career_data['role'] or '').strip()
                            alumni_profile.current_job_title = role_val or None
                        if 'job_category' in career_data:
                            alumni_profile.job_category = career_data['job_category'] or None
                        if 'years_of_experience' in career_data:
                            val = career_data['years_of_experience']
                            if val is not None and str(val).strip() != '':
                                try:
                                    exp_val = int(val)
                                    alumni_profile.years_of_experience = max(0, exp_val)
                                except (ValueError, TypeError):
                                    alumni_profile.years_of_experience = 0
                            else:
                                alumni_profile.years_of_experience = 0
                    
                    alumni_profile.save()

                    # 3. Overwrite Skills (with deduplication to satisfy unique_user_skill)
                    if 'skills' in data and data['skills'] is not None:
                        seen_skills = set()
                        unique_skills = []
                        for item in data['skills']:
                            s_id = item.get('skill_id')
                            if s_id and s_id not in seen_skills:
                                seen_skills.add(s_id)
                                unique_skills.append(item)

                        skill_ids = [item['skill_id'] for item in unique_skills]
                        existing_skills = Skill.objects.filter(id__in=skill_ids).values_list('id', flat=True)
                        missing_skills = set(skill_ids) - set(existing_skills)
                        if missing_skills:
                            raise ValueError(f"Skills with the following IDs do not exist: {list(missing_skills)}")

                        UserSkill.objects.filter(user=user).delete()
                        skills_to_create = []
                        for skill_item in unique_skills:
                            skills_to_create.append(
                                UserSkill(
                                    user=user, 
                                    skill_id=skill_item['skill_id'], 
                                    proficiency=skill_item.get('proficiency', 'BEGINNER')
                                )
                            )
                        UserSkill.objects.bulk_create(skills_to_create)

                    # 4. Overwrite Social Links (with deduplication to satisfy unique_user_social_platform)
                    if 'social_links' in data and data['social_links'] is not None:
                        seen_platforms = set()
                        unique_socials = []
                        for item in data['social_links']:
                            platform = item.get('platform')
                            if platform and platform not in seen_platforms:
                                seen_platforms.add(platform)
                                unique_socials.append(item)

                        SocialLink.objects.filter(user=user).delete()
                        socials_to_create = []
                        for social_item in unique_socials:
                            socials_to_create.append(
                                SocialLink(
                                    user=user,
                                    platform=social_item['platform'],
                                    url=social_item.get('url', '')
                                )
                            )
                        SocialLink.objects.bulk_create(socials_to_create)

                    # 5. Overwrite AI Usage
                    if 'ai_usage' in data and data['ai_usage'] is not None:
                        UserAIUsage.objects.filter(user=user).delete()
                        ai_to_create = []
                        for ai_item in data['ai_usage']:
                            tool = ai_item.get('ai_tool')
                            if not tool:
                                continue
                            ai_to_create.append(
                                UserAIUsage(
                                    user=user,
                                    ai_tool=tool,
                                    usage_frequency=ai_item.get('usage_frequency') or 'REGULARLY',
                                    daily_time_range=ai_item.get('daily_time_range') or 'LESS_THAN_30_MIN',
                                    usage_purpose=ai_item.get('usage_purpose') or 'CODING'
                                )
                            )
                        if ai_to_create:
                            UserAIUsage.objects.bulk_create(ai_to_create)

                    # 6. Overwrite Learning Platforms (UserLearningResource)
                    if 'learning_platforms' in data:
                        UserLearningResource.objects.filter(user=user).delete()
                        lps_to_create = []
                        seen_lps = set()
                        for lp_item in data['learning_platforms']:
                            p_id = lp_item.get('platform_id')
                            other_name = lp_item.get('other_platform_name')
                            url_val = lp_item.get('url', '')
                            if p_id:
                                if p_id in seen_lps:
                                    continue
                                seen_lps.add(p_id)
                                if not MasterLearningPlatform.objects.filter(id=p_id).exists():
                                    raise ValueError(f"Learning platform with ID '{p_id}' does not exist.")
                                lps_to_create.append(
                                    UserLearningResource(
                                        user=user,
                                        platform_id=p_id,
                                        url=url_val
                                    )
                                )
                            elif other_name:
                                lps_to_create.append(
                                    UserLearningResource(
                                        user=user,
                                        platform=None,
                                        other_platform_name=str(other_name)[:150],
                                        url=url_val
                                    )
                                )
                        UserLearningResource.objects.bulk_create(lps_to_create)

            except Exception as e:
                return Response({"error": f"Update failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

            context_obj = {'role': 'ALUMNI', 'user': user, 'alumni_profile': alumni_profile}
            from .serializers import AlumniProfileMasterSerializer
            serializer = AlumniProfileMasterSerializer(context_obj)
            return Response(serializer.data, status=status.HTTP_200_OK)

        elif user.role == 'PLACEMENT_CELL':
            try:
                with transaction.atomic():
                    identity_data = data.get('identity', {})
                    if identity_data:
                        user_dirty = False
                        if 'full_name' in identity_data:
                            full_name = identity_data['full_name'].strip()
                            parts = full_name.split(" ", 1)
                            user.first_name = parts[0]
                            user.last_name = parts[1] if len(parts) > 1 else ""
                            user_dirty = True
                        if 'profile_photo' in identity_data:
                            user.profile_photo = identity_data['profile_photo']
                            user_dirty = True
                        if user_dirty:
                            user.save()
            except Exception as e:
                return Response({"error": f"Update failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

            context_obj = {'role': 'PLACEMENT_CELL', 'user': user}
            from .serializers import PlacementCellProfileMasterSerializer
            serializer = PlacementCellProfileMasterSerializer(context_obj)
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response({"error": "Invalid role."}, status=status.HTTP_403_FORBIDDEN)

    @transaction.atomic
    def delete(self, request, *args, **kwargs):
        """
        DELETE /api/profiles/me/
        Soft deletes the user via anonymization and hard-deletes PII.
        """
        user = request.user
        import uuid
        
        # 1. Hard Delete PII Data (Cascade equivalents)
        # Safe inline imports to avoid circular logic
        from apps.notifications.models import Notification
        from apps.community.models import SavedPost, PostLike
        from apps.skills.models import UserLearningResource
        
        # We already have Resume, UserSkill, SocialLink, UserAIUsage from top imports
        Resume.objects.filter(user=user).delete()
        UserSkill.objects.filter(user=user).delete()
        SocialLink.objects.filter(user=user).delete()
        UserAIUsage.objects.filter(user=user).delete()
        UserLearningResource.objects.filter(user=user).delete()
        
        # Delete notifications and community interactions
        Notification.objects.filter(recipient=user).delete()
        SavedPost.objects.filter(user=user).delete()
        PostLike.objects.filter(user=user).delete()
        
        # 2. Anonymize Base User (Soft Delete)
        user.first_name = "Deleted"
        user.last_name = "User"
        user.email = f"deleted_{uuid.uuid4().hex[:12]}@anonymized.com"
        user.set_unusable_password()
        user.is_active = False
        user.save()
        
        return Response({"message": "Profile successfully deleted. All personal data wiped."}, status=status.HTTP_200_OK)


class ProfileOptionsAPIView(APIView):
    """
    GET /api/profiles/options/
    Provides category-wise master reference data and Enums tailored to the user's role.
    Implements the Hybrid Architecture (Static Enums + Top 20 for large tables).
    """
    permission_classes = [IsAuthenticated]

    def get_choices(self, choices):
        return [{"value": c[0], "display_name": c[1]} for c in choices]

    def get_top_20_grouped_skills(self):
        categories = SkillCategory.objects.prefetch_related('skills').filter(is_active=True)
        return [
            {
                "category_name": cat.name,
                "category_type": cat.category_type,
                "category_display": cat.name or cat.get_category_type_display(),
                "skills": [{"id": s.id, "name": s.name} for s in cat.skills.filter(is_active=True)[:20]]
            }
            for cat in categories if cat.skills.filter(is_active=True).exists()
        ]

    def get_top_10_learning_platforms(self):
        platforms = MasterLearningPlatform.objects.filter(is_active=True)[:30]
        grouped = {}
        for p in platforms:
            if p.platform_type not in grouped:
                grouped[p.platform_type] = []
            if len(grouped[p.platform_type]) < 10:
                grouped[p.platform_type].append({"id": p.id, "name": p.name})
        return [{"platform_type": p_type, "items": items} for p_type, items in grouped.items()]

    def get(self, request, *args, **kwargs):
        role = request.user.role

        # Common Data & Top 20 Tables
        departments = [{"id": d.id, "name": d.name} for d in Department.objects.all()]
        batches = [
            {
                "id": b.id,
                "name": str(b),
                "batch_name": str(b),
                "start_year": b.start_year,
                "end_year": b.end_year
            }
            for b in Batch.objects.all()
        ]
        top_20_tags = [{"id": t.id, "name": t.name} for t in Tag.objects.filter(is_active=True)[:20]]
        
        company_qs = Company.objects.filter(is_active=True)[:20]
        top_20_companies = [{"id": c.id, "name": c.name, "tier": c.company_tier} for c in company_qs]
        top_20_companies_simple = [{"id": c.id, "name": c.name} for c in company_qs]
        
        top_20_company_roles = [{"id": r.id, "name": r.role_name} for r in CompanyRole.objects.all()[:20]]
        top_20_grouped_skills = self.get_top_20_grouped_skills()

        payload = {}

        if role == 'STUDENT':
            payload = {
                "basic_profile_form": {
                    "social_platforms": self.get_choices(SocialLink.PLATFORM_CHOICES)
                },
                "academic_form": {
                    "departments": departments,
                    "batches": batches
                },
                "technical_skills_form": {
                    "proficiency_levels": self.get_choices(UserSkill.PROFICIENCY_CHOICES),
                    "top_20_grouped_skills": top_20_grouped_skills
                },
                "learning_habits_form": {
                    "top_10_grouped_platforms": self.get_top_10_learning_platforms()
                },
                "ai_usage_form": {
                    "tools": self.get_choices(UserAIUsage.AI_TOOL_CHOICES),
                    "frequencies": self.get_choices(UserAIUsage.FREQUENCY_CHOICES),
                    "purposes": self.get_choices(UserAIUsage.PURPOSE_CHOICES),
                    "daily_time_ranges": self.get_choices(UserAIUsage.DAILY_USAGE_CHOICES)
                },
                "internship_logging_form": {
                    "top_20_companies": top_20_companies,
                    "top_20_company_roles": top_20_company_roles,
                    "hiring_modes": self.get_choices(StudentPlacementRecord.HIRING_MODE_CHOICES),
                    "offer_types": self.get_choices(StudentPlacementRecord.OFFER_TYPE_CHOICES)
                },
                "community_post_form": {
                    "top_20_tags": top_20_tags,
                    "post_types": self.get_choices(Post.POST_TYPE_CHOICES),
                    "media_types": self.get_choices(PostMedia.MEDIA_TYPE_CHOICES)
                },
                "resume_upload_form": {
                    "file_types": self.get_choices(Resume.FILE_TYPE_CHOICES)
                }
            }

        elif role == 'ALUMNI':
            payload = {
                "basic_profile_form": {
                    "social_platforms": self.get_choices(SocialLink.PLATFORM_CHOICES)
                },
                "academic_form": {
                    "departments": departments,
                    "batches": batches
                },
                "technical_skills_form": {
                    "proficiency_levels": self.get_choices(UserSkill.PROFICIENCY_CHOICES),
                    "top_20_grouped_skills": top_20_grouped_skills
                },
                "learning_habits_form": {
                    "top_10_grouped_platforms": self.get_top_10_learning_platforms()
                },
                "current_career_form": {
                    "top_20_companies": top_20_companies_simple,
                    "job_categories": self.get_choices(AlumniProfile.JOB_CATEGORY_CHOICES)
                },
                "interview_experience_form": {
                    "top_20_company_roles": top_20_company_roles,
                    "experience_types": self.get_choices(InterviewExperience.EXPERIENCE_TYPE_CHOICES),
                    "results": self.get_choices(InterviewExperience.RESULT_CHOICES),
                    "difficulties": self.get_choices(InterviewExperience.DIFFICULTY_CHOICES),
                    "round_types": self.get_choices(InterviewRound.ROUND_TYPE_CHOICES),
                    "modes": self.get_choices(InterviewRound.MODE_CHOICES)
                },
                "ai_usage_form": {
                    "tools": self.get_choices(UserAIUsage.AI_TOOL_CHOICES),
                    "frequencies": self.get_choices(UserAIUsage.FREQUENCY_CHOICES),
                    "purposes": self.get_choices(UserAIUsage.PURPOSE_CHOICES),
                    "daily_time_ranges": self.get_choices(UserAIUsage.DAILY_USAGE_CHOICES)
                },
                "community_post_form": {
                    "top_20_tags": top_20_tags,
                    "post_types": self.get_choices(Post.POST_TYPE_CHOICES),
                    "media_types": self.get_choices(PostMedia.MEDIA_TYPE_CHOICES)
                }
            }

        elif role == 'PLACEMENT_CELL':
            payload = {
                "academic_eligibility_form": {
                    "departments": departments,
                    "batches": batches
                },
                "company_management_form": {
                    "top_20_companies": top_20_companies_simple,
                    "company_sizes": self.get_choices(Company.COMPANY_SIZE_CHOICES),
                    "company_tiers": self.get_choices(Company.COMPANY_TIER_CHOICES)
                },
                "opportunity_posting_form": {
                    "types": self.get_choices(Opportunity.OPPORTUNITY_TYPE_CHOICES),
                    "work_modes": self.get_choices(Opportunity.WORK_MODE_CHOICES),
                    "employment_types": self.get_choices(Opportunity.EMPLOYMENT_TYPE_CHOICES),
                    "statuses": self.get_choices(Opportunity.STATUS_CHOICES),
                    "skill_importance": self.get_choices(OpportunitySkill.IMPORTANCE_CHOICES)
                },
                "announcement_posting_form": {
                    "types": self.get_choices(Announcement.ANNOUNCEMENT_TYPE_CHOICES),
                    "audiences": self.get_choices(Announcement.AUDIENCE_CHOICES)
                },
                "resource_upload_form": {
                    "categories": [{"id": rc.id, "name": rc.name} for rc in ResourceCategory.objects.filter(is_active=True)],
                    "visibility_options": self.get_choices(Resource.VISIBILITY_CHOICES)
                },
                "skill_requirements_form": {
                    "top_20_grouped_skills": top_20_grouped_skills
                }
            }
        
        else:
            return Response({"error": "Invalid role."}, status=status.HTTP_403_FORBIDDEN)

        return Response(payload, status=status.HTTP_200_OK)


from rest_framework.pagination import PageNumberPagination
from apps.skills.models import Skill

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 15
    page_size_query_param = 'page_size'
    max_page_size = 50

class ReferenceSearchAPIView(APIView):
    """
    GET /api/profiles/search/<model_type>/?q=query
    Universal paginated search API for large reference tables (Infinite Scroll).
    Supported model_types: 'skills', 'companies', 'tags', 'platforms'.
    """
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get(self, request, model_type, *args, **kwargs):
        q = request.GET.get('q', '').strip()
        
        queryset = None
        # Default simple serializer
        serializer_func = lambda obj: {"id": obj.id, "name": obj.name}

        if model_type == 'skills':
            queryset = Skill.objects.filter(is_active=True)
            if q:
                queryset = queryset.filter(name__icontains=q)
            queryset = queryset.order_by('name')
            
        elif model_type == 'companies':
            queryset = Company.objects.filter(is_active=True)
            if q:
                queryset = queryset.filter(name__icontains=q)
            queryset = queryset.order_by('name')
            # Companies also return their tier
            serializer_func = lambda obj: {"id": obj.id, "name": obj.name, "tier": obj.company_tier}
            
        elif model_type == 'tags':
            queryset = Tag.objects.filter(is_active=True)
            if q:
                queryset = queryset.filter(name__icontains=q)
            queryset = queryset.order_by('name')
            
        elif model_type == 'platforms':
            queryset = MasterLearningPlatform.objects.filter(is_active=True)
            if q:
                queryset = queryset.filter(name__icontains=q)
            queryset = queryset.order_by('name')
            # Platforms also return their type
            serializer_func = lambda obj: {"id": obj.id, "name": obj.name, "platform_type": obj.platform_type}
            
        else:
            return Response(
                {"error": f"Invalid search type: '{model_type}'. Supported types: skills, companies, tags, platforms."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Apply Pagination
        paginator = self.pagination_class()
        paginated_queryset = paginator.paginate_queryset(queryset, request, view=self)
        
        # Serialize the paginated data
        data = [serializer_func(obj) for obj in paginated_queryset]
        
        # Return standard DRF paginated response format (count, next, previous, results)
        return paginator.get_paginated_response(data)


class UserSearchAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if not query:
            return Response([], status=status.HTTP_200_OK)

        clean_query = query.lstrip('#').strip()
        search_term = clean_query if clean_query else query

        users_qs = User.objects.filter(
            Q(first_name__icontains=search_term) |
            Q(last_name__icontains=search_term) |
            Q(email__icontains=search_term) |
            Q(student_profile__department__name__icontains=search_term) |
            Q(alumni_profile__department__name__icontains=search_term) |
            Q(alumni_profile__current_company__name__icontains=search_term) |
            Q(alumni_profile__current_job_title__icontains=search_term) |
            Q(user_skills__skill__name__icontains=search_term) |
            Q(student_profile__bio__icontains=search_term) |
            Q(alumni_profile__bio__icontains=search_term)
        ).select_related(
            'student_profile__department',
            'student_profile__batch',
            'alumni_profile__department',
            'alumni_profile__batch',
            'alumni_profile__current_company'
        ).prefetch_related(
            'user_skills__skill'
        ).distinct()[:15]

        serializer = UserSearchResultSerializer(users_qs, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class PublicUserProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id=None):
        if not user_id or str(user_id).lower() == 'me':
            user = request.user
        else:
            user = get_object_or_404(
                User.objects.select_related(
                    'student_profile__department',
                    'student_profile__batch',
                    'alumni_profile__department',
                    'alumni_profile__batch',
                    'alumni_profile__current_company'
                ),
                id=user_id
            )
        serializer = PublicUserProfileSerializer(user, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProfileAvatarUploadAPIView(APIView):
    """
    POST /api/profiles/avatar/
    Uploads user's profile photo/avatar.
    Enforces format (.jpg, .png, .webp) and max 5MB size limit.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file_obj = (
            request.FILES.get('avatar') or 
            request.FILES.get('profile_photo') or 
            request.FILES.get('file')
        )
        if not file_obj:
            return Response({"error": "No image file provided."}, status=status.HTTP_400_BAD_REQUEST)

        valid_extensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
        ext = os.path.splitext(file_obj.name)[1].lower()
        if ext not in valid_extensions:
            return Response({"error": "Only JPG, PNG, and WebP images are allowed."}, status=status.HTTP_400_BAD_REQUEST)

        if file_obj.size > 5 * 1024 * 1024:
            return Response({"error": "Image file size exceeds the 5MB limit."}, status=status.HTTP_400_BAD_REQUEST)

        clean_name = f"{uuid.uuid4().hex[:8]}_{file_obj.name.replace(' ', '_')}"
        storage_rel_path = f"avatars/user_{request.user.id}/{clean_name}"
        saved_path = default_storage.save(storage_rel_path, ContentFile(file_obj.read()))

        avatar_url = f"{settings.MEDIA_URL}{saved_path}"
        request.user.profile_photo = avatar_url
        request.user.save(update_fields=['profile_photo'])

        return Response({
            "message": "Profile photo updated successfully.",
            "avatar_url": avatar_url
        }, status=status.HTTP_200_OK)


class ProfileCoverUploadAPIView(APIView):
    """
    POST /api/profiles/cover/
    Uploads user's profile cover banner image.
    DELETE /api/profiles/cover/
    Resets cover image to default.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file_obj = (
            request.FILES.get('cover') or 
            request.FILES.get('cover_image') or 
            request.FILES.get('banner') or 
            request.FILES.get('file')
        )
        if not file_obj:
            return Response({"error": "No image file provided."}, status=status.HTTP_400_BAD_REQUEST)

        valid_extensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
        ext = os.path.splitext(file_obj.name)[1].lower()
        if ext not in valid_extensions:
            return Response({"error": "Only JPG, PNG, and WebP images are allowed."}, status=status.HTTP_400_BAD_REQUEST)

        if file_obj.size > 10 * 1024 * 1024:
            return Response({"error": "Cover image file size exceeds the 10MB limit."}, status=status.HTTP_400_BAD_REQUEST)

        clean_name = f"{uuid.uuid4().hex[:8]}_{file_obj.name.replace(' ', '_')}"
        storage_rel_path = f"covers/user_{request.user.id}/{clean_name}"
        saved_path = default_storage.save(storage_rel_path, ContentFile(file_obj.read()))

        cover_url = f"{settings.MEDIA_URL}{saved_path}"
        request.user.cover_image = cover_url
        request.user.save(update_fields=['cover_image'])

        full_url = request.build_absolute_uri(cover_url) if request else cover_url

        return Response({
            "message": "Cover image updated successfully.",
            "cover_url": cover_url,
            "cover_image": full_url
        }, status=status.HTTP_200_OK)

    def delete(self, request):
        request.user.cover_image = None
        request.user.save(update_fields=['cover_image'])
        return Response({
            "message": "Cover image removed successfully.",
            "cover_url": None,
            "cover_image": None
        }, status=status.HTTP_200_OK)



