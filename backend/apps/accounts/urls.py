from django.urls import path
from .views import (
    StudentRegistrationView, 
    VerifyOTPView, 
    LoginView, 
    AlumniRegistrationView, 
    LogoutAPIView,
    PasswordResetRequestView,
    PasswordResetVerifyOTPView,
    PasswordResetConfirmView,
    PasswordChangeView,
    AlumniEmailChangeView
)
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('student/register/', StudentRegistrationView.as_view(), name='student-register'),
    path('alumni/register/', AlumniRegistrationView.as_view(), name='alumni-register'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('login/', LoginView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutAPIView.as_view(), name='logout'),
    
    # Authenticated Profile Security Workflows
    path('password/change/', PasswordChangeView.as_view(), name='password-change'),
    path('alumni/change-email/', AlumniEmailChangeView.as_view(), name='alumni-change-email'),
    
    # Password Reset Workflow (Public POST APIs)
    path('password-reset/request/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password-reset/verify-otp/', PasswordResetVerifyOTPView.as_view(), name='password-reset-verify-otp'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
]

