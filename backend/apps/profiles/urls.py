from django.urls import path
from .views import ProfileMeAPIView, ProfileOptionsAPIView, ReferenceSearchAPIView

app_name = 'profiles'

urlpatterns = [
    path('me/', ProfileMeAPIView.as_view(), name='profile-me'),
    path('options/', ProfileOptionsAPIView.as_view(), name='profile-options'),
    path('search/<str:model_type>/', ReferenceSearchAPIView.as_view(), name='reference-search'),
]
