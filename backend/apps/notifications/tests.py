from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.utils import timezone
from apps.accounts.models import User
from .models import Notification

class NotificationAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.user1 = User.objects.create_user(
            email='student1@nirmauni.ac.in', password='password123', role='STUDENT'
        )
        self.user2 = User.objects.create_user(
            email='student2@nirmauni.ac.in', password='password123', role='STUDENT'
        )

        # Create sample notifications for User 1
        self.notif1 = Notification.objects.create(
            recipient=self.user1,
            notification_type='POST_LIKE',
            title='Someone liked your post',
            message='Alumni liked your post about interviews',
            reference_type='POST',
            reference_id=101,
            is_read=False
        )
        self.notif2 = Notification.objects.create(
            recipient=self.user1,
            notification_type='NEW_OPPORTUNITY',
            title='New Drive Posted',
            message='Google is hiring Software Engineers',
            reference_type='OPPORTUNITY',
            reference_id=202,
            is_read=False
        )
        self.notif3 = Notification.objects.create(
            recipient=self.user1,
            notification_type='NEW_ANNOUNCEMENT',
            title='Placement Session Tomorrow',
            message='Compulsory attendance for all final years',
            reference_type='ANNOUNCEMENT',
            reference_id=303,
            is_read=True,
            read_at=timezone.now()
        )

        # Create sample notification for User 2 (Isolation Check)
        self.notif_user2 = Notification.objects.create(
            recipient=self.user2,
            notification_type='POST_COMMENT',
            title='New comment',
            message='Someone commented on your post',
            reference_type='COMMENT',
            reference_id=404,
            is_read=False
        )

    def test_notification_list_unauthenticated_forbidden(self):
        """Test that unauthenticated requests are rejected"""
        response = self.client.get('/api/notifications/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_notification_list_user_isolation(self):
        """Test that a user only sees their own notifications"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/api/notifications/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 3)
        self.assertEqual(response.data['unread_count'], 2)

        # Ensure user2's notification is not present
        received_ids = [item['id'] for item in response.data['results']]
        self.assertNotIn(self.notif_user2.id, received_ids)
        self.assertIn(self.notif1.id, received_ids)
        self.assertIn(self.notif2.id, received_ids)
        self.assertIn(self.notif3.id, received_ids)

    def test_notification_list_filter_is_read_false(self):
        """Test filtering by is_read=false returns only unread notifications"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/api/notifications/?is_read=false')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)
        for item in response.data['results']:
            self.assertFalse(item['is_read'])

    def test_notification_list_filter_is_read_true(self):
        """Test filtering by is_read=true returns only read notifications"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/api/notifications/?is_read=true')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['id'], self.notif3.id)
        self.assertTrue(response.data['results'][0]['is_read'])

    def test_notification_list_filter_by_type(self):
        """Test filtering by notification_type"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/api/notifications/?notification_type=NEW_OPPORTUNITY')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['notification_type'], 'NEW_OPPORTUNITY')

    def test_notification_list_pagination(self):
        """Test limit and offset pagination"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/api/notifications/?limit=2&offset=0')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 3)
        self.assertEqual(len(response.data['results']), 2)
        self.assertIsNotNone(response.data['next'])

        response_page2 = self.client.get('/api/notifications/?limit=2&offset=2')
        self.assertEqual(response_page2.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response_page2.data['results']), 1)

    def test_mark_notification_read_success(self):
        """Test marking a single notification as read"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.patch(f'/api/notifications/{self.notif1.id}/read/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], "Notification marked as read.")
        self.assertTrue(response.data['notification']['is_read'])
        self.assertIsNotNone(response.data['notification']['read_at'])

        self.notif1.refresh_from_db()
        self.assertTrue(self.notif1.is_read)
        self.assertIsNotNone(self.notif1.read_at)

    def test_mark_notification_read_already_read_idempotent(self):
        """Test that marking an already read notification is idempotent and succeeds"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.patch(f'/api/notifications/{self.notif3.id}/read/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['notification']['is_read'])

    def test_mark_notification_read_other_user_forbidden(self):
        """Test that user cannot mark another user's notification as read"""
        self.client.force_authenticate(user=self.user1)
        # Attempt to mark User 2's notification
        response = self.client.patch(f'/api/notifications/{self.notif_user2.id}/read/')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("error", response.data)

        self.notif_user2.refresh_from_db()
        self.assertFalse(self.notif_user2.is_read)

    def test_mark_notification_read_non_existent_404(self):
        """Test 404 for non-existent notification ID"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.patch('/api/notifications/99999/read/')

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_mark_all_notifications_read(self):
        """Test bulk marking all notifications as read for current user"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.post('/api/notifications/read-all/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['updated_count'], 2)

        # Check DB state
        unread_count = Notification.objects.filter(recipient=self.user1, is_read=False).count()
        self.assertEqual(unread_count, 0)

        # User 2's notification should still be unread
        self.notif_user2.refresh_from_db()
        self.assertFalse(self.notif_user2.is_read)
