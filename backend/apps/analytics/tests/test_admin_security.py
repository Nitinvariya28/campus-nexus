import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User, OTPVerification
from apps.university.models import UniversityIdentity

@pytest.mark.django_db
class TestAPI20AdminSecurity:
    def test_admin_security_success(self):
        admin = User.objects.create_superuser(email="admin@test.com", password="pwd")
        
        OTPVerification.objects.create(email="spam@test.com", otp_code="111")
        OTPVerification.objects.create(email="spam@test.com", otp_code="222")
        
        UniversityIdentity.objects.create(full_name="A", date_of_birth="2000-01-01", university_email="claimed@test.com")
        UniversityIdentity.objects.create(full_name="B", date_of_birth="2000-01-01", university_email="unclaimed@test.com")
        
        User.objects.create_user(email="claimed@test.com", password="pwd")

        client = APIClient()
        client.force_authenticate(user=admin)
        
        response = client.get('/api/analytics/admin/identity-otp/?threshold=2')
        assert response.status_code == 200
        
        data = response.json()['data']
        assert len(data['otp_abuse_detection']['emails_above_threshold']) == 1
        assert data['otp_abuse_detection']['emails_above_threshold'][0]['email'] == 'spam@test.com'
        
        assert data['identity_claiming']['total_pre_approved_identities'] == 2
        assert data['identity_claiming']['identities_claimed'] == 1
        assert data['identity_claiming']['identities_unclaimed'] == 1
        assert data['identity_claiming']['claim_rate_percentage'] == 50.0

    def test_admin_security_unauthorized(self):
        student = User.objects.create_user(email="s@test.com", password="pwd", role="STUDENT")
        client = APIClient()
        client.force_authenticate(user=student)
        
        response = client.get('/api/analytics/admin/identity-otp/')
        assert response.status_code == 403
