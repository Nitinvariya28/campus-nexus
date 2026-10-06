from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import User
from apps.companies.models import Company
from .models import Post, Tag

class CreatePostAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create Dummy Users
        self.student = User.objects.create_user(
            email='24bce001@nirmauni.ac.in', password='password123', role='STUDENT'
        )
        self.alumni = User.objects.create_user(
            email='alumni@gmail.com', password='password123', role='ALUMNI'
        )
        self.placement_cell = User.objects.create_user(
            email='placement@nirmauni.ac.in', password='password123', role='PLACEMENT_CELL'
        )

    def test_student_valid_post(self):
        """Test that a Student can post an INTERVIEW_EXPERIENCE"""
        self.client.force_authenticate(user=self.student)
        payload = {
            "title": "My Interview",
            "content": "It was great",
            "post_type": "INTERVIEW_EXPERIENCE",
            "new_company_name": "Google",
            "new_tags": ["Tech"]
        }
        response = self.client.post('/api/community/posts/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Post.objects.filter(title="My Interview").exists())
        self.assertTrue(Company.objects.filter(name="Google").exists())
        self.assertTrue(Tag.objects.filter(name="Tech").exists())

    def test_student_invalid_post_security_block(self):
        """Test that a Student gets blocked when trying to post PLACEMENT_EXPERIENCE"""
        self.client.force_authenticate(user=self.student)
        payload = {
            "title": "I got placed!",
            "content": "Yay",
            "post_type": "PLACEMENT_EXPERIENCE"
        }
        response = self.client.post('/api/community/posts/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("Security Block", response.data['error'])

    def test_alumni_valid_post(self):
        """Test that an Alumni can successfully post PLACEMENT_EXPERIENCE"""
        self.client.force_authenticate(user=self.alumni)
        payload = {
            "title": "I got placed!",
            "content": "Yay",
            "post_type": "PLACEMENT_EXPERIENCE"
        }
        response = self.client.post('/api/community/posts/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_placement_cell_invalid_post(self):
        """Test that Placement Cell cannot post CAREER_ADVICE"""
        self.client.force_authenticate(user=self.placement_cell)
        payload = {
            "title": "Resume Tips",
            "content": "Use PDF format",
            "post_type": "CAREER_ADVICE"
        }
        response = self.client.post('/api/community/posts/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_post_detail_view_fetches_nested_data(self):
        """Test that the GET API fetches the post, author, and comments correctly"""
        # Create a post and a comment first
        self.client.force_authenticate(user=self.student)
        post = Post.objects.create(
            author=self.alumni,
            post_type='GENERAL',
            title='Test Detail Post',
            content='Checking nested serializers'
        )
        
        # We manually create a comment since the comment API isn't built yet
        from .models import Comment
        Comment.objects.create(
            post=post,
            author=self.student,
            content="This is a test comment"
        )
        
        response = self.client.get(f'/api/community/posts/{post.id}/')
        
        # 1. Check Success Status
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 2. Check Core Post Data
        self.assertEqual(response.data['title'], 'Test Detail Post')
        self.assertEqual(response.data['post_type'], 'GENERAL')
        
        # 3. Check Nested Author Data
        self.assertEqual(response.data['author']['role'], 'ALUMNI')
        
        # 4. Check Nested Comment Data
        self.assertEqual(len(response.data['comments']), 1)
        self.assertEqual(response.data['comments'][0]['content'], 'This is a test comment')
        self.assertEqual(response.data['comments'][0]['author']['role'], 'STUDENT')
