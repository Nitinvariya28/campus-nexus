from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.university.models import UniversityIdentity, Department, Batch
from apps.accounts.models import User, OTPVerification

class AuthenticationAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Setup master records required for Alumni Registration
        self.ui = UniversityIdentity.objects.create(
            full_name="John Doe",
            date_of_birth="2000-01-01",
            university_email="19bce099@nirmauni.ac.in"
        )
        
        # Setup Department and Batch for extraction
        self.dept = Department.objects.create(name="Computer Engineering", code="BCE")
        self.batch19 = Batch.objects.create(start_year=2019, end_year=2023)
        self.batch24 = Batch.objects.create(start_year=2024, end_year=2028)

    def test_student_registration_and_verification(self):
        # 1. Student Registration
        response = self.client.post('/api/auth/student/register/', {
            "email": "24bce099@nirmauni.ac.in",
            "password": "SecurePassword123!",
            "first_name": "Student",
            "last_name": "Test"
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Fetch generated OTP
        otp_obj = OTPVerification.objects.get(email="24bce099@nirmauni.ac.in")
        
        # 2. Verify OTP
        response = self.client.post('/api/auth/verify-otp/', {
            "email": "24bce099@nirmauni.ac.in",
            "otp_code": otp_obj.otp_code
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 3. Login
        response = self.client.post('/api/auth/login/', {
            "email": "24bce099@nirmauni.ac.in",
            "password": "SecurePassword123!"
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access_token', response.data)

    def test_alumni_registration_and_verification(self):
        # 1. Alumni Registration
        response = self.client.post('/api/auth/alumni/register/', {
            "first_name": "Alumni",
            "last_name": "Test",
            "old_university_email": "19bce099@nirmauni.ac.in",
            "date_of_birth": "2000-01-01",
            "personal_email": "alumni.test@gmail.com",
            "password": "SecurePassword123!"
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Fetch OTP
        otp_obj = OTPVerification.objects.get(email="alumni.test@gmail.com")
        
        # 2. Verify OTP
        response = self.client.post('/api/auth/verify-otp/', {
            "email": "alumni.test@gmail.com",
            "otp_code": otp_obj.otp_code
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 3. Login
        response = self.client.post('/api/auth/login/', {
            "email": "alumni.test@gmail.com",
            "password": "SecurePassword123!"
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access_token', response.data)
        
    def test_alumni_registration_invalid_format(self):
        # Invalid email format (not matching Nirma university regex)
        response = self.client.post('/api/auth/alumni/register/', {
            "first_name": "Alumni",
            "last_name": "Test",
            "old_university_email": "invalid_alumni@gmail.com",
            "date_of_birth": "2000-01-01",
            "personal_email": "alumni.test2@gmail.com",
            "password": "SecurePassword123!"
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('old_university_email', response.data)

    def test_alumni_registration_dob_mismatch(self):
        # Correct email format but DOB does not match identity record
        response = self.client.post('/api/auth/alumni/register/', {
            "first_name": "Alumni",
            "last_name": "Test",
            "old_university_email": "19bce099@nirmauni.ac.in",
            "date_of_birth": "1995-12-12",
            "personal_email": "alumni.test3@gmail.com",
            "password": "SecurePassword123!"
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
