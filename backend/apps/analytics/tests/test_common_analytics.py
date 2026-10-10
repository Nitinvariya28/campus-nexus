import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.profiles.models import StudentProfile, AlumniProfile
from apps.companies.models import Company
from apps.interviews.models import InterviewExperience
from apps.opportunities.models import Opportunity
from apps.community.models import Post

from apps.university.models import Department, Batch

@pytest.mark.django_db
class TestAPI02PlatformOverview:
    def test_platform_overview_success(self):
        # Create user
        user = User.objects.create_user(email="test@nirmauni.ac.in", password="test", role="STUDENT", is_verified=True)
        dept = Department.objects.create(name="CSE")
        batch = Batch.objects.create(start_year=2024, end_year=2028)
        StudentProfile.objects.create(user=user, department=dept, batch=batch)
        
        client = APIClient()
        client.force_authenticate(user=user)
        
        # Test the endpoint
        response = client.get('/api/analytics/platform/overview/')
        assert response.status_code == 200
        
        data = response.data['data']
        assert data['total_users'] == 1
        assert data['role_breakdown'][0]['role'] == "STUDENT"
        assert data['role_breakdown'][0]['count'] == 1
        assert data['role_breakdown'][0]['verified'] == 1
        assert data['role_breakdown'][0]['unverified'] == 0
        
        # Check platform snapshot
        snapshot = data['platform_snapshot']
        assert snapshot['total_students'] == 1
        assert snapshot['total_alumni'] == 0
        assert snapshot['total_companies'] == 0
