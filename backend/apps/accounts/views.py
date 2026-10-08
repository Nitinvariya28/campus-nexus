import random
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, OTPVerification
from .serializers import StudentRegistrationSerializer, OTPVerificationSerializer, LoginSerializer

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
from apps.profiles.models import StudentProfile, AlumniProfile


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OTPVerificationSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email'].lower()
            otp_code = serializer.validated_data['otp_code']

            # 1. Fetch OTP Record
            otp_record = OTPVerification.objects.filter(email=email, otp_code=otp_code).first()
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
            
            department = Department.objects.filter(code=dept_code).first()
            start_year = 2000 + int(year_str)
            batch = Batch.objects.filter(start_year=start_year).first()
            
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

