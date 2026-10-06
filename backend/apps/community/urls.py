from django.urls import path
from .views import UnifiedFeedView

urlpatterns = [
    path('feed/', UnifiedFeedView.as_view(), name='community-feed'),
]
