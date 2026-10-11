import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.resumes.models import Resume, ResumeAnalysis

@pytest.mark.django_db
class TestAPI17ResumePersonal:
    def test_resume_personal_success(self):
        u1 = User.objects.create_user(email="s1@test.com", password="pwd", role="STUDENT")
        u2 = User.objects.create_user(email="s2@test.com", password="pwd", role="STUDENT")
        
        # User 1 resumes
        r1 = Resume.objects.create(user=u1, title="My Resume 1", file_type="PDF", is_primary=True)
        r2 = Resume.objects.create(user=u1, title="My Resume 2", file_type="PDF")
        
        # User 2 resumes (should be isolated)
        r3 = Resume.objects.create(user=u2, title="Other Resume", file_type="PDF", is_primary=True)
        ResumeAnalysis.objects.create(resume=r3, score=99.00)
        
        # User 1 analyses
        ResumeAnalysis.objects.create(
            resume=r1, score=70.00, missing_skills=["Python", "Docker"], strengths=["Action verbs"]
        )
        ResumeAnalysis.objects.create(
            resume=r1, score=85.00, missing_skills=["Docker"], strengths=["Action verbs", "Metrics"]
        )
        ResumeAnalysis.objects.create(
            resume=r2, score=60.00, missing_skills=["Python"]
        )

        client = APIClient()
        client.force_authenticate(user=u1)
        
        response = client.get('/api/analytics/resumes/me/')
        assert response.status_code == 200
        
        data = response.json()['data']
        assert data['resume_overview']['total_resumes_uploaded'] == 2
        assert data['resume_overview']['total_analyses_run'] == 3
        assert data['resume_overview']['primary_resume_latest_score'] == 85.0
        
        assert len(data['score_progression']) == 3
        
        missing = data['aggregated_feedback']['frequently_missing_skills']
        assert missing[0]['skill'] in ["Docker", "Python"]
        assert missing[0]['flagged_count'] == 2
