import pytest
from decimal import Decimal
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.profiles.models import StudentProfile, StudentPlacementRecord
from apps.university.models import Department, Batch
from apps.companies.models import Company
from apps.opportunities.models import Opportunity

@pytest.mark.django_db
class TestAPI07PlacementSummaryAnalytics:
    def test_placement_summary_success(self):
        dept = Department.objects.create(name="Computer Science")
        batch = Batch.objects.create(start_year=2024, end_year=2028)
        
        user1 = User.objects.create_user(email="test1@nirmauni.ac.in", password="test", role="STUDENT")
        user2 = User.objects.create_user(email="test2@nirmauni.ac.in", password="test", role="STUDENT")
        
        sp1 = StudentProfile.objects.create(user=user1, department=dept, batch=batch)
        sp2 = StudentProfile.objects.create(user=user2, department=dept, batch=batch)
        
        c1 = Company.objects.create(name="Google", company_tier="Tier 1")
        c2 = Company.objects.create(name="Microsoft", company_tier="Tier 1")
        
        opp = Opportunity.objects.create(company=c1, opportunity_type="JOB", title="SDE1", work_mode="ONSITE", status="OPEN")
        
        # User 1 has multiple offers
        StudentPlacementRecord.objects.create(student=sp1, company=c1, opportunity=opp, offer_type="FTE", hiring_mode="ON_CAMPUS", placement_year=2028, package_lpa=Decimal("20.5"), job_category="Software Engineering", job_title="SDE1")
        StudentPlacementRecord.objects.create(student=sp1, company=c2, offer_type="FTE", hiring_mode="ON_CAMPUS", placement_year=2028, package_lpa=Decimal("25.0"), job_category="Software Engineering", job_title="SDE1")
        
        # User 2 has one offer
        StudentPlacementRecord.objects.create(student=sp2, company=c2, offer_type="INTERNSHIP", hiring_mode="OFF_CAMPUS", placement_year=2027, package_lpa=Decimal("6.0"), job_category="Data Science", job_title="Analyst")
        
        client = APIClient()
        client.force_authenticate(user=user1)
        
        response = client.get('/api/analytics/placements/summary/')
        assert response.status_code == 200
        
        data = response.data['data']
        
        assert data['summary']['total_offers'] == 3
        assert data['summary']['distinct_students_placed'] == 2
        assert data['summary']['multiple_offer_students'] == 1
        assert data['summary']['platform_sourced_offers'] == 1
        assert data['summary']['non_platform_offers'] == 2
        
        # Package Stats [6.0, 20.5, 25.0]
        assert data['package_statistics']['minimum_lpa'] == 6.0
        assert data['package_statistics']['maximum_lpa'] == 25.0
        assert data['package_statistics']['median_lpa'] == 20.5
        assert data['package_statistics']['average_lpa'] == round((6+20.5+25)/3, 2)
        
        # Bands
        assert len(data['package_bands']) > 0
        
        # Breakdown
        assert len(data['breakdowns']['top_job_categories']) == 2
        
        # Trends
        assert len(data['trends']['yearly_summary']) == 2
        
        # Departments
        assert data['department_outcomes'][0]['total_offers'] == 3
        assert data['tier_outcomes'][0]['total_offers'] == 3
