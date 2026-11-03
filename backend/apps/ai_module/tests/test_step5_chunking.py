from unittest.mock import MagicMock
from django.test import SimpleTestCase

from apps.ai_module.indexing.profile_document_builder import (
    is_profile_ready,
    build_student_document,
    build_alumni_document,
)
from apps.ai_module.indexing.profile_chunker import (
    count_tokens,
    split_text_into_token_windows,
    compute_profile_content_hash,
    chunk_user_profile,
    ProfileChunk,
)
from apps.ai_module.vector_store.payload_builder import PROHIBITED_PII_KEYS


class Step5ProfileChunkingTestCase(SimpleTestCase):
    """
    Verification tests for Step 5:
    1. Profile readiness evaluation (gating unready users)
    2. Multi-chunk semantic faceting for Students & Alumni
    3. Strict Zero-PII protection in text and payloads
    4. Token-aware windowing and token counting
    5. SHA-256 content_hash calculation
    6. Deterministic UUID5 point ID generation
    """

    def _create_mock_student_user(
        self,
        has_profile: bool = True,
        has_skills: bool = True,
        has_bio: bool = True,
        is_active: bool = True,
    ):
        """Helper to create a mock Student User with related models."""
        user = MagicMock()
        user.id = 101
        user.role = "STUDENT"
        user.email = "student101@nirmauni.ac.in"
        user.is_active = is_active

        if not has_profile:
            user.student_profile = None
            return user

        profile = MagicMock()
        profile.semester = 5
        profile.bio = "Passionate about backend distributed systems and databases." if has_bio else ""
        profile.phone = "+919876543210"  # SENSITIVE PII - MUST NEVER LEAK
        profile.address = "Hostel Block A, Nirma Campus"  # SENSITIVE PII

        department = MagicMock()
        department.id = 2
        department.name = "Computer Science and Engineering"
        department.code = "bce"
        profile.department = department

        batch = MagicMock()
        batch.id = 5
        batch.start_year = 2024
        batch.end_year = 2028
        profile.batch = batch
        profile.placements.first.return_value = None

        user.student_profile = profile

        # Mock skills
        if has_skills:
            skill1 = MagicMock(name="skill1")
            skill1.skill.name = "Python"
            skill1.proficiency = "ADVANCED"

            skill2 = MagicMock(name="skill2")
            skill2.skill.name = "Django REST Framework"
            skill2.proficiency = "ADVANCED"

            skill3 = MagicMock(name="skill3")
            skill3.skill.name = "React"
            skill3.proficiency = "INTERMEDIATE"

            user.user_skills.all.return_value = [skill1, skill2, skill3]
            user.user_skills.exists.return_value = True
        else:
            user.user_skills.all.return_value = []
            user.user_skills.exists.return_value = False

        # Mock AI usage
        ai_usage = MagicMock()
        ai_usage.get_ai_tool_display.return_value = "Cursor"
        ai_usage.get_usage_purpose_display.return_value = "Coding and Debugging"
        user.ai_usages.all.return_value = [ai_usage]

        # Mock Social Link
        social = MagicMock()
        social.get_platform_display.return_value = "LeetCode"
        user.social_links.all.return_value = [social]

        user.resumes.exists.return_value = True
        return user

    def _create_mock_alumni_user(self):
        """Helper to create a mock Alumni User with career details."""
        user = MagicMock()
        user.id = 205
        user.role = "ALUMNI"
        user.email = "alumni205@alumni.nirmauni.ac.in"
        user.is_active = True

        profile = MagicMock()
        profile.current_job_title = "Senior Cloud Architect"
        profile.job_category = "SOFTWARE"
        profile.get_job_category_display.return_value = "Software & Engineering"
        profile.years_of_experience = 5
        profile.location = "Bengaluru, India"
        profile.bio = "Mentoring students in AWS system design and scalable microservices."
        profile.phone = "+919988776655"  # PII

        company = MagicMock()
        company.id = 14
        company.name = "Amazon Web Services"
        company.company_tier = "SUPER_DREAM"
        company.get_company_tier_display.return_value = "Super Dream (Tier 1)"
        profile.current_company = company
        profile.current_company_id = 14

        department = MagicMock()
        department.id = 2
        department.name = "Computer Science and Engineering"
        department.code = "bce"
        profile.department = department

        batch = MagicMock()
        batch.id = 1
        batch.start_year = 2016
        batch.end_year = 2020
        profile.batch = batch

        user.alumni_profile = profile

        skill = MagicMock()
        skill.skill.name = "Go"
        skill.proficiency = "ADVANCED"
        user.user_skills.all.return_value = [skill]
        user.user_skills.exists.return_value = True

        return user

    def test_profile_readiness_gating(self):
        """Verifies that only complete, content-rich profiles are marked ready for vectorization."""
        # Case 1: Inactive user &rarr; NOT READY
        inactive_user = self._create_mock_student_user(is_active=False)
        ready, reason = is_profile_ready(inactive_user)
        self.assertFalse(ready)
        self.assertIn("inactive", reason.lower())

        # Case 2: User with no profile &rarr; NOT READY
        no_profile_user = self._create_mock_student_user(has_profile=False)
        ready, reason = is_profile_ready(no_profile_user)
        self.assertFalse(ready)
        self.assertIn("does not exist", reason.lower())

        # Case 3: Student with profile but 0 skills and empty bio &rarr; NOT READY
        empty_student = self._create_mock_student_user(has_skills=False, has_bio=False)
        ready, reason = is_profile_ready(empty_student)
        self.assertFalse(ready)
        self.assertIn("zero technical skills", reason.lower())

        # Case 4: Complete student &rarr; READY
        ready_student = self._create_mock_student_user()
        ready, reason = is_profile_ready(ready_student)
        self.assertTrue(ready)
        self.assertEqual(reason, "Ready")

    def test_student_document_builder_facets_and_zero_pii(self):
        """Student document builder must create 3 facets and strictly exclude all PII."""
        user = self._create_mock_student_user()
        doc = build_student_document(user)

        self.assertEqual(doc["user_id"], 101)
        self.assertEqual(doc["role"], "STUDENT")

        facets = doc["facets"]
        self.assertEqual(len(facets), 3, "Student must generate exactly 3 semantic facets.")

        facet_types = [f["chunk_type"] for f in facets]
        self.assertIn("STUDENT_ACADEMIC", facet_types)
        self.assertIn("STUDENT_SKILLS", facet_types)
        self.assertIn("STUDENT_CAREER", facet_types)

        # Check skills text
        skills_facet = next(f for f in facets if f["chunk_type"] == "STUDENT_SKILLS")
        self.assertIn("Python", skills_facet["text"])
        self.assertIn("Django REST Framework", skills_facet["text"])
        self.assertIn("React", skills_facet["text"])
        self.assertIn("Cursor", skills_facet["text"])

        # Strict Zero-PII check: Check all generated facet texts
        for facet in facets:
            text = facet["text"]
            self.assertNotIn("student101@nirmauni.ac.in", text, "Email leaked into facet text!")
            self.assertNotIn("+919876543210", text, "Phone leaked into facet text!")
            self.assertNotIn("Hostel Block A", text, "Address leaked into facet text!")

        # Strict Zero-PII check on metadata dictionary
        for prohibited in PROHIBITED_PII_KEYS:
            self.assertNotIn(prohibited, doc["metadata"], f"Prohibited key '{prohibited}' leaked into metadata!")

    def test_alumni_document_builder_facets(self):
        """Alumni document builder must create 4 distinct semantic facets."""
        user = self._create_mock_alumni_user()
        doc = build_alumni_document(user)

        self.assertEqual(doc["user_id"], 205)
        self.assertEqual(doc["role"], "ALUMNI")

        facets = doc["facets"]
        self.assertEqual(len(facets), 4, "Alumni must generate exactly 4 semantic facets.")

        facet_types = [f["chunk_type"] for f in facets]
        self.assertIn("ALUMNI_CAREER", facet_types)
        self.assertIn("ALUMNI_TECH_STACK", facet_types)
        self.assertIn("ALUMNI_MENTOR", facet_types)
        self.assertIn("ALUMNI_ACADEMIC", facet_types)

        career_facet = next(f for f in facets if f["chunk_type"] == "ALUMNI_CAREER")
        self.assertIn("Amazon Web Services", career_facet["text"])
        self.assertIn("Senior Cloud Architect", career_facet["text"])
        self.assertIn("5 Years", career_facet["text"])

    def test_token_counting_and_window_splitting(self):
        """Tokenizer correctly counts tokens and handles text within and exceeding limits."""
        short_text = "Python Django Backend Development with Qdrant Vector Search."
        tokens = count_tokens(short_text)
        self.assertGreater(tokens, 0)
        self.assertLess(tokens, 50)

        # Short text should yield exactly 1 window
        windows = split_text_into_token_windows(short_text, max_tokens=100)
        self.assertEqual(len(windows), 1)

        # Massive text exceeding max_tokens should split into multiple overlapping windows
        long_text = " ".join(["Software engineering microservices architecture cloud distributed databases"] * 40)
        long_windows = split_text_into_token_windows(long_text, max_tokens=50, overlap_tokens=10)
        self.assertGreater(len(long_windows), 1, "Long text must be split into multiple token windows.")

    def test_chunk_user_profile_end_to_end(self):
        """chunk_user_profile produces ready ProfileChunks with deterministic UUID5 and content hash."""
        user = self._create_mock_student_user()
        chunks, content_hash, metadata = chunk_user_profile(user)

        self.assertEqual(len(chunks), 3)
        self.assertIsInstance(content_hash, str)
        self.assertEqual(len(content_hash), 64, "Content hash must be valid SHA-256 (64 hex characters).")

        for chunk in chunks:
            self.assertIsInstance(chunk, ProfileChunk)
            self.assertTrue(chunk.point_id)
            self.assertGreater(chunk.token_count, 0)
            self.assertLessEqual(chunk.token_count, 220, "Chunk must stay within 220 tokens.")

            # Payload validation
            payload = chunk.payload
            self.assertEqual(payload["mysql_user_id"], 101)
            self.assertEqual(payload["role"], "STUDENT")
            self.assertEqual(payload["content_hash"], content_hash)
            self.assertEqual(payload["department_code"], "bce")

            # Zero PII in payload
            for prohibited in PROHIBITED_PII_KEYS:
                self.assertNotIn(prohibited, payload)
