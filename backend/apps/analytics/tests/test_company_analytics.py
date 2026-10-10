import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.companies.models import Company, CompanyRole
from apps.profiles.models import AlumniProfile, StudentProfile, StudentPlacementRecord
from apps.interviews.models import InterviewExperience
from apps.opportunities.models import Opportunity
from apps.university.models import Department, Batch

@pytest.mark.django_db
class TestAPI05CompanyAnalytics:
    def test_company_landscape_success(self):
        user = User.objects.create_user(email="test@nirmauni.ac.in", password="test", role="STUDENT", first_name="John", last_name="Doe")
        
        dept = Department.objects.create(name="CSE")
        batch = Batch.objects.create(start_year=2024, end_year=2028)
        
        c1 = Company.objects.create(name="Google", industry="Technology", company_tier="Tier 1", is_active=True)
        c2 = Company.objects.create(name="Goldman Sachs", industry="Finance", company_tier="Tier 1", is_active=True)
        
        CompanyRole.objects.create(company=c1, role_name="Software Engineer", role_category="Engineering")
        
        sp = StudentProfile.objects.create(user=user, department=dept, batch=batch)
        StudentPlacementRecord.objects.create(student=sp, company=c1, offer_type="FTE", placement_year=2028)
        
        AlumniProfile.objects.create(user=user, current_company=c1, years_of_experience=2, department=dept, batch=batch)
        
        InterviewExperience.objects.create(author=user, company=c1, experience_type="INTERNSHIP", result="SELECTED", experience="Good")
        
        Opportunity.objects.create(company=c1, posted_by=user, opportunity_type="JOB", title="SDE1", description="Apply", work_mode="ONSITE", status="OPEN")
        
        client = APIClient()
        client.force_authenticate(user=user)
        
        response = client.get('/api/analytics/companies/overview/')
        assert response.status_code == 200
        
        data = response.data['data']
        
        assert data['company_metrics']['total_companies'] == 2
        assert len(data['companies_by_industry']) == 2
        
        assert data['role_metrics']['roles_by_category'][0]['count'] == 1
        
        # Google should be in company_presence and have all counts = 1
        presence = data['company_presence'][0]
        assert presence['company_name'] == "Google"
        assert presence['alumni_count'] == 1
        assert presence['placements_count'] == 1
        assert presence['interviews_count'] == 1
        assert presence['opportunities_count'] == 1
        assert presence['roles_count'] == 1
        assert presence['total_presence_score'] == 3
        
        # Industry comparison
        assert data['industry_presence_comparison'][0]['industry'] == "Technology"
        assert data['industry_presence_comparison'][0]['alumni_employed_count'] == 1
