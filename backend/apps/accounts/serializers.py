import re
from rest_framework import serializers
from .models import User

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
