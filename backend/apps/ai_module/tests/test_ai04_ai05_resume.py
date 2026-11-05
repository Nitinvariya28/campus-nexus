import io
from unittest.mock import patch, MagicMock
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.ai_module.resume_processing.extractor import (
    clean_and_normalize_text,
    extract_skills_from_text,
    segment_resume_sections,
)
from apps.ai_module.services.ats_service import calculate_ats_score
from apps.ai_module.services.suggestion_service import (
    generate_resume_suggestions,
    _build_rule_based_suggestions,
)
from apps.resumes.models import Resume, ResumeAnalysis

User = get_user_model()

SAMPLE_RESUME_TEXT = """
Alex Morgan
alex.morgan@email.com | +1 555-0199 | San Francisco, CA

PROFESSIONAL SUMMARY
Results-driven Full Stack Software Engineer with 3+ years of experience designing and deploying scalable web applications using Python, Django, and React. Passionate about cloud architectures and API development.

TECHNICAL SKILLS
- Languages: Python, JavaScript, TypeScript, C++, SQL
- Frameworks & Libraries: Django, Django REST Framework, React, Redux, Node.js
- Databases & Cloud: PostgreSQL, MySQL, Redis, AWS, Docker
- Developer Tools: Git, GitHub Actions, CI/CD, Linux

WORK EXPERIENCE
Senior Backend Engineer | TechCorp Inc. (2023 - Present)
- Architected and delivered 18 high-throughput microservices using Django REST Framework and MySQL.
- Optimized database indexing and Redis caching, cutting average query latency by 45%.
- Mentored 4 junior developers in clean code practices and test-driven development.

Software Engineer Intern | Innovate Labs (2022 - 2023)
- Worked on backend APIs for user management and reporting dashboard.
- Integrated third-party payment gateways and automated email notifications.

KEY PROJECTS
Alumni Management Platform
- Built responsive web platform using React and Django REST Framework.
- Containerized application services with Docker and set up automated CI/CD pipeline on AWS.

EDUCATION
Bachelor of Technology in Computer Science
State Engineering University | GPA: 3.8 / 4.0 | Graduated 2022
"""

SAMPLE_JD_STRONG = """
We are looking for a Software Engineer with 2+ years of experience in Python, Django, REST API, MySQL, and Docker.
The ideal candidate will have experience building cloud-native backend services, optimizing database performance,
and collaborating with cross-functional teams. Knowledge of React and Redis is a strong plus.
Must have a Bachelor's degree in Computer Science or a related engineering field.
"""

SAMPLE_JD_WEAK = """
Seeking an iOS Swift Mobile Developer with 5+ years of experience in UIKit, SwiftUI, Objective-C, and Xcode.
Must have published at least 3 apps to the Apple App Store, with deep expertise in CoreData, Metal, and ARKit.
"""


class ResumeExtractionAndProcessingTests(TestCase):
    """Tests unit logic of extractor, cleaner, section parser, and skill matcher."""

    def test_clean_and_normalize_text(self):
        dirty = "• First bullet point\n\r\n◦ Second bullet point\n\n\n\n- Third line    with   spaces"
        cleaned = clean_and_normalize_text(dirty)
        self.assertIn("- First bullet point", cleaned)
        self.assertIn("- Second bullet point", cleaned)
        self.assertNotIn("•", cleaned)
        self.assertNotIn("◦", cleaned)
        self.assertNotIn("   ", cleaned)

    def test_extract_skills_from_text(self):
        text = "I have experience with Python, Django, React, AWS, Docker, and C++."
        skills = extract_skills_from_text(text)
        self.assertIn("Python", skills)
        self.assertIn("Django", skills)
        self.assertIn("React", skills)
        self.assertIn("AWS", skills)
        self.assertIn("Docker", skills)
        self.assertIn("C++", skills)

    def test_segment_resume_sections(self):
        sections = segment_resume_sections(SAMPLE_RESUME_TEXT)
        self.assertTrue(len(sections["summary"]) > 0)
        self.assertTrue(len(sections["skills"]) > 0)
        self.assertTrue(len(sections["experience"]) > 0)
        self.assertTrue(len(sections["projects"]) > 0)
        self.assertTrue(len(sections["education"]) > 0)
        self.assertIn("TechCorp", sections["experience"])
        self.assertIn("Bachelor of Technology", sections["education"])


