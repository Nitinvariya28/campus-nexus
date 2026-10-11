from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.files.storage import default_storage
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import User
from .models import Resume

class ResumeAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.user1 = User.objects.create_user(
            email='student1@nirmauni.ac.in', password='password123', role='STUDENT'
        )
        self.user2 = User.objects.create_user(
            email='student2@nirmauni.ac.in', password='password123', role='STUDENT'
        )

        # Sample PDF content
        self.dummy_pdf = SimpleUploadedFile(
            "sample_resume.pdf",
            b"%PDF-1.4 dummy pdf content for testing resume storage",
            content_type="application/pdf"
        )
        self.dummy_docx = SimpleUploadedFile(
            "sample_resume.docx",
            b"dummy docx binary content for testing",
            content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )

    def tearDown(self):
        # Clean up any files stored during test run
        for resume in Resume.objects.all():
            if default_storage.exists(resume.file):
                default_storage.delete(resume.file)

    def test_upload_resume_unauthenticated_forbidden(self):
        """Unauthenticated request must be rejected"""
        response = self.client.post('/api/resumes/', {'file': self.dummy_pdf}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_upload_resume_pdf_success(self):
        """Upload a valid PDF resume"""
        self.client.force_authenticate(user=self.user1)
        payload = {
            'title': 'SWE Resume 2026',
            'file': self.dummy_pdf,
        }
        response = self.client.post('/api/resumes/', payload, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['resume']['title'], 'SWE Resume 2026')
        self.assertEqual(response.data['resume']['file_type'], 'PDF')
        self.assertTrue(response.data['resume']['is_primary']) # Auto-primary for first resume
        self.assertIn('/media/resumes/', response.data['resume']['file_url'])

        self.assertTrue(Resume.objects.filter(user=self.user1, title='SWE Resume 2026').exists())

    def test_upload_resume_docx_success(self):
        """Upload a valid DOCX resume"""
        self.client.force_authenticate(user=self.user1)
        payload = {
            'title': 'Consulting Resume',
            'file': self.dummy_docx,
        }
        response = self.client.post('/api/resumes/', payload, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['resume']['file_type'], 'DOCX')

    def test_upload_resume_invalid_extension_rejected(self):
        """Uploading non-PDF/DOCX file must return 400"""
        self.client.force_authenticate(user=self.user1)
        bad_file = SimpleUploadedFile("script.sh", b"echo hello", content_type="text/plain")
        payload = {'file': bad_file}
        response = self.client.post('/api/resumes/', payload, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('file', response.data)

    def test_upload_resume_file_size_exceeded_rejected(self):
        """Uploading file greater than 5 MB is rejected"""
        self.client.force_authenticate(user=self.user1)
        huge_content = b"0" * (6 * 1024 * 1024) # 6 MB
        huge_file = SimpleUploadedFile("huge.pdf", huge_content, content_type="application/pdf")
        payload = {'file': huge_file}
        response = self.client.post('/api/resumes/', payload, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_upload_second_resume_as_primary_swaps_flag(self):
        """Uploading a second resume with is_primary=True swaps the primary flag"""
        self.client.force_authenticate(user=self.user1)
        # Upload resume 1
        r1_file = SimpleUploadedFile("r1.pdf", b"%PDF content", content_type="application/pdf")
        self.client.post('/api/resumes/', {'title': 'Resume 1', 'file': r1_file}, format='multipart')

        # Upload resume 2 with is_primary=True
        r2_file = SimpleUploadedFile("r2.pdf", b"%PDF content", content_type="application/pdf")
        self.client.post('/api/resumes/', {'title': 'Resume 2', 'file': r2_file, 'is_primary': 'true'}, format='multipart')

        r1 = Resume.objects.get(user=self.user1, title='Resume 1')
        r2 = Resume.objects.get(user=self.user1, title='Resume 2')

        self.assertFalse(r1.is_primary)
        self.assertTrue(r2.is_primary)

    def test_list_resumes_user_isolation(self):
        """User only sees their own resumes"""
        r1 = Resume.objects.create(user=self.user1, title="User1 Resume", file="resumes/u1.pdf", file_type="PDF", is_primary=True)
        r2 = Resume.objects.create(user=self.user2, title="User2 Resume", file="resumes/u2.pdf", file_type="PDF", is_primary=True)

        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/api/resumes/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [item['id'] for item in response.data]
        self.assertIn(r1.id, ids)
        self.assertNotIn(r2.id, ids)

    def test_set_primary_resume_success(self):
        """Switch default primary resume"""
        self.client.force_authenticate(user=self.user1)
        r1 = Resume.objects.create(user=self.user1, title="Resume 1", file="resumes/r1.pdf", file_type="PDF", is_primary=True)
        r2 = Resume.objects.create(user=self.user1, title="Resume 2", file="resumes/r2.pdf", file_type="PDF", is_primary=False)

        response = self.client.patch(f'/api/resumes/{r2.id}/set-primary/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], "Resume set as default primary.")

        r1.refresh_from_db()
        r2.refresh_from_db()
        self.assertFalse(r1.is_primary)
        self.assertTrue(r2.is_primary)

    def test_set_primary_resume_other_user_forbidden(self):
        """Cannot set another user's resume as primary"""
        r_user2 = Resume.objects.create(user=self.user2, title="U2 Resume", file="resumes/u2.pdf", file_type="PDF", is_primary=True)

        self.client.force_authenticate(user=self.user1)
        response = self.client.patch(f'/api/resumes/{r_user2.id}/set-primary/')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_resume_success(self):
        """Author can delete their resume"""
        self.client.force_authenticate(user=self.user1)
        resume = Resume.objects.create(user=self.user1, title="To Delete", file="resumes/delete.pdf", file_type="PDF", is_primary=False)

        response = self.client.delete(f'/api/resumes/{resume.id}/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Resume.objects.filter(id=resume.id).exists())

    def test_delete_primary_resume_promotes_next(self):
        """Deleting the primary resume promotes the remaining resume to primary"""
        self.client.force_authenticate(user=self.user1)
        r1 = Resume.objects.create(user=self.user1, title="Primary Resume", file="resumes/r1.pdf", file_type="PDF", is_primary=True)
        r2 = Resume.objects.create(user=self.user1, title="Backup Resume", file="resumes/r2.pdf", file_type="PDF", is_primary=False)

        response = self.client.delete(f'/api/resumes/{r1.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        r2.refresh_from_db()
        self.assertTrue(r2.is_primary)

    def test_delete_resume_other_user_forbidden(self):
        """Cannot delete someone else's resume"""
        r_user2 = Resume.objects.create(user=self.user2, title="U2 Resume", file="resumes/u2.pdf", file_type="PDF")

        self.client.force_authenticate(user=self.user1)
        response = self.client.delete(f'/api/resumes/{r_user2.id}/')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Resume.objects.filter(id=r_user2.id).exists())

    def test_get_single_resume_detail(self):
        """Fetch single resume detail"""
        self.client.force_authenticate(user=self.user1)
        resume = Resume.objects.create(user=self.user1, title="SWE Resume", file="resumes/swe.pdf", file_type="PDF", is_primary=True)

        response = self.client.get(f'/api/resumes/{resume.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], "SWE Resume")
        self.assertEqual(response.data['file_type'], "PDF")
