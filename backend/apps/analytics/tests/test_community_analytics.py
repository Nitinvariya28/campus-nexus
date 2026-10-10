import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.community.models import Post, Comment, PostLike, SavedPost, PostTag, Tag
from apps.profiles.models import StudentProfile, StudentPlacementRecord
from apps.university.models import Department, Batch
from apps.companies.models import Company

@pytest.mark.django_db
class TestAPI03CommunityAnalytics:
    def test_community_analytics_success(self):
        # Create users
        user1 = User.objects.create_user(email="test1@nirmauni.ac.in", password="test", role="STUDENT", is_verified=True, first_name="John", last_name="Doe")
        user2 = User.objects.create_user(email="test2@nirmauni.ac.in", password="test", role="STUDENT", is_verified=True, first_name="Jane", last_name="Smith")
        
        dept = Department.objects.create(name="CSE")
        batch = Batch.objects.create(start_year=2024, end_year=2028)
        
        # user1 is a placed student, user2 is an unplaced student
        sp1 = StudentProfile.objects.create(user=user1, department=dept, batch=batch)
        sp2 = StudentProfile.objects.create(user=user2, department=dept, batch=batch)
        
        company = Company.objects.create(name="Google")
        StudentPlacementRecord.objects.create(student=sp1, company=company, offer_type="FTE", placement_year=2028)
        
        # Create community activity
        post1 = Post.objects.create(author=user1, post_type="ARTICLE", title="My Internship", content="It was great")
        post2 = Post.objects.create(author=user2, post_type="JOB_UPDATE", title="Looking for roles", content="Help", company=company)
        
        Comment.objects.create(post=post1, author=user2, content="Nice!")
        PostLike.objects.create(post=post1, user=user2)
        SavedPost.objects.create(post=post1, user=user2)
        
        tag = Tag.objects.create(name="Internship", is_active=True)
        PostTag.objects.create(post=post1, tag=tag)
        
        client = APIClient()
        client.force_authenticate(user=user1)
        
        # Test the endpoint
        response = client.get('/api/analytics/community/')
        assert response.status_code == 200
        
        data = response.data['data']
        
        # Assert A-70
        assert len(data['post_type_breakdown']) == 2
        
        # Assert A-72
        assert data['top_authors'][0]['post_count'] == 1
        
        # Assert A-74
        assert len(data['top_posts']) == 2
        assert data['top_posts'][0]['likes_count'] == 1
        
        # Assert A-75
        assert len(data['top_tags']) == 1
        assert data['top_tags'][0]['tag__name'] == "Internship"
        
        # Assert A-77
        assert data['engagement_metrics']['company_linked_posts'] == 1
        
        # Assert B-23
        assert data['placement_correlation']['placed_students_active'] == 1
        assert data['placement_correlation']['unplaced_students_active'] == 1
