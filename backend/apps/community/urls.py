from django.urls import path
from .views import UnifiedFeedView, PostOptionsView, CreatePostView, PostDetailView

urlpatterns = [
    path('feed/', UnifiedFeedView.as_view(), name='community-feed'),
    path('posts/options/', PostOptionsView.as_view(), name='post-options'),
    path('posts/', CreatePostView.as_view(), name='create-post'),
    path('posts/<int:post_id>/', PostDetailView.as_view(), name='post-detail'),
]
