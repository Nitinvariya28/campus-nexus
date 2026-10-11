import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.profiles.models import StudentProfile, StudentPlacementRecord, AlumniProfile
from apps.skills.models import MasterLearningPlatform, UserLearningResource, UserAIUsage
from apps.university.models import Department, Batch

@pytest.mark.django_db
class TestAPI13LearningAIAnalytics:
    def test_learning_ai_success(self):
        dept = Department.objects.create(name="CS")
        batch = Batch.objects.create(start_year=2024, end_year=2028)
        
        # 1 Student
        u1 = User.objects.create_user(email="s1@test.com", password="pwd", role="STUDENT")
        StudentProfile.objects.create(user=u1, department=dept, batch=batch, semester=6)
        
        # 1 Alumni
        u2 = User.objects.create_user(email="a1@test.com", password="pwd", role="ALUMNI")
        AlumniProfile.objects.create(user=u2, years_of_experience=6, department=dept, batch=batch)  # 5+ years band
        
        # Platforms
        plat1 = MasterLearningPlatform.objects.create(name="LeetCode", platform_type="CODING_PLATFORM")
        plat2 = MasterLearningPlatform.objects.create(name="Coursera", platform_type="COURSE_WEBSITE")
        
        # Resources
        UserLearningResource.objects.create(user=u1, platform=plat1)
        UserLearningResource.objects.create(user=u2, platform=plat2)
        
        # AI Usage
        UserAIUsage.objects.create(user=u1, ai_tool="CHATGPT", usage_purpose="LEARNING", usage_frequency="HEAVILY", daily_time_range="1_TO_2_HOURS")
        UserAIUsage.objects.create(user=u2, ai_tool="GITHUB_COPILOT", usage_purpose="CODING", usage_frequency="REGULARLY", daily_time_range="30_TO_60_MIN")
        
        from apps.companies.models import Company
        c = Company.objects.create(name="Google")
        # Placement for Student 1
        StudentPlacementRecord.objects.create(student=u1.studentprofile, company=c, placement_year=2024, offer_type="FTE")
        
        client = APIClient()
        client.force_authenticate(user=u1)
        
        response = client.get('/api/analytics/learning-ai/')
        assert response.status_code == 200
        
        data = response.data['data']
        
        # 1. Learning Platforms
        assert len(data['learning_platforms']['global_preferences']) == 2
        
        student_plats = next(x for x in data['learning_platforms']['by_role'] if x['role'] == 'STUDENT')
        assert student_plats['top_platforms'][0]['platform__name'] == "LeetCode"
        
        # 2. AI Usage
        assert len(data['ai_usage']['tools_overview']) == 2
        chatgpt = next(x for x in data['ai_usage']['tools_overview'] if x['ai_tool'] == 'CHATGPT')
        assert chatgpt['distinct_users'] == 1
        
        # 3. Student Insights
        assert data['student_insights']['learning_by_placement_status']['placed'][0]['platform__name'] == "LeetCode"
        assert len(data['student_insights']['learning_by_placement_status']['unplaced']) == 0
        
        ai_vs_alumni = data['student_insights']['ai_vs_alumni_comparison']
        assert ai_vs_alumni['student_top_tools'][0]['ai_tool'] == "CHATGPT"
        assert ai_vs_alumni['student_top_purposes'][0]['usage_purpose'] == "LEARNING"
        
        assert ai_vs_alumni['alumni_top_tools'][0]['ai_tool'] == "GITHUB_COPILOT"
        assert ai_vs_alumni['alumni_top_purposes'][0]['usage_purpose'] == "CODING"
        
        # 4. Alumni Insights (Experience Band)
        bands = data['alumni_insights']['by_experience_band']
        # The alumni has 6.0 years, should fall into "5+ Years"
        band_5 = next((x for x in bands if x['experience_band'] == '5+ Years'), None)
        assert band_5 is not None
        assert band_5['top_ai_tools'][0]['ai_tool'] == "GITHUB_COPILOT"
        assert band_5['top_learning_platforms'][0]['platform__name'] == "Coursera"