class AtsScoringAndSuggestionServiceTests(TestCase):
    """Tests ATS multi-dimensional scoring and AI suggestions generation."""

    def test_ats_score_strong_match(self):
        res = calculate_ats_score(
            resume_text=SAMPLE_RESUME_TEXT,
            job_description=SAMPLE_JD_STRONG,
            page_count=2,
        )
        self.assertGreaterEqual(res["overall_score"], 65.0)
        self.assertIn(res["rating"], ["STRONG_MATCH", "GOOD_MATCH"])
        self.assertIn("Python", res["matched_skills"])
        self.assertIn("Django", res["matched_skills"])

        dims = res["dimensions"]
        self.assertEqual(dims["semantic_similarity"]["weight"], 0.40)
        self.assertEqual(dims["skills_match"]["weight"], 0.30)
        self.assertEqual(dims["experience_match"]["weight"], 0.15)
        self.assertEqual(dims["education_match"]["weight"], 0.10)
        self.assertEqual(dims["formatting_parseability"]["weight"], 0.05)

    def test_ats_score_weak_match(self):
        res = calculate_ats_score(
            resume_text=SAMPLE_RESUME_TEXT,
            job_description=SAMPLE_JD_WEAK,
            page_count=1,
        )
        self.assertLess(res["overall_score"], 65.0)
        self.assertIn(res["rating"], ["MODERATE_MATCH", "LOW_MATCH"])
        self.assertIn("Swift", res["missing_skills"])

    def test_rule_based_suggestions_fallback(self):
        sections = segment_resume_sections(SAMPLE_RESUME_TEXT)
        sug = _build_rule_based_suggestions(
            parsed_sections=sections,
            matched_skills=["Python", "Django", "React"],
            missing_skills=["Kubernetes", "GraphQL"],
        )
        self.assertIn("summary_recommendation", sug)
        self.assertIn("missing_keywords_priority", sug)
        self.assertIn("bullet_point_improvements", sug)
        self.assertIn("strengths", sug)
        self.assertIn("Kubernetes", sug["missing_keywords_priority"]["high"])
        self.assertTrue(len(sug["bullet_point_improvements"]) >= 1)


