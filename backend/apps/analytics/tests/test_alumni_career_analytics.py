import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.profiles.models import AlumniProfile
from apps.companies.models import Company
from apps.university.models import Department, Batch

@pytest.mark.django_db
class TestAPI14AlumniCareerAnalytics:
    def test_alumni_career_success(self):
        dept = Department.objects.create(name="CS")
        batch = Batch.objects.create(start_year=2018, end_year=2022)
        
        c = Company.objects.create(name="Google", industry="FinTech", company_tier="TIER_1")
        
        # Alumni 1 (has company)
        u1 = User.objects.create_user(email="a1@test.com", password="pwd", role="ALUMNI")
        p1 = AlumniProfile.objects.create(
            user=u1, department=dept, batch=batch,
            current_company=c, job_category="DATA_SCIENCE",
            years_of_experience=6.0, location="Bangalore",
            phone="123", bio="hello"
        )
        
        # Alumni 2 (no company)
        u2 = User.objects.create_user(email="a2@test.com", password="pwd", role="ALUMNI")
        p2 = AlumniProfile.objects.create(
            user=u2, department=dept, batch=batch,
            years_of_experience=3.0, job_category="SOFTWARE"
        )
        
        client = APIClient()
        client.force_authenticate(user=u1)
        
        response = client.get('/api/analytics/alumni/careers/')
        assert response.status_code == 200
        
        data = response.data['data']
        
        # 1. Overview
        assert data['alumni_overview']['total_alumni_profiles'] == 2
        assert data['alumni_overview']['alumni_without_company'] == 1
        assert data['alumni_overview']['average_experience_years'] == 4.5
        
        # Completeness: bio (1/2 = 50%), phone (1/2 = 50%), location (1/2 = 50%), current_company (1/2 = 50%)
        # Note: Depending on empty strings vs null, our code did `~Q(bio='')`.
        assert data['alumni_overview']['profile_completeness_pct']['bio'] == 50.0
        assert data['alumni_overview']['profile_completeness_pct']['current_company'] == 50.0
        
        # 2. Demographics
        assert len(data['employment_demographics']['by_job_category']) == 2
        
        # 3. Company Insights
        assert len(data['company_insights']['by_company']) == 1
        assert data['company_insights']['by_company'][0]['current_company__name'] == "Google"
        
        # 4. Cross Associations
        assert data['cross_associations']['experience_by_tier_and_job_category'][0]['company__tier'] == 'TIER_1'
        assert data['cross_associations']['experience_by_tier_and_job_category'][0]['categories'][0]['job_category'] == 'DATA_SCIENCE'
