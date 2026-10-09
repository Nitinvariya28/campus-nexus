import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.community.models import Post, Comment, PostLike, SavedPost
from django.urls import reverse

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def auth_user(db):
    user = User.objects.create(email="testuser@nirmauni.ac.in", role="STUDENT", is_active=True, is_verified=True)
    user.set_password("password123")
    user.save()
    from apps.profiles.models import StudentProfile
    from apps.university.models import Department, Batch
    dept, _ = Department.objects.get_or_create(name="CE")
    batch, _ = Batch.objects.get_or_create(start_year=2020, end_year=2024)
    StudentProfile.objects.get_or_create(user=user, defaults={'department': dept, 'batch': batch})
    return user

@pytest.fixture
def auth_token(api_client, auth_user):
    res = api_client.post('/api/auth/login/', {
        "email": "testuser@nirmauni.ac.in",
        "password": "password123"
    }, format='json')
    return res.data['access_token']

@pytest.mark.django_db
class TestAuthenticationModule:
    def test_login(self, api_client, auth_user):
        res = api_client.post('/api/auth/login/', {
            "email": "testuser@nirmauni.ac.in",
            "password": "password123"
        }, format='json')
        assert res.status_code == 200
        assert 'access_token' in res.data
        assert 'refresh_token' in res.data

    def test_logout(self, api_client, auth_user):
        # First login to get refresh token
        res_login = api_client.post('/api/auth/login/', {
            "email": "testuser@nirmauni.ac.in",
            "password": "password123"
        }, format='json')
        refresh_token = res_login.data['refresh_token']
        access_token = res_login.data['access_token']
        
        # Then logout
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        res_logout = api_client.post('/api/auth/logout/', {
            "refresh": refresh_token
        }, format='json')
        
        assert res_logout.status_code == 205

@pytest.mark.django_db
class TestProfileModule:
    def test_get_my_profile(self, api_client, auth_token):
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {auth_token}')
        res = api_client.get('/api/profiles/me/')
        assert res.status_code == 200

    def test_update_my_profile(self, api_client, auth_token):
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {auth_token}')
        res = api_client.patch('/api/profiles/me/', {
            "first_name": "Updated",
            "last_name": "Name",
            "student_profile": {
                "current_semester": 5
            }
        }, format='json')
        assert res.status_code in [200, 400]
        
@pytest.mark.django_db
class TestCommunityModule:
    def test_unified_feed(self, api_client, auth_token, auth_user):
        # Create a post
        Post.objects.create(author=auth_user, title="Test Post", content="Test", post_type="GENERAL")
        
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {auth_token}')
        res = api_client.get('/api/community/feed/')
        
        assert res.status_code == 200
        assert 'results' in res.data
        assert len(res.data['results']) >= 1

    def test_toggle_like(self, api_client, auth_token, auth_user):
        post = Post.objects.create(author=auth_user, title="Test Post", content="Test", post_type="GENERAL")
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {auth_token}')
        
        # Like
        res1 = api_client.post(f'/api/community/posts/{post.id}/toggle-like/')
        assert res1.status_code == 200
        assert res1.data['is_liked_by_me'] == True
        
        # Unlike
        res2 = api_client.post(f'/api/community/posts/{post.id}/toggle-like/')
        assert res2.status_code == 200
        assert res2.data['is_liked_by_me'] == False

    def test_comment_on_post(self, api_client, auth_token, auth_user):
        post = Post.objects.create(author=auth_user, title="Test Post", content="Test", post_type="GENERAL")
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {auth_token}')
        
        res = api_client.post(f'/api/community/posts/{post.id}/comments/', {
            "content": "This is a comment"
        }, format='json')
        
        assert res.status_code == 201
        assert Comment.objects.count() == 1

    def test_toggle_bookmark(self, api_client, auth_token, auth_user):
        post = Post.objects.create(author=auth_user, title="Test Post", content="Test", post_type="GENERAL")
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {auth_token}')
        
        # Bookmark
        res1 = api_client.post(f'/api/community/posts/{post.id}/toggle-bookmark/')
        assert res1.status_code == 200
        assert res1.data['is_bookmarked_by_me'] == True
        
        # View Bookmarks
        res2 = api_client.get('/api/community/bookmarks/')
        assert res2.status_code == 200
        assert len(res2.data['results']) == 1
