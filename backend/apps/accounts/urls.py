from django.urls import path
from .views import StudentRegistrationView, VerifyOTPView, LoginView, AlumniRegistrationView

urlpatterns = [
    path('student/register/', StudentRegistrationView.as_view(), name='student-register'),
    path('alumni/register/', AlumniRegistrationView.as_view(), name='alumni-register'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('login/', LoginView.as_view(), name='login'),
]
