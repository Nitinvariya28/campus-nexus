import pytest
from django.utils import timezone
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.profiles.models import StudentProfile, StudentPlacementRecord
from apps.skills.models import Skill, SkillCategory, UserSkill
from apps.companies.models import Company
from apps.opportunities.models import Opportunity, OpportunitySkill
from apps.university.models import Department, Batch

@pytest.mark.django_db
class TestAPI12MarketGapAnalytics:
    def test_market_gap_success(self):
        cat = SkillCategory.objects.create(name="Languages", category_type="TECH")
        s_python = Skill.objects.create(name="Python", category=cat)
        s_go = Skill.objects.create(name="Go", category=cat)
        
        dept = Department.objects.create(name="CS")
        batch = Batch.objects.create(start_year=2024, end_year=2028)
        
        c = Company.objects.create(name="Google")
        
        # 2 Students
        u1 = User.objects.create_user(email="s1@test.com", password="pwd", role="STUDENT")
        sp1 = StudentProfile.objects.create(user=u1, department=dept, batch=batch)
        UserSkill.objects.create(user=u1, skill=s_python, proficiency="ADVANCED")
        
        u2 = User.objects.create_user(email="s2@test.com", password="pwd", role="STUDENT")
        StudentProfile.objects.create(user=u2, department=dept, batch=batch)
        # u2 has no skills
        
        # Placements
        StudentPlacementRecord.objects.create(student=sp1, company=c, placement_year=2024, offer_type="FTE", package_lpa=20.0)
        
        # Opportunities
        opp1 = Opportunity.objects.create(company=c, opportunity_type="PLACEMENT", title="Dev", description="..", work_mode="REMOTE")
        OpportunitySkill.objects.create(opportunity=opp1, skill=s_python, importance="REQUIRED")
        
        future_time = timezone.now() + timezone.timedelta(days=10)
        opp2 = Opportunity.objects.create(company=c, opportunity_type="PLACEMENT", title="Go Dev", description="..", work_mode="REMOTE", status="OPEN", deadline=future_time)
        OpportunitySkill.objects.create(opportunity=opp2, skill=s_go, importance="REQUIRED")
        
        client = APIClient()
        client.force_authenticate(user=u1)
        
        response = client.get('/api/analytics/skills/market-gap/')
        assert response.status_code == 200
        
        data = response.data['data']
        
        # Market Demand
        assert data['market_demand_overview']['total_opportunities_analyzed'] == 2
        # Both Python and Go are demanded by 1 opportunity (50%)
        assert len(data['market_demand_overview']['top_required_skills']) == 2
        
        # Global Supply vs Demand
        denominators = data['supply_vs_demand_global']['denominators']
        assert denominators['total_opportunities'] == 2
        assert denominators['total_students'] == 2
        
        # Open drive scarcity (Go should be missing among students)
        scarcity = data['open_drive_scarcity']
        go_scarcity = next((x for x in scarcity if x['skill__name'] == 'Go'), None)
        assert go_scarcity is not None
        assert go_scarcity['total_eligible_students_with_skill'] == 0
        assert go_scarcity['scarcity_status'] == "CRITICAL_SHORTAGE"
        
        # Note on Package Associations: We require a sample size of 3 to show up!
        assert len(data['package_associations']) == 0
