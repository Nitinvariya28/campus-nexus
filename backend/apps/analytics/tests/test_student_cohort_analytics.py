import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.profiles.models import StudentProfile, StudentPlacementRecord
from apps.university.models import Department, Batch
from apps.companies.models import Company

@pytest.mark.django_db
class TestAPI06StudentCohortAnalytics:
    def test_student_cohorts_success(self):
        dept = Department.objects.create(name="Computer Science", is_active=True)
        batch = Batch.objects.create(start_year=2024, end_year=2028, is_active=True)
        
        user1 = User.objects.create_user(email="test1@nirmauni.ac.in", password="test", role="STUDENT", first_name="John")
        user2 = User.objects.create_user(email="test2@nirmauni.ac.in", password="test", role="STUDENT", first_name="Jane")
        
        sp1 = StudentProfile.objects.create(user=user1, department=dept, batch=batch, semester=5, bio="Hello", phone="12345", address="NY")
        sp2 = StudentProfile.objects.create(user=user2, department=dept, batch=batch, semester=5, bio="")  # partially incomplete
        
        company = Company.objects.create(name="Google", company_tier="Tier 1")
        
        StudentPlacementRecord.objects.create(student=sp1, company=company, offer_type="FTE", placement_year=2028)
        
        client = APIClient()
        client.force_authenticate(user=user1)
        
        response = client.get('/api/analytics/student-cohorts/')
        assert response.status_code == 200
        
        data = response.data['data']
        
        assert data['cohort_metrics']['total_students'] == 2
        assert data['cohort_metrics']['profile_completeness']['bio_completed_pct'] == 50.0
        
        assert len(data['university_structure']['active_departments']) == 1
        assert len(data['university_structure']['active_batches']) == 1
        
        assert data['students_by_department'][0]['count'] == 2
        assert data['students_by_batch'][0]['count'] == 2
        assert data['students_by_semester'][0]['count'] == 2
        assert data['department_by_batch_matrix'][0]['count'] == 2
        
        assert data['placement_coverage']['by_department'][0]['eligible_students'] == 2
        assert data['placement_coverage']['by_department'][0]['placed_students'] == 1
        assert data['placement_coverage']['by_department'][0]['coverage_pct'] == 50.0
