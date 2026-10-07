from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import User
from apps.companies.models import Company
from .models import Post, Tag, Comment, PostTag

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
        
        # 4. Check Comments Removed from Payload (Optimized)
        self.assertNotIn('comments', response.data)
        self.assertEqual(response.data['interactions']['comments_count'], 1)

    def test_create_comment_success(self):
        """Test that an authenticated user can create a comment and it returns the serialized comment object"""
        self.client.force_authenticate(user=self.alumni)
        post = Post.objects.create(
            author=self.student,
            post_type='GENERAL',
            title='Test Post for Comment',
            content='Testing comments'
        )
        
        payload = {"content": "This is a brand new comment!"}
        response = self.client.post(f'/api/community/posts/{post.id}/comments/', payload, format='json')
        
        # 1. Verify Status Code
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # 2. Verify Database Storage
        self.assertTrue(Comment.objects.filter(content="This is a brand new comment!").exists())
        
        # 3. Verify UI Rendering Optimization (Returns nested author info)
        self.assertEqual(response.data['comment']['content'], "This is a brand new comment!")
        self.assertEqual(response.data['comment']['author']['role'], "ALUMNI")

    def test_create_comment_on_ghost_post(self):
        """Test the safety check: attempting to comment on a deleted post returns 404"""
        self.client.force_authenticate(user=self.alumni)
        
        # Post ID 9999 does not exist
        payload = {"content": "This should fail"}
        response = self.client.post('/api/community/posts/9999/comments/', payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_paginated_comments(self):
        """Test fetching comments with pagination"""
        self.client.force_authenticate(user=self.student)
        post = Post.objects.create(
            author=self.alumni, post_type='GENERAL', title='Post for Paginated Comments', content='Testing'
        )
        
        # Create 15 comments
        for i in range(15):
            Comment.objects.create(post=post, author=self.student, content=f"Comment {i}")
            
        # Test Limit = 10
        response = self.client.get(f'/api/community/posts/{post.id}/comments/?limit=10')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify Pagination format
        self.assertEqual(response.data['count'], 15)
        self.assertIsNotNone(response.data['next'])
        self.assertIsNone(response.data['previous'])
        self.assertEqual(len(response.data['results']), 10)
        
        # Test offset = 10 (Page 2)
        response_page2 = self.client.get(f'/api/community/posts/{post.id}/comments/?limit=10&offset=10')
        self.assertEqual(response_page2.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response_page2.data['results']), 5)


    def test_toggle_like(self):
        """Test liking and unliking a post"""
        self.client.force_authenticate(user=self.student)
        post = Post.objects.create(author=self.alumni, post_type='GENERAL', title='Like Test', content='Test')
        
        # 1. Like the post (First Click)
        response1 = self.client.post(f'/api/community/posts/{post.id}/toggle-like/')
        self.assertEqual(response1.status_code, status.HTTP_200_OK)
        self.assertTrue(response1.data['is_liked_by_me'])
        self.assertEqual(response1.data['likes_count'], 1)
        self.assertEqual(response1.data['message'], "Post liked.")
        
        # 2. Unlike the post (Second Click)
        response2 = self.client.post(f'/api/community/posts/{post.id}/toggle-like/')
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        self.assertFalse(response2.data['is_liked_by_me'])
        self.assertEqual(response2.data['likes_count'], 0)
        self.assertEqual(response2.data['message'], "Post unliked.")

    def test_delete_post_success(self):
        """Test that an author can delete their own post"""
        self.client.force_authenticate(user=self.alumni)
        post = Post.objects.create(author=self.alumni, post_type='GENERAL', title='Delete Me', content='Test')
        
        response = self.client.delete(f'/api/community/posts/{post.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], "Post successfully deleted.")
        self.assertFalse(Post.objects.filter(id=post.id).exists())

    def test_delete_post_forbidden(self):
        """Test that a user cannot delete someone else's post"""
        # Create a post as Alumni
        post = Post.objects.create(author=self.alumni, post_type='GENERAL', title='Not Yours', content='Test')
        
        # Login as a different user (Student)
        self.client.force_authenticate(user=self.student)
        
        # Try to delete the alumni's post
        response = self.client.delete(f'/api/community/posts/{post.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data['error'], "You do not have permission to delete this post.")
        
        # Verify it still exists in the database
        self.assertTrue(Post.objects.filter(id=post.id).exists())

    def test_update_post_success(self):
        """Test that an author can update their own post using PATCH"""
        self.client.force_authenticate(user=self.alumni)
        post = Post.objects.create(author=self.alumni, post_type='GENERAL', title='Old Title', content='Old Content')
        
        # Add an initial tag
        tag1 = Tag.objects.create(name='Initial Tag')
        PostTag.objects.create(post=post, tag=tag1)
        
        payload = {
            "title": "New Title",
            "content": "New Content",
            "new_tags": ["Brand New Tag"]
        }
        
        response = self.client.patch(f'/api/community/posts/{post.id}/', payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['post']['title'], "New Title")
        self.assertEqual(response.data['post']['content'], "New Content")
        self.assertIn("Brand New Tag", response.data['post']['tags'])
        self.assertNotIn("Initial Tag", response.data['post']['tags']) # Overwrite strategy works

    def test_update_post_forbidden(self):
        """Test that a user cannot update someone else's post"""
        post = Post.objects.create(author=self.alumni, post_type='GENERAL', title='Not Yours', content='Test')
        self.client.force_authenticate(user=self.student)
        
        payload = {"title": "Hacked Title"}
        response = self.client.patch(f'/api/community/posts/{post.id}/', payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Verify db wasn't changed
        post.refresh_from_db()
        self.assertEqual(post.title, "Not Yours")

    def test_update_comment_success(self):
        """Test that an author can update their own comment"""
        self.client.force_authenticate(user=self.student)
        post = Post.objects.create(author=self.alumni, post_type='GENERAL', title='Test', content='Test')
        comment = Comment.objects.create(post=post, author=self.student, content='Original Text')
        
        response = self.client.patch(f'/api/community/comments/{comment.id}/', {"content": "Fixed Text"}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['content'], "Fixed Text")

    def test_update_comment_forbidden(self):
        """Test that a user cannot update someone else's comment"""
        self.client.force_authenticate(user=self.student)
        post = Post.objects.create(author=self.alumni, post_type='GENERAL', title='Test', content='Test')
        # Comment belongs to Alumni
        comment = Comment.objects.create(post=post, author=self.alumni, content='Original Text')
        
        response = self.client.patch(f'/api/community/comments/{comment.id}/', {"content": "Hacked Text"}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        comment.refresh_from_db()
        self.assertEqual(comment.content, "Original Text")

    def test_delete_comment_success(self):
        """Test that an author can delete their own comment"""
        self.client.force_authenticate(user=self.alumni)
        post = Post.objects.create(author=self.alumni, post_type='GENERAL', title='Test', content='Test')
        comment = Comment.objects.create(post=post, author=self.alumni, content='To Delete')
        
        response = self.client.delete(f'/api/community/comments/{comment.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Comment.objects.filter(id=comment.id).exists())

    def test_delete_comment_forbidden(self):
        """Test that a user cannot delete someone else's comment"""
        self.client.force_authenticate(user=self.student)
        post = Post.objects.create(author=self.alumni, post_type='GENERAL', title='Test', content='Test')
        comment = Comment.objects.create(post=post, author=self.alumni, content='Not Yours')
        
        response = self.client.delete(f'/api/community/comments/{comment.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Comment.objects.filter(id=comment.id).exists())

    def test_toggle_bookmark(self):
        """Test bookmarking and unbookmarking a post"""
        self.client.force_authenticate(user=self.student)
        post = Post.objects.create(author=self.alumni, post_type='GENERAL', title='Bookmark Test', content='Test')
        
        # 1. Save the post
        response1 = self.client.post(f'/api/community/posts/{post.id}/toggle-bookmark/')
        self.assertEqual(response1.status_code, status.HTTP_200_OK)
        self.assertTrue(response1.data['is_bookmarked_by_me'])
        
        # 2. Unsave the post
        response2 = self.client.post(f'/api/community/posts/{post.id}/toggle-bookmark/')
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        self.assertFalse(response2.data['is_bookmarked_by_me'])

    def test_get_bookmarks(self):
        """Test fetching the user's bookmarked posts"""
        self.client.force_authenticate(user=self.student)
        post1 = Post.objects.create(author=self.alumni, post_type='GENERAL', title='Post 1', content='Test')
        post2 = Post.objects.create(author=self.alumni, post_type='GENERAL', title='Post 2', content='Test')
        
        # Save post 2
        self.client.post(f'/api/community/posts/{post2.id}/toggle-bookmark/')
        
        response = self.client.get('/api/community/bookmarks/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['title'], 'Post 2')

    def test_feed_search(self):
        """Test the POST /feed/search/ advanced search endpoint"""
        self.client.force_authenticate(user=self.student)
        
        # Create some posts to test search logic
        Post.objects.create(author=self.alumni, post_type='GENERAL', title='React Developer Guide', content='Learn react Native')
        Post.objects.create(author=self.alumni, post_type='GENERAL', title='Python Developer Guide', content='Learn Django')
        Post.objects.create(author=self.alumni, post_type='GENERAL', title='React and Python Guide', content='Learn both')
        Post.objects.create(author=self.alumni, post_type='GENERAL', title='Nothing Guide', content='Empty')
        
        # 1. Test single search word
        response1 = self.client.post('/api/community/feed/search/', {"search_terms": ["Nothing"]}, format='json')
        self.assertEqual(response1.status_code, status.HTTP_200_OK)
        self.assertEqual(response1.data['count'], 1)
        self.assertEqual(response1.data['results'][0]['title'], 'Nothing Guide')
        
        # 2. Test multiple search words (AND logic)
        response2 = self.client.post('/api/community/feed/search/', {"search_terms": ["react", "python"]}, format='json')
        self.assertEqual(response2.data['count'], 1)
        self.assertEqual(response2.data['results'][0]['title'], 'React and Python Guide')
