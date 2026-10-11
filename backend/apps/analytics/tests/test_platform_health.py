import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User, OTPVerification
from apps.skills.models import SocialLink, UserSkill, Skill, SkillCategory
from apps.profiles.models import StudentProfile
from apps.reports.models import Report

@pytest.mark.django_db
class TestAPI19PlatformHealth:
    def test_platform_health_success(self):
        pc = User.objects.create_user(email="pc@test.com", password="pwd", role="PLACEMENT_CELL")
        
        OTPVerification.objects.create(email="new@test.com", otp_code="123456")
        
        u1 = User.objects.create_user(email="new@test.com", password="pwd", role="STUDENT", is_verified=True)
        from apps.university.models import Department, Batch
        d = Department.objects.create(name="CS", code="CS")
        b = Batch.objects.create(start_year=2022, end_year=2026)
        sp = StudentProfile.objects.create(user=u1, bio="Hello", department=d, batch=b)
        
        SocialLink.objects.create(user=u1, platform="LINKEDIN", url="http")
        
        sc = SkillCategory.objects.create(name="Tech")
        s = Skill.objects.create(category=sc, name="Python")
        UserSkill.objects.create(user=u1, skill=s, proficiency="BEGINNER")
        
        Report.objects.create(reported_by=u1, target_type="POST", target_id=1, reason="SPAM", status="PENDING")

        client = APIClient()
        client.force_authenticate(user=pc)
        
        response = client.get('/api/analytics/placement-cell/platform-health/')
        assert response.status_code == 200
        
        data = response.json()['data']
        assert data['otp_metrics']['conversion_metrics']['distinct_otp_emails'] == 1
        assert data['onboarding_funnel']['stage_4_profile_completed'] == 1
        assert data['onboarding_funnel']['stage_5_skills_added'] == 1
        
        assert len(data['social_linking']) == 1
        assert data['social_linking'][0]['platform'] == 'LINKEDIN'
        
        assert len(data['moderation_reports']['by_reason_and_month']) == 1
