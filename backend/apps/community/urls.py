from django.urls import path
from .views import (
    UnifiedFeedView, FeedSearchView, PostOptionsView, CreatePostView, PostDetailView, 
    CreateCommentView, ToggleLikeView, ManageCommentView, ToggleBookmarkView, BookmarkListView
)

urlpatterns = [
    path('feed/', UnifiedFeedView.as_view(), name='community-feed'),
    path('feed/search/', FeedSearchView.as_view(), name='feed-search'),
    path('bookmarks/', BookmarkListView.as_view(), name='bookmark-list'),
    path('posts/options/', PostOptionsView.as_view(), name='post-options'),
    path('posts/', CreatePostView.as_view(), name='create-post'),
    path('posts/<int:post_id>/', PostDetailView.as_view(), name='post-detail'),
    path('posts/<int:post_id>/comments/', CreateCommentView.as_view(), name='create-comment'),
    path('posts/<int:post_id>/toggle-like/', ToggleLikeView.as_view(), name='toggle-like'),
    path('posts/<int:post_id>/toggle-bookmark/', ToggleBookmarkView.as_view(), name='toggle-bookmark'),
    path('comments/<int:comment_id>/', ManageCommentView.as_view(), name='manage-comment'),
]
