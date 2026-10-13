import re
from rest_framework import serializers
from .models import User
from apps.university.models import UniversityIdentity

class StudentRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ['email', 'password', 'first_name', 'last_name']

    def validate_email(self, value):
        value = value.lower()
        # Strict Nirma Student Regex (3-digit roll number explicitly required)
        pattern = r"^\d{2}(bce|bec|bme|bam|bch|bee|bcv)\d{3}@nirmauni\.ac\.in$"
        if not re.match(pattern, value):
            raise serializers.ValidationError("Invalid format. Roll number must be exactly 3 digits (e.g., use '001' instead of '1'). Example: 24bce001@nirmauni.ac.in")
        
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
            
        return value

class OTPVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp_code = serializers.CharField(max_length=6)

from django.contrib.auth import authenticate

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    def validate(self, data):
        email = data.get("email", "").lower()
        password = data.get("password")

        if email and password:
            user = authenticate(email=email, password=password)
            if user:
                if not user.is_verified:
                    raise serializers.ValidationError({"error": "Account not verified. Please complete OTP verification."})
                if not user.is_active:
                    raise serializers.ValidationError({"error": "Account is inactive."})
            else:
                raise serializers.ValidationError({"error": "Invalid email or password."})
        else:
            raise serializers.ValidationError({"error": "Must include 'email' and 'password'."})

        data["user"] = user
        return data
class AlumniRegistrationSerializer(serializers.ModelSerializer):
    old_university_email = serializers.EmailField(write_only=True)
    date_of_birth = serializers.DateField(write_only=True)
    personal_email = serializers.EmailField() 
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'old_university_email', 'date_of_birth', 'personal_email', 'password']
        
    def validate_personal_email(self, value):
        value = value.lower()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("An account with this personal email already exists.")
        return value

    def validate_old_university_email(self, value):
        value = value.lower()
        pattern = r"^\d{2}(bce|bec|bme|bam|bch|bee|bcv)\d{3}@nirmauni\.ac\.in$"
        if not re.match(pattern, value):
            raise serializers.ValidationError("Invalid format. Must be a valid Nirma University email format (e.g., 20bce045@nirmauni.ac.in).")
        return value

    def validate(self, data):
        old_email = data.get('old_university_email')
        dob = data.get('date_of_birth')
        
        identity_match = UniversityIdentity.objects.filter(university_email=old_email, date_of_birth=dob).first()
        if not identity_match:
            raise serializers.ValidationError({"error": "We could not find a matching university graduation record for this email and date of birth. Please check your details."})
            
        data['identity_record'] = identity_match
        return data


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        return value.lower().strip()


class PasswordResetVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp_code = serializers.CharField(max_length=6)

    def validate_email(self, value):
        return value.lower().strip()

    def validate_otp_code(self, value):
        value = value.strip()
        if not re.match(r"^\d{6}$", value):
            raise serializers.ValidationError("OTP code must be exactly 6 digits.")
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    reset_token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    confirm_password = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})

    def validate(self, data):
        if data.get('new_password') != data.get('confirm_password'):
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return data


