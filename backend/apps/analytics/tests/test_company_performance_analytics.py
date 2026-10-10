import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.profiles.models import StudentProfile, AlumniProfile, StudentPlacementRecord
from apps.companies.models import Company

from apps.university.models import Department, Batch

@pytest.mark.django_db
class TestAPI08CompanyPerformanceAnalytics:
    def test_company_performance_success(self):
        c_new = Company.objects.create(name="Stripe", company_tier="Tier 1")
        c_repeat = Company.objects.create(name="Google", company_tier="Tier 1")
        c_lapsed = Company.objects.create(name="Meta", company_tier="Tier 1")
        c_outreach = Company.objects.create(name="OpenAI")
        
        dept = Department.objects.create(name="Computer Science")
        batch = Batch.objects.create(start_year=2024, end_year=2028)
        
        user1 = User.objects.create_user(email="test1@nirmauni.ac.in", password="test", role="STUDENT")
        user2 = User.objects.create_user(email="test2@nirmauni.ac.in", password="test", role="STUDENT")
        alum = User.objects.create_user(email="alum@gmail.com", password="test", role="ALUMNI")
        
        sp1 = StudentProfile.objects.create(user=user1, department=dept, batch=batch)
        sp2 = StudentProfile.objects.create(user=user2, department=dept, batch=batch)
        AlumniProfile.objects.create(user=alum, current_company=c_outreach)
        
        # Meta: Hired in 2022 (Lapsed)
        StudentPlacementRecord.objects.create(student=sp1, company=c_lapsed, placement_year=2022, offer_type="FTE")
        
        # Google: Hired in 2023 and 2024 (Repeat)
        StudentPlacementRecord.objects.create(student=sp1, company=c_repeat, placement_year=2023, offer_type="INTERNSHIP") # sp1 intern
        StudentPlacementRecord.objects.create(student=sp1, company=c_repeat, placement_year=2024, offer_type="FTE") # converted!
        
        # Stripe: Hired in 2024 (New)
        StudentPlacementRecord.objects.create(student=sp2, company=c_new, placement_year=2024, offer_type="FTE")
        
        client = APIClient()
        client.force_authenticate(user=user1)
        
        response = client.get('/api/analytics/placements/companies/')
        assert response.status_code == 200
        
        data = response.data['data']
        
        assert data['recruiter_health']['latest_year'] == 2024
        assert len(data['recruiter_health']['new_recruiters']) == 1
        assert data['recruiter_health']['new_recruiters'][0]['company__name'] == "Stripe"
        
        assert len(data['recruiter_health']['repeat_recruiters']) == 1
        assert data['recruiter_health']['repeat_recruiters'][0]['company__name'] == "Google"
        
        assert len(data['recruiter_health']['lapsed_recruiters']) == 1
        assert data['recruiter_health']['lapsed_recruiters'][0]['company__name'] == "Meta"
        
        assert len(data['outreach_targets']) == 1
        assert data['outreach_targets'][0]['company__name'] == "OpenAI"
        
        assert data['internship_conversion']['eligible_internships'] == 1
        assert data['internship_conversion']['converted_to_ppo_or_fte'] == 1
        assert data['internship_conversion']['conversion_rate_pct'] == 100.0
