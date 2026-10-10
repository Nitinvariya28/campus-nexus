import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.resources.models import Resource, ResourceCategory
from apps.announcements.models import Announcement
from apps.community.models import Post, PostLike, Comment
from apps.companies.models import Company

@pytest.mark.django_db
class TestAPI04ResourcesAnnouncements:
    def test_resources_announcements_success(self):
        user = User.objects.create_user(email="admin@nirmauni.ac.in", password="test", role="PLACEMENT_CELL", first_name="Placement", last_name="Cell")
        
        category = ResourceCategory.objects.create(name="Interview Prep")
        Resource.objects.create(category=category, title="DSA Guide", uploaded_by=user, visibility="PUBLIC", is_active=True, external_url="http://example.com")
        
        Announcement.objects.create(title="New Drive", content="Google is coming", announcement_type="PLACEMENT_DRIVE", is_published=True)
        
        company = Company.objects.create(name="Google")
        
        post = Post.objects.create(author=user, title="Placement Drive: Google", content="Register now", post_type="ANNOUNCEMENT", company=company)
        PostLike.objects.create(post=post, user=user)
        Comment.objects.create(post=post, author=user, content="Awesome")
        
        client = APIClient()
        client.force_authenticate(user=user)
        
        response = client.get('/api/analytics/resources-announcements/')
        assert response.status_code == 200
        
        data = response.data['data']
        
        # A-78
        assert len(data['resources_by_category']) == 1
        assert data['resources_by_category'][0]['category__name'] == "Interview Prep"
        assert data['resources_by_category'][0]['count'] == 1
        
        # A-79
        assert data['top_resource_contributors'][0]['contributed_count'] == 1
        
        # A-80
        assert len(data['announcements_by_month']) == 1
        
        # A-81 & B-59
        assert data['announcement_engagement']['total_likes'] == 1
        assert data['announcement_engagement']['total_comments'] == 1
        assert data['announcement_engagement']['placement_drive_engagement']['likes'] == 1
