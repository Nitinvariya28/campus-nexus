import pytest
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.companies.models import Company
from apps.opportunities.models import Opportunity
from apps.profiles.models import StudentProfile, StudentPlacementRecord

@pytest.mark.django_db
class TestAPI09OpportunitiesAnalytics:
    def test_opportunities_analytics_success(self):
        c1 = Company.objects.create(name="Google")
        c2 = Company.objects.create(name="Microsoft")
        
        now = timezone.now()
        
        opp1 = Opportunity.objects.create(company=c1, title="SDE1", opportunity_type="JOB", status="OPEN", deadline=now + timedelta(days=2), salary_package="10.5 LPA")
        opp2 = Opportunity.objects.create(company=c1, title="SDE2", opportunity_type="JOB", status="CLOSED", deadline=now - timedelta(days=5), salary_package="20 LPA")
        opp3 = Opportunity.objects.create(company=c2, title="Intern", opportunity_type="INTERNSHIP", status="OPEN", deadline=now + timedelta(days=10), salary_package="50000 per month")
        
        from apps.university.models import Department, Batch
        dept = Department.objects.create(name="CS")
        batch = Batch.objects.create(start_year=2024, end_year=2028)
        
        user1 = User.objects.create_user(email="test1@nirmauni.ac.in", password="test", role="STUDENT")
        sp1 = StudentProfile.objects.create(user=user1, department=dept, batch=batch)
        
        # Student got a placement at Google via opp1
        StudentPlacementRecord.objects.create(student=sp1, company=c1, opportunity=opp1, placement_year=2024, offer_type="FTE")
        
        client = APIClient()
        client.force_authenticate(user=user1)
        
        response = client.get('/api/analytics/opportunities/')
        assert response.status_code == 200
        
        data = response.data['data']
        
        assert data['inventory_summary']['total_opportunities'] == 3
        
        # One is past deadline, two are active (today+2 and today+10)
        assert data['inventory_summary']['deadline_status']['past_deadline'] == 1
        assert data['inventory_summary']['deadline_status']['active_deadline'] == 2
        
        # Only opp1 is urgent (< 7 days)
        assert len(data['urgent_deadlines']) == 1
        assert data['urgent_deadlines'][0]['title'] == "SDE1"
        
        assert data['breakdowns']['by_company'][0]['company__name'] == "Google"
        assert data['breakdowns']['by_company'][0]['count'] == 2
        
        # Platform Effectiveness
        # Google posted 2 opps, 1 placement linked. Conversion: 50%
        # Microsoft posted 1 opp, 0 placements linked. Conversion: 0%
        assert data['platform_effectiveness'][0]['company__name'] == "Google"
        assert data['platform_effectiveness'][0]['opportunities_posted'] == 2
        assert data['platform_effectiveness'][0]['platform_sourced_placements'] == 1
        assert data['platform_effectiveness'][0]['conversion_pct'] == 50.0
