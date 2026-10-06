from django.urls import path
from .views import StudentRegistrationView, VerifyOTPView

urlpatterns = [
    path('student/register/', StudentRegistrationView.as_view(), name='student-register'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
]
