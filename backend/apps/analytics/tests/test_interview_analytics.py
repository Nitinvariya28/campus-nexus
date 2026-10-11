import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.interviews.models import InterviewExperience, InterviewRound
from apps.companies.models import Company
from apps.profiles.models import StudentProfile, StudentPlacementRecord

@pytest.mark.django_db
class TestAPI16InterviewAnalytics:
    def test_interview_analytics_success(self):
        # 1. Setup User & Company
        u = User.objects.create_user(email="test@test.com", password="pwd", role="STUDENT")
        c1 = Company.objects.create(name="Google")
        c2 = Company.objects.create(name="Stripe")
        
        # 2. Setup Interview Experiences & Rounds
        ie1 = InterviewExperience.objects.create(
            author=u, company=c1, experience_type="PLACEMENT", 
            result="SELECTED", difficulty="HARD", experience="Great"
        )
        InterviewRound.objects.create(
            interview_experience=ie1, round_number=1, round_type="TECHNICAL", 
            mode="ONLINE", duration_minutes=60, topics="System Design, Algorithms"
        )
        
        ie2 = InterviewExperience.objects.create(
            author=u, company=c1, experience_type="INTERNSHIP", 
            result="NOT_SELECTED", difficulty="MEDIUM", experience="Okay"
        )
        InterviewRound.objects.create(
            interview_experience=ie2, round_number=1, round_type="HR", 
            mode="OFFLINE", duration_minutes=30, topics="Behavioral"
        )
        
        # We need 5 experiences for B-18 highest_rejection_companies
        for _ in range(4):
            InterviewExperience.objects.create(
                author=u, company=c1, experience_type="INTERNSHIP", 
                result="NOT_SELECTED", difficulty="HARD", experience="Failed"
            )

        # 3. Setup Placements for B-57 and B-58
        from apps.university.models import Department, Batch
        d_test = Department.objects.create(name="CS Dept", code="CS_TEST")
        b_test = Batch.objects.create(start_year=2022, end_year=2026)
        sp = StudentProfile.objects.create(user=u, department=d_test, batch=b_test)
        StudentPlacementRecord.objects.create(
            student=sp, company=c2, offer_type="FULL_TIME", placement_year=2026
        )
        StudentPlacementRecord.objects.create(
            student=sp, company=c1, offer_type="FULL_TIME", placement_year=2026
        )

        client = APIClient()
        client.force_authenticate(user=u)
        
        # Test default load
        response = client.get('/api/analytics/interviews/')
        assert response.status_code == 200
        
        data = response.json()['data']
        
        # Check basic metrics
        assert len(data['basic_metrics']['total_by_type']) == 2
        assert data['basic_metrics']['reported_results'][0]['result'] == 'NOT_SELECTED'
        
        # Check round analytics
        assert data['round_analytics']['avg_rounds_per_experience'] > 0
        assert len(data['round_analytics']['top_topics']) > 0
        
        # Check advanced insights
        assert len(data['advanced_insights']['highest_rejection_companies']) > 0
        assert data['advanced_insights']['highest_rejection_companies'][0]['company__name'] == 'Google'
        
        # Check placement comparisons
        missing = data['placement_comparison']['companies_missing_experiences']
        assert any(c['company__name'] == 'Stripe' for c in missing)
        
        compare = data['placement_comparison']['experience_vs_placement_comparison']
        assert any(c['company__name'] == 'Google' and c['actual_recorded_placements'] > 0 for c in compare)

    def test_interview_analytics_with_company_filter(self):
        u = User.objects.create_user(email="test2@test.com", password="pwd", role="ALUMNI")
        c = Company.objects.create(name="Meta")
        ie = InterviewExperience.objects.create(
            author=u, company=c, experience_type="PLACEMENT", 
            result="SELECTED", difficulty="HARD", experience="Good"
        )
        InterviewRound.objects.create(
            interview_experience=ie, round_number=1, round_type="TECHNICAL", 
            mode="ONLINE", duration_minutes=45
        )
        
        client = APIClient()
        client.force_authenticate(user=u)
        
        response = client.get(f'/api/analytics/interviews/?company_id={c.id}')
        assert response.status_code == 200
        
        data = response.json()['data']
        expectations = data['advanced_insights']['target_company_expectations']
        assert expectations is not None
        assert 'TECHNICAL' in expectations['expected_rounds']
        assert expectations['most_common_mode'] == 'ONLINE'
        assert expectations['average_difficulty'] == 'HARD'
