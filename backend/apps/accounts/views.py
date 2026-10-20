import random
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, OTPVerification
from .serializers import (
    StudentRegistrationSerializer, 
    OTPVerificationSerializer, 
    LoginSerializer,
    PasswordResetRequestSerializer,
    PasswordResetVerifySerializer,
    PasswordResetConfirmSerializer,
    PasswordChangeSerializer,
    AlumniEmailChangeSerializer
)

class StudentRegistrationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = StudentRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']
            first_name = serializer.validated_data.get('first_name', '')
            last_name = serializer.validated_data.get('last_name', '')

            # 1. Create the unverified User
            user = User.objects.create_user(
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                role='STUDENT',
                is_verified=False
            )

            # 2. Generate 6-digit OTP
            otp_code = f"{random.randint(100000, 999999)}"

            # 3. Store OTP in Database
            OTPVerification.objects.update_or_create(
                email=email,
                purpose='REGISTRATION',
                defaults={'otp_code': otp_code}
            )

            # 4. Send Email via SMTP
            try:
                send_mail(
                    subject="AlumiBridge - Verify Your Student Account",
                    message=f"Hello {first_name},\n\nWelcome to AlumiBridge! To complete your student registration, please enter the following 6-digit verification code:\n\n{otp_code}\n\nThis code will expire in 10 minutes.\n\nRegards,\nAlumiBridge Team",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[email],
                    fail_silently=False,
                )
            except Exception as e:
                # If email fails, rollback user creation so they aren't stuck with an unverified account
                user.delete()
                return Response(
                    {"error": "Failed to send email. Please check your email address and try again."}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            return Response({
                "message": "OTP sent to your university email. Please verify to continue."
            }, status=status.HTTP_201_CREATED)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

from django.utils import timezone
from datetime import timedelta
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
from apps.profiles.models import StudentProfile, AlumniProfile


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OTPVerificationSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email'].lower()
            otp_code = serializer.validated_data['otp_code']

            # 1. Fetch OTP Record
            otp_record = OTPVerification.objects.filter(email=email, otp_code=otp_code, purpose='REGISTRATION').first()
            if not otp_record:
                return Response({"error": "Invalid OTP code."}, status=status.HTTP_400_BAD_REQUEST)

            # 2. Check Expiration (10 minutes)
            expiration_time = otp_record.created_at + timedelta(minutes=10)
            if timezone.now() > expiration_time:
                otp_record.delete()
                return Response({"error": "OTP has expired. Please register again to get a new code."}, status=status.HTTP_400_BAD_REQUEST)

            # 3. Mark User as Verified
            user = User.objects.filter(email=email).first()
            if not user:
                return Response({"error": "User account not found."}, status=status.HTTP_404_NOT_FOUND)

            user.is_verified = True
            user.save()

            # 4. Auto-Generate Profile
            if user.role == 'STUDENT':
                from apps.university.models import Department, Batch
                
                
                year_str = email[:2]
                dept_code = email[2:5].upper()
                
                department = Department.objects.filter(code=dept_code).first()
                start_year = 2000 + int(year_str)
                batch = Batch.objects.filter(start_year=start_year).first()
                
                StudentProfile.objects.get_or_create(
                    user=user, 
                    defaults={
                        'department': department,
                        'batch': batch,
                        'semester': 1 # Default starting semester
                    }
                )
            elif user.role == 'ALUMNI':
                AlumniProfile.objects.get_or_create(user=user)

            # 5. Database Cleanup
            otp_record.delete()

            return Response({
                "message": "Email verified successfully! You can now log in."
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Generate JWT Tokens
            refresh = RefreshToken.for_user(user)

            return Response({
                "access_token": str(refresh.access_token),
                "refresh_token": str(refresh),
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "role": user.role
                }
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)

from .serializers import AlumniRegistrationSerializer

class AlumniRegistrationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = AlumniRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            personal_email = serializer.validated_data['personal_email']
            password = serializer.validated_data['password']
            old_university_email = serializer.validated_data['old_university_email']
            first_name = serializer.validated_data.get('first_name', '')
            last_name = serializer.validated_data.get('last_name', '')

            # 1. Create the unverified ALUMNI User
            user = User.objects.create_user(
                email=personal_email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                role='ALUMNI',
                is_verified=False
            )
            
            # 2. Extract batch and department and build the AlumniProfile immediately!
            from apps.university.models import Department, Batch
            year_str = old_university_email[:2]
            dept_code = old_university_email[2:5].upper()
            
            department = Department.objects.filter(code=dept_code).first() or Department.objects.filter(code={"BCE":"CSE","BEC":"ECE","BME":"ME","BEE":"EE","BCV":"CE"}.get(dept_code)).first() or Department.objects.first()
            start_year = 2000 + int(year_str)
            batch = Batch.objects.filter(start_year=start_year).first() or Batch.objects.get_or_create(start_year=start_year, end_year=start_year+4, defaults={"is_active": True})[0]
            
            AlumniProfile.objects.create(
                user=user,
                department=department,
                batch=batch
            )

            # 3. Generate OTP
            otp_code = f"{random.randint(100000, 999999)}"

            # 4. Store OTP mapped to the personal email
            OTPVerification.objects.update_or_create(
                email=personal_email,
                purpose='REGISTRATION',
                defaults={'otp_code': otp_code}
            )

            # 5. Send Email via SMTP
            try:
                send_mail(
                    subject="AlumiBridge - Verify Your Alumni Account",
                    message=f"Hello {first_name},\n\nWelcome back to AlumiBridge! We have successfully verified your graduation records.\n\nTo complete your registration, please enter the following 6-digit verification code:\n\n{otp_code}\n\nThis code will expire in 10 minutes.\n\nRegards,\nThe Placement Cell",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[personal_email],
                    fail_silently=False,
                )
            except Exception as e:
                # Rollback User (which cascades and deletes the AlumniProfile too)
                user.delete()
                return Response(
                    {"error": "Failed to send email. Please check your personal email address and try again."}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            return Response({
                "message": "Identity verified! OTP sent to your personal email. Please verify to continue."
            }, status=status.HTTP_201_CREATED)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LogoutAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response({'error': 'Refresh token is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'message': 'Successfully logged out.'}, status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response({'error': 'Token is invalid or expired.'}, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            user = User.objects.filter(email=email).first()
            if not user:
                return Response(
                    {"error": "No account found with this email address."}, 
                    status=status.HTTP_404_NOT_FOUND
                )

            # Generate 6-digit OTP
            otp_code = f"{random.randint(100000, 999999)}"

            # Store OTP in Database with purpose='PASSWORD_RESET'
            OTPVerification.objects.update_or_create(
                email=email,
                purpose='PASSWORD_RESET',
                defaults={'otp_code': otp_code}
            )

            # Send Email via SMTP
            try:
                name_greeting = f"Hello {user.first_name}," if user.first_name else "Hello,"
                send_mail(
                    subject="AlumiBridge - Password Reset OTP",
                    message=(
                        f"{name_greeting}\n\n"
                        f"We received a request to reset your password for your AlumiBridge account.\n\n"
                        f"Your 6-digit password reset verification code is:\n\n"
                        f"{otp_code}\n\n"
                        f"This code will expire in 10 minutes. If you did not request a password reset, please ignore this email.\n\n"
                        f"Regards,\nAlumiBridge Security Team"
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[email],
                    fail_silently=False,
                )
            except Exception:
                return Response(
                    {"error": "Failed to send password reset email. Please try again later."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            return Response({
                "message": "Password reset OTP sent to your email."
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetVerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetVerifySerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            otp_code = serializer.validated_data['otp_code']

            otp_record = OTPVerification.objects.filter(
                email=email, 
                otp_code=otp_code, 
                purpose='PASSWORD_RESET'
            ).first()

            if not otp_record:
                return Response(
                    {"error": "Invalid OTP code."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            expiration_time = otp_record.created_at + timedelta(minutes=10)
            if timezone.now() > expiration_time:
                otp_record.delete()
                return Response(
                    {"error": "OTP has expired. Please request a new code."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            user = User.objects.filter(email=email).first()
            if not user:
                return Response(
                    {"error": "User account not found."}, 
                    status=status.HTTP_404_NOT_FOUND
                )

            # OTP is verified; delete it to avoid re-use
            otp_record.delete()

            # Generate short-lived (10 min) tamper-proof reset token tied to current user state
            signer = TimestampSigner()
            reset_token = signer.sign(f"{user.id}:{user.password}")

            return Response({
                "message": "OTP verified successfully. Proceed to reset password.",
                "reset_token": reset_token
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            reset_token = serializer.validated_data['reset_token']
            new_password = serializer.validated_data['new_password']

            signer = TimestampSigner()
            try:
                # Validates signature and 10-minute expiry (max_age=600 seconds)
                unsigned_data = signer.unsign(reset_token, max_age=600)
                user_id_str, old_password_hash = unsigned_data.split(':', 1)
                user = User.objects.filter(id=int(user_id_str)).first()
                if not user:
                    return Response(
                        {"error": "User account not found."}, 
                        status=status.HTTP_404_NOT_FOUND
                    )

                # Single-use check: ensure password hash has not already changed
                if user.password != old_password_hash:
                    return Response(
                        {"error": "Reset token has already been used or is invalid."}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )

            except SignatureExpired:
                return Response(
                    {"error": "Reset token has expired. Please request a new OTP."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            except (BadSignature, ValueError):
                return Response(
                    {"error": "Invalid reset token."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Update password
            user.set_password(new_password)
            user.save()

            return Response({
                "message": "Password has been reset successfully. You can now log in with your new password."
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordChangeView(APIView):
    """
    POST /api/accounts/password/change/
    Allows an authenticated user (Student, Alumni, Placement Cell) to securely change their password.
    Requires current_password, new_password, and confirm_password.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({"message": "Password changed successfully."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


from django.core.validators import validate_email
from django.core.exceptions import ValidationError

class AlumniRequestEmailOTPView(APIView):
    """
    POST /api/accounts/alumni/request-email-otp/
    Initiates personal email change for verified Alumni.
    Verifies current account password, validates new email format and uniqueness,
    generates a 6-digit OTP and dispatches it via SMTP to the new email address.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.role != 'ALUMNI':
            return Response(
                {"error": "Only alumni accounts are permitted to change their personal email address."},
                status=status.HTTP_403_FORBIDDEN
            )

        password = request.data.get('password', '')
        if not password:
            return Response({"password": ["Account password is required for verification."]}, status=status.HTTP_400_BAD_REQUEST)

        if not user.check_password(password):
            return Response({"password": ["Current account password is incorrect."]}, status=status.HTTP_400_BAD_REQUEST)

        new_email = str(request.data.get('new_email', '')).strip().lower()
        if not new_email:
            return Response({"new_email": ["New email address is required."]}, status=status.HTTP_400_BAD_REQUEST)

        try:
            validate_email(new_email)
        except ValidationError:
            return Response({"new_email": ["Please enter a valid email address."]}, status=status.HTTP_400_BAD_REQUEST)

        if new_email == user.email.lower():
            return Response({"new_email": ["New email cannot be the same as your current email."]}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=new_email).exists():
            return Response({"new_email": ["An account with this email address already exists."]}, status=status.HTTP_400_BAD_REQUEST)

        # Generate 6-digit OTP
        otp_code = f"{random.randint(100000, 999999)}"

        # Store in OTPVerification with purpose='EMAIL_CHANGE'
        OTPVerification.objects.update_or_create(
            email=new_email,
            purpose='EMAIL_CHANGE',
            defaults={'otp_code': otp_code}
        )

        # Dispatch verification email
        try:
            greeting = f"Hello {user.first_name}," if user.first_name else "Hello,"
            send_mail(
                subject="AlumiBridge - Verify Your New Email Address",
                message=(
                    f"{greeting}\n\n"
                    f"You requested to update your AlumiBridge personal email address to {new_email}.\n\n"
                    f"Your 6-digit verification code is:\n\n"
                    f"{otp_code}\n\n"
                    f"This code will expire in 10 minutes. If you did not make this request, your account is secure and no change has been made.\n\n"
                    f"Regards,\nAlumiBridge Security Team"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[new_email],
                fail_silently=False,
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to send verification email to {new_email}. Please ensure the address is correct."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response({
            "message": f"Verification code sent to {new_email}. Please enter the 6-digit OTP to complete your email update."
        }, status=status.HTTP_200_OK)


class AlumniEmailChangeView(APIView):
    """
    PATCH /api/accounts/alumni/change-email/
    Allows verified ALUMNI to finalize updating their personal email address by validating OTP.
    Requires new_email and otp_code.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        user = request.user
        if user.role != 'ALUMNI':
            return Response(
                {"error": "Only alumni accounts are permitted to change their email address."},
                status=status.HTTP_403_FORBIDDEN
            )

        new_email = str(request.data.get('new_email', '')).strip().lower()
        otp_code = str(request.data.get('otp_code', '')).strip()

        if not new_email:
            return Response({"new_email": ["New email address is required."]}, status=status.HTTP_400_BAD_REQUEST)

        if not otp_code:
            return Response({"otp_code": ["Verification code is required."]}, status=status.HTTP_400_BAD_REQUEST)

        # Verify OTP record
        otp_record = OTPVerification.objects.filter(
            email=new_email,
            otp_code=otp_code,
            purpose='EMAIL_CHANGE'
        ).first()

        if not otp_record:
            return Response(
                {"error": "Invalid verification code. Please check your email and try again."},
                status=status.HTTP_400_BAD_REQUEST
            )

        expiration_time = otp_record.created_at + timedelta(minutes=10)
        if timezone.now() > expiration_time:
            otp_record.delete()
            return Response(
                {"error": "Verification code has expired. Please request a new code."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Double check uniqueness
        if User.objects.filter(email=new_email).exclude(id=user.id).exists():
            return Response(
                {"error": "An account with this email address already exists."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update user's email
        user.email = new_email
        user.save(update_fields=['email'])

        # Cleanup OTP record
        otp_record.delete()

        return Response({
            "message": "Personal email address updated successfully.",
            "email": user.email
        }, status=status.HTTP_200_OK)