class ResumeApiViewIntegrationTests(TestCase):
    """Tests PrimaryResumeView and ResumeAnalyzeView HTTP endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="candidate@test.com",
            password="securePassword123!",
            first_name="Candidate",
            last_name="Test",
        )

    def test_primary_resume_endpoint_unauthenticated(self):
        response = self.client.get("/api/ai/resume/primary/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_primary_resume_endpoint_empty(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/ai/resume/primary/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["has_primary_resume"])
        self.assertIsNone(response.data["resume"])

    def test_primary_resume_endpoint_with_active_resume(self):
        self.client.force_authenticate(user=self.user)
        saved_file = default_storage.save(
            f"resumes/user_{self.user.id}/test_resume.pdf",
            ContentFile(b"Sample PDF content"),
        )
        Resume.objects.create(
            user=self.user,
            title="Alex_Morgan_Resume.pdf",
            file=saved_file,
            file_type="PDF",
            is_primary=True,
        )

        response = self.client.get("/api/ai/resume/primary/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["has_primary_resume"])
        self.assertEqual(response.data["resume"]["title"], "Alex_Morgan_Resume.pdf")
        self.assertEqual(response.data["resume"]["file_type"], "PDF")

    def test_resume_analyze_unauthenticated(self):
        response = self.client.post("/api/ai/resume/analyze/", {"job_description": SAMPLE_JD_STRONG})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_resume_analyze_validation_error_short_jd(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post("/api/ai/resume/analyze/", {"job_description": "Too short"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("job_description", response.data)

    def test_resume_analyze_no_primary_resume_found(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/ai/resume/analyze/",
            {"job_description": SAMPLE_JD_STRONG, "use_primary": True},
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("No primary resume found", response.data["error"])

    @patch("apps.ai_module.views.resume_views.extract_text_from_file")
    def test_resume_analyze_with_primary_resume_success(self, mock_extract):
        mock_extract.return_value = {
            "raw_text": SAMPLE_RESUME_TEXT,
            "clean_text": SAMPLE_RESUME_TEXT,
            "page_count": 2,
            "file_type": "PDF",
        }

        self.client.force_authenticate(user=self.user)
        saved_file = default_storage.save(
            f"resumes/user_{self.user.id}/primary_resume.pdf",
            ContentFile(b"%PDF-1.4 Mock PDF Content"),
        )
        primary_resume = Resume.objects.create(
            user=self.user,
            title="Primary_Resume.pdf",
            file=saved_file,
            file_type="PDF",
            is_primary=True,
        )

        response = self.client.post(
            "/api/ai/resume/analyze/",
            {
                "job_description": SAMPLE_JD_STRONG,
                "use_primary": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "SUCCESS")
        self.assertEqual(response.data["resume_info"]["resume_id"], primary_resume.id)
        self.assertTrue(response.data["resume_info"]["is_primary"])

        # Validate Left ATS Score structure
        ats = response.data["ats_score"]
        self.assertIn("overall_score", ats)
        self.assertIn("rating", ats)
        self.assertIn("dimensions", ats)
        self.assertIn("semantic_similarity", ats["dimensions"])
        self.assertIn("skills_match", ats["dimensions"])
        self.assertIn("matched_skills", ats)
        self.assertIn("missing_skills", ats)

        # Validate Right AI Suggestions structure
        sug = response.data["ai_suggestions"]
        self.assertIn("summary_recommendation", sug)
        self.assertIn("missing_keywords_priority", sug)
        self.assertIn("bullet_point_improvements", sug)
        self.assertIn("strengths", sug)

        # Validate Table 28 ResumeAnalysis persistence
        analysis_id = response.data["analysis_id"]
        self.assertIsNotNone(analysis_id)
        analysis_obj = ResumeAnalysis.objects.filter(id=analysis_id).first()
        self.assertIsNotNone(analysis_obj)
        self.assertEqual(analysis_obj.resume, primary_resume)
        self.assertAlmostEqual(float(analysis_obj.score), ats["overall_score"], places=1)
        self.assertIn("Python", analysis_obj.extracted_skills)

    @patch("apps.ai_module.views.resume_views.extract_text_from_file")
    def test_resume_analyze_with_file_upload_and_save_to_profile(self, mock_extract):
        mock_extract.return_value = {
            "raw_text": SAMPLE_RESUME_TEXT,
            "clean_text": SAMPLE_RESUME_TEXT,
            "page_count": 1,
            "file_type": "PDF",
        }

        self.client.force_authenticate(user=self.user)
        pdf_file = io.BytesIO(b"%PDF-1.4 Mock Uploaded PDF Content")
        pdf_file.name = "New_Candidate_CV.pdf"

        response = self.client.post(
            "/api/ai/resume/analyze/",
            {
                "job_description": SAMPLE_JD_STRONG,
                "resume_file": pdf_file,
                "save_to_profile": True,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "SUCCESS")
        self.assertIsNotNone(response.data["resume_info"]["resume_id"])
        self.assertEqual(response.data["resume_info"]["title"], "New_Candidate_CV.pdf")
        self.assertIsNotNone(response.data["analysis_id"])

        # Check DB Table 27 record created
        new_resume = Resume.objects.filter(title="New_Candidate_CV.pdf", user=self.user).first()
        self.assertIsNotNone(new_resume)
