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

    def test_password_reset_workflow(self):
        # Setup an existing verified user
        user = User.objects.create_user(
            email="reset.user@nirmauni.ac.in",
            password="OldPassword123!",
            first_name="Reset",
            last_name="Tester",
            role="STUDENT",
            is_verified=True
        )

        # 1. Request Password Reset OTP
        response = self.client.post('/api/auth/password-reset/request/', {
            "email": "reset.user@nirmauni.ac.in"
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("message", response.data)

        # Verify OTP record in DB has purpose='PASSWORD_RESET'
        otp_record = OTPVerification.objects.get(
            email="reset.user@nirmauni.ac.in", 
            purpose='PASSWORD_RESET'
        )
        self.assertEqual(otp_record.purpose, 'PASSWORD_RESET')

        # 2. Verify OTP with invalid code
        invalid_res = self.client.post('/api/auth/password-reset/verify-otp/', {
            "email": "reset.user@nirmauni.ac.in",
            "otp_code": "000000"
        })
        self.assertEqual(invalid_res.status_code, status.HTTP_400_BAD_REQUEST)

        # 3. Verify OTP with correct code
        verify_res = self.client.post('/api/auth/password-reset/verify-otp/', {
            "email": "reset.user@nirmauni.ac.in",
            "otp_code": otp_record.otp_code
        })
        self.assertEqual(verify_res.status_code, status.HTTP_200_OK)
        self.assertIn("reset_token", verify_res.data)
        reset_token = verify_res.data["reset_token"]

        # 4. Confirm Password Reset with password mismatch
        mismatch_res = self.client.post('/api/auth/password-reset/confirm/', {
            "reset_token": reset_token,
            "new_password": "NewSecurePassword456!",
            "confirm_password": "DifferentPassword789!"
        })
        self.assertEqual(mismatch_res.status_code, status.HTTP_400_BAD_REQUEST)

        # 5. Confirm Password Reset with valid data (No email, no otp needed!)
        confirm_res = self.client.post('/api/auth/password-reset/confirm/', {
            "reset_token": reset_token,
            "new_password": "NewSecurePassword456!",
            "confirm_password": "NewSecurePassword456!"
        })
        self.assertEqual(confirm_res.status_code, status.HTTP_200_OK)

        # 5b. Verify that reusing the same reset_token fails
        reused_res = self.client.post('/api/auth/password-reset/confirm/', {
            "reset_token": reset_token,
            "new_password": "AnotherPassword999!",
            "confirm_password": "AnotherPassword999!"
        })
        self.assertEqual(reused_res.status_code, status.HTTP_400_BAD_REQUEST)

        # Verify OTP record is deleted
        self.assertFalse(
            OTPVerification.objects.filter(
                email="reset.user@nirmauni.ac.in", 
                purpose='PASSWORD_RESET'
            ).exists()
        )

        # 6. Verify Old Password no longer works
        old_login = self.client.post('/api/auth/login/', {
            "email": "reset.user@nirmauni.ac.in",
            "password": "OldPassword123!"
        })
        self.assertEqual(old_login.status_code, status.HTTP_401_UNAUTHORIZED)

        # 7. Verify New Password works for login
        new_login = self.client.post('/api/auth/login/', {
            "email": "reset.user@nirmauni.ac.in",
            "password": "NewSecurePassword456!"
        })
        self.assertEqual(new_login.status_code, status.HTTP_200_OK)
        self.assertIn('access_token', new_login.data)

    def test_registration_otp_cannot_be_used_for_password_reset(self):
        # Create a user and registration OTP
        user = User.objects.create_user(
            email="collision.test@nirmauni.ac.in",
            password="InitialPassword123!",
            role="STUDENT",
            is_verified=True
        )
        reg_otp = OTPVerification.objects.create(
            email="collision.test@nirmauni.ac.in",
            otp_code="999888",
            purpose="REGISTRATION"
        )

        # Attempt to use the REGISTRATION OTP to verify password reset
        res = self.client.post('/api/auth/password-reset/verify-otp/', {
            "email": "collision.test@nirmauni.ac.in",
            "otp_code": "999888"
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Invalid OTP code.", res.data.get("error", ""))

