from django.urls import path
from .views import (
    ProfileMeAPIView,
    ProfileOptionsAPIView,
    ReferenceSearchAPIView,
    UserSearchAPIView,
    PublicUserProfileAPIView,
)

app_name = 'profiles'

urlpatterns = [
    path('me/', ProfileMeAPIView.as_view(), name='profile-me'),
    path('options/', ProfileOptionsAPIView.as_view(), name='profile-options'),
    path('users/search/', UserSearchAPIView.as_view(), name='users-search'),
    path('user/me/', PublicUserProfileAPIView.as_view(), {'user_id': None}, name='user-profile-me'),
    path('user/<str:user_id>/', PublicUserProfileAPIView.as_view(), name='user-profile-detail-str'),
    path('user/<int:user_id>/', PublicUserProfileAPIView.as_view(), name='user-profile-detail'),
    path('<int:user_id>/', PublicUserProfileAPIView.as_view(), name='user-profile-detail-short'),
    path('search/<str:model_type>/', ReferenceSearchAPIView.as_view(), name='reference-search'),
]
