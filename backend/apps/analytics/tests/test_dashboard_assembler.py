import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User

@pytest.mark.django_db
class TestAPI01DashboardAssembler:
    def test_student_dashboard(self):
        student = User.objects.create_user(email="s_dash@test.com", password="pwd", role="STUDENT")
        client = APIClient()
        client.force_authenticate(user=student)

        response = client.get('/api/analytics/dashboard/')
        assert response.status_code == 200
        data = response.json()['data']

        assert data['role_detected'] == 'STUDENT'
        assert 'common' in data
        assert 'platform_overview' in data['common']
        assert 'community_pulse' in data['common']

        assert 'student' in data
        assert 'cohort_metrics' in data['student']
        assert 'my_resume_health' in data['student']

        # Ensure other role sections are not leaked
        assert 'alumni' not in data
        assert 'placement_cell' not in data

    def test_alumni_dashboard(self):
        alumni = User.objects.create_user(email="a_dash@test.com", password="pwd", role="ALUMNI")
        client = APIClient()
        client.force_authenticate(user=alumni)

        response = client.get('/api/analytics/dashboard/')
        assert response.status_code == 200
        data = response.json()['data']

        assert data['role_detected'] == 'ALUMNI'
        assert 'alumni' in data
        assert 'career_paths' in data['alumni']
        assert 'alumni_contributions' in data['alumni']

        assert 'student' not in data
        assert 'placement_cell' not in data

    def test_placement_cell_dashboard(self):
        pc = User.objects.create_user(email="pc_dash@test.com", password="pwd", role="PLACEMENT_CELL")
        client = APIClient()
        client.force_authenticate(user=pc)

        response = client.get('/api/analytics/dashboard/')
        assert response.status_code == 200
        data = response.json()['data']

        assert data['role_detected'] == 'PLACEMENT_CELL'
        assert 'placement_cell' in data
        assert 'recruiter_health' in data['placement_cell']
        assert 'resume_cohort_health' in data['placement_cell']
        assert 'platform_health_operations' in data['placement_cell']

    def test_common_view_parameter(self):
        student = User.objects.create_user(email="s_common@test.com", password="pwd", role="STUDENT")
        client = APIClient()
        client.force_authenticate(user=student)

        response = client.get('/api/analytics/dashboard/?view=common')
        assert response.status_code == 200
        data = response.json()['data']

        assert data['view'] == 'common'
        assert 'common' in data
        assert 'student' not in data

    def test_selective_sections_parameter(self):
        student = User.objects.create_user(email="s_select@test.com", password="pwd", role="STUDENT")
        client = APIClient()
        client.force_authenticate(user=student)

        response = client.get('/api/analytics/dashboard/?sections=platform_overview,cohort_metrics')
        assert response.status_code == 200
        data = response.json()['data']

        assert 'platform_overview' in data['common']
        assert 'community_pulse' not in data['common'] # filtered out

        assert 'cohort_metrics' in data['student']
        assert 'my_resume_health' not in data['student'] # filtered out
