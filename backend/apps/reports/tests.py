from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import User
from apps.community.models import Post, Comment
from apps.notifications.models import Notification
from .models import Report

class ReportAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Users
        self.student = User.objects.create_user(
            email='reporter@nirmauni.ac.in', password='password123', role='STUDENT'
        )
        self.alumni = User.objects.create_user(
            email='alumni@nirmauni.ac.in', password='password123', role='ALUMNI'
        )
        self.placement_cell = User.objects.create_user(
            email='placement@nirmauni.ac.in', password='password123', role='PLACEMENT_CELL'
        )
        self.admin = User.objects.create_user(
            email='admin@nirmauni.ac.in', password='password123', role='ADMIN'
        )

        # Dummy Post and Comment
        self.post = Post.objects.create(
            author=self.alumni,
            post_type='GENERAL',
            title='Spammy Post',
            content='Buy cheap crypto here'
        )
        self.comment = Comment.objects.create(
            author=self.alumni,
            post=self.post,
            content='Offensive text'
        )

    def test_submit_report_unauthenticated_forbidden(self):
        """Unauthenticated request must be rejected"""
        response = self.client.post('/api/reports/', {
            "target_type": "POST",
            "target_id": self.post.id,
            "reason": "SPAM"
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_submit_report_on_post_success(self):
        """Student successfully reports a spam post"""
        self.client.force_authenticate(user=self.student)
        payload = {
            "target_type": "POST",
            "target_id": self.post.id,
            "reason": "SPAM",
            "description": "Suspicious commercial advertisement"
        }
        response = self.client.post('/api/reports/', payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['message'], "Report submitted successfully.")
        self.assertEqual(response.data['report']['target_type'], "POST")
        self.assertEqual(response.data['report']['target_id'], self.post.id)
        self.assertEqual(response.data['report']['reason'], "SPAM")
        self.assertEqual(response.data['report']['status'], "PENDING")

        self.assertTrue(Report.objects.filter(reported_by=self.student, target_id=self.post.id).exists())

    def test_submit_report_on_comment_success(self):
        """Alumni successfully reports an abusive comment"""
        self.client.force_authenticate(user=self.alumni)
        payload = {
            "target_type": "COMMENT",
            "target_id": self.comment.id,
            "reason": "HARASSMENT",
            "description": "Insulting language in comment"
        }
        response = self.client.post('/api/reports/', payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['report']['target_type'], "COMMENT")
        self.assertEqual(response.data['report']['target_id'], self.comment.id)
        self.assertTrue(Report.objects.filter(reported_by=self.alumni, target_id=self.comment.id).exists())

    def test_submit_report_non_existent_post_404(self):
        """Reporting a non-existent post returns 404"""
        self.client.force_authenticate(user=self.student)
        payload = {
            "target_type": "POST",
            "target_id": 99999,
            "reason": "SPAM"
        }
        response = self.client.post('/api/reports/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_submit_report_non_existent_comment_404(self):
        """Reporting a non-existent comment returns 404"""
        self.client.force_authenticate(user=self.student)
        payload = {
            "target_type": "COMMENT",
            "target_id": 99999,
            "reason": "HARASSMENT"
        }
        response = self.client.post('/api/reports/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_submit_report_duplicate_pending_rejected(self):
        """Submitting a duplicate pending report on the same target is rejected"""
        self.client.force_authenticate(user=self.student)
        Report.objects.create(
            reported_by=self.student,
            target_type='POST',
            target_id=self.post.id,
            reason='SPAM',
            status='PENDING'
        )

        payload = {
            "target_type": "POST",
            "target_id": self.post.id,
            "reason": "SPAM"
        }
        response = self.client.post('/api/reports/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_reports_as_student_forbidden(self):
        """Students cannot view the moderation queue"""
        self.client.force_authenticate(user=self.student)
        response = self.client.get('/api/reports/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_reports_as_alumni_forbidden(self):
        """Alumni cannot view the moderation queue"""
        self.client.force_authenticate(user=self.alumni)
        response = self.client.get('/api/reports/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_reports_as_placement_cell_success(self):
        """Placement Cell can view moderation reports"""
        Report.objects.create(
            reported_by=self.student, target_type='POST', target_id=self.post.id, reason='SPAM', status='PENDING'
        )
        self.client.force_authenticate(user=self.placement_cell)
        response = self.client.get('/api/reports/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['target_preview']['title'], 'Spammy Post')

    def test_list_reports_filter_by_status(self):
        """Filtering reports by status"""
        Report.objects.create(
            reported_by=self.student, target_type='POST', target_id=self.post.id, reason='SPAM', status='PENDING'
        )
        Report.objects.create(
            reported_by=self.alumni, target_type='COMMENT', target_id=self.comment.id, reason='HARASSMENT', status='RESOLVED'
        )

        self.client.force_authenticate(user=self.placement_cell)
        response = self.client.get('/api/reports/?status=PENDING')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for item in response.data['results']:
            self.assertEqual(item['status'], 'PENDING')

    def test_resolve_report_as_placement_cell_success(self):
        """Placement cell resolves a report and marks status as RESOLVED"""
        report = Report.objects.create(
            reported_by=self.student, target_type='POST', target_id=self.post.id, reason='SPAM', status='PENDING'
        )
        self.client.force_authenticate(user=self.placement_cell)

        payload = {"status": "RESOLVED"}
        response = self.client.patch(f'/api/reports/{report.id}/', payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['report']['status'], 'RESOLVED')
        self.assertIsNotNone(response.data['report']['reviewed_at'])
        self.assertEqual(response.data['report']['reviewed_by']['email'], self.placement_cell.email)

        report.refresh_from_db()
        self.assertEqual(report.status, 'RESOLVED')
        self.assertEqual(report.reviewed_by, self.placement_cell)

    def test_resolve_report_with_delete_target_action(self):
        """Resolving a report with action_taken='DELETE_TARGET' deletes the reported post"""
        report = Report.objects.create(
            reported_by=self.student, target_type='POST', target_id=self.post.id, reason='SPAM', status='PENDING'
        )
        self.client.force_authenticate(user=self.placement_cell)

        payload = {
            "status": "RESOLVED",
            "action_taken": "DELETE_TARGET"
        }
        response = self.client.patch(f'/api/reports/{report.id}/', payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check target post was deleted from database
        self.assertFalse(Post.objects.filter(id=self.post.id).exists())

    def test_resolve_report_triggers_notification_to_reporter(self):
        """Resolving a report automatically triggers an in-app notification to the reporting user"""
        report = Report.objects.create(
            reported_by=self.student, target_type='POST', target_id=self.post.id, reason='SPAM', status='PENDING'
        )
        self.client.force_authenticate(user=self.admin)

        payload = {"status": "RESOLVED"}
        self.client.patch(f'/api/reports/{report.id}/', payload, format='json')

        # Check notification table
        notif = Notification.objects.filter(recipient=self.student, notification_type='REPORT_UPDATE').first()
        self.assertIsNotNone(notif)
        self.assertIn("resolved", notif.message.lower())
        self.assertEqual(notif.reference_id, report.id)

    def test_resolve_report_as_student_forbidden(self):
        """Student attempting to resolve a report is blocked with 403"""
        report = Report.objects.create(
            reported_by=self.student, target_type='POST', target_id=self.post.id, reason='SPAM', status='PENDING'
        )
        self.client.force_authenticate(user=self.student)

        payload = {"status": "RESOLVED"}
        response = self.client.patch(f'/api/reports/{report.id}/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
