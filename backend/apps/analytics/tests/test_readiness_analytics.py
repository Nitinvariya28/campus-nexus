import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.profiles.models import StudentProfile, StudentPlacementRecord
from apps.resumes.models import Resume, ResumeAnalysis
from apps.companies.models import Company
from apps.university.models import Department, Batch

@pytest.mark.django_db
class TestAPI10PlacementReadinessAnalytics:
    def test_readiness_analytics_success(self):
        dept = Department.objects.create(name="CS")
        batch = Batch.objects.create(start_year=2024, end_year=2028)
        
        # User 1: Placed (Should not appear in unplaced list)
        u1 = User.objects.create_user(email="placed@nirmauni.ac.in", password="test", role="STUDENT")
        sp1 = StudentProfile.objects.create(user=u1, department=dept, batch=batch)
        c1 = Company.objects.create(name="Google")
        StudentPlacementRecord.objects.create(student=sp1, company=c1, placement_year=2024, offer_type="FTE")
        
        # User 2: Unplaced, No Resume
        u2 = User.objects.create_user(email="no_resume@nirmauni.ac.in", password="test", role="STUDENT")
        StudentProfile.objects.create(user=u2, department=dept, batch=batch)
        
        # User 3: Unplaced, Low ATS Score (45.5)
        u3 = User.objects.create_user(email="low_ats@nirmauni.ac.in", password="test", role="STUDENT")
        sp3 = StudentProfile.objects.create(user=u3, department=dept, batch=batch)
        r3 = Resume.objects.create(user=u3, title="My Resume", file="url", file_type="PDF")
        ResumeAnalysis.objects.create(resume=r3, score=45.50)
        
        # User 4: Unplaced, Ready (85.0)
        u4 = User.objects.create_user(email="ready@nirmauni.ac.in", password="test", role="STUDENT")
        sp4 = StudentProfile.objects.create(user=u4, department=dept, batch=batch)
        r4 = Resume.objects.create(user=u4, title="My Resume", file="url", file_type="PDF")
        ResumeAnalysis.objects.create(resume=r4, score=85.00)

        # Placement Cell User
        pc_user = User.objects.create_user(email="pc@nirmauni.ac.in", password="test", role="PLACEMENT_CELL")
        
        client = APIClient()
        client.force_authenticate(user=pc_user)
        
        response = client.get('/api/analytics/placement-cell/readiness/')
        assert response.status_code == 200
        
        data = response.data['data']
        
        assert data['unplaced_cohort_summary']['total_unplaced_students'] == 3
        
        assert data['readiness_metrics']['no_resume_uploaded'] == 1
        assert data['readiness_metrics']['low_ats_score'] == 1
        assert data['readiness_metrics']['ready_for_placements'] == 1
        
    def test_readiness_access_for_student(self):
        student = User.objects.create_user(email="s@nirmauni.ac.in", password="test", role="STUDENT")
        client = APIClient()
        client.force_authenticate(user=student)
        
        response = client.get('/api/analytics/placement-cell/readiness/')
        assert response.status_code == 200
