import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.resumes.models import Resume, ResumeAnalysis
from apps.profiles.models import StudentProfile, StudentPlacementRecord
from apps.university.models import Department, Batch
from apps.companies.models import Company

@pytest.mark.django_db
class TestAPI18ResumeCohort:
    def test_resume_cohort_success(self):
        u1 = User.objects.create_user(email="c1@test.com", password="pwd", role="STUDENT")
        u2 = User.objects.create_user(email="c2@test.com", password="pwd", role="STUDENT")
        pc = User.objects.create_user(email="pc@test.com", password="pwd", role="PLACEMENT_CELL")
        
        d = Department.objects.create(name="CS", code="CS")
        b = Batch.objects.create(start_year=2022, end_year=2026)
        
        sp1 = StudentProfile.objects.create(user=u1, department=d, batch=b)
        sp2 = StudentProfile.objects.create(user=u2, department=d, batch=b)
        
        r1 = Resume.objects.create(user=u1, title="R1")
        ResumeAnalysis.objects.create(resume=r1, score=50.00, missing_skills=["React"])
        ResumeAnalysis.objects.create(resume=r1, score=55.00, missing_skills=["React", "Node"])
        
        r2 = Resume.objects.create(user=u2, title="R2")
        ResumeAnalysis.objects.create(resume=r2, score=85.00)
        
        c = Company.objects.create(name="Google")
        StudentPlacementRecord.objects.create(student=sp2, company=c, placement_year=2026)

        client = APIClient()
        client.force_authenticate(user=pc)
        
        response = client.get('/api/analytics/placement-cell/resume-readiness/?threshold=60')
        assert response.status_code == 200
        data = response.json()['data']
        
        assert data['cohort_ats_summary']['students_with_analysis'] == 2
        assert len(data['ats_band_distribution']) > 0
        assert data['improvement_metrics']['students_improved'] == 1 # u1 improved from 50 to 55
        
        assert data['placement_correlation']['placed_students_avg_ats'] == 85.0
        
        below = data['students_below_threshold']
        assert len(below) == 1
        assert below[0]['student_id'] == u1.id
