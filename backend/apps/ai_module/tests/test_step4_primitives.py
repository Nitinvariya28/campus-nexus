import math
import uuid
from django.test import SimpleTestCase

from apps.ai_module.vector_store.point_id_generator import (
    generate_student_point_id,
    generate_alumni_point_id,
    generate_post_point_id,
    generate_knowledge_point_id,
    AI_NAMESPACE,
)
from apps.ai_module.vector_store.payload_builder import (
    build_student_payload,
    build_alumni_payload,
    build_post_payload,
    build_knowledge_payload,
    PROHIBITED_PII_KEYS,
    _assert_no_pii,
)
from apps.ai_module.vector_store.embedding_service import get_embedding_service


class Step4PrimitivesTestCase(SimpleTestCase):
    """
    Verification tests for Step 4 foundational primitives:
    1. Deterministic UUID5 Point ID generation
    2. Full-Field PII-Safe Payload Construction & Guardrail Protection
    3. Shared Embedding Service (384 Dim & L2 Normalization)
    """

    def test_deterministic_point_id_idempotence(self):
        """Calling point_id generator with the exact same inputs must produce the exact same UUID."""
        id1 = generate_student_point_id(user_id=101, chunk_type="STUDENT_SKILLS", chunk_index=0)
        id2 = generate_student_point_id(user_id=101, chunk_type="STUDENT_SKILLS", chunk_index=0)
        self.assertEqual(id1, id2, "Deterministic UUID5 must be strictly idempotent.")

        # Verify it's a valid UUID
        parsed_uuid = uuid.UUID(id1)
        self.assertEqual(parsed_uuid.version, 5, "Point ID must be UUID Version 5.")

    def test_point_id_uniqueness_across_roles_and_chunks(self):
        """Different roles, users, or chunks must generate distinct, non-colliding UUIDs."""
        student_skill_id = generate_student_point_id(101, "STUDENT_SKILLS", 0)
        student_academic_id = generate_student_point_id(101, "STUDENT_ACADEMIC", 0)
        alumni_career_id = generate_alumni_point_id(101, "ALUMNI_CAREER", 0)
        post_id = generate_post_point_id(101)
        knowledge_id = generate_knowledge_point_id("NSU_DOC", 1)

        ids = [student_skill_id, student_academic_id, alumni_career_id, post_id, knowledge_id]
        self.assertEqual(len(ids), len(set(ids)), "All generated point IDs must be mutually unique.")

    def test_payload_builder_contains_no_pii(self):
        """Payloads must never contain sensitive PII keys."""
        student_payload = build_student_payload(
            user_id=101,
            chunk_type="STUDENT_SKILLS",
            chunk_index=0,
            department_id=2,
            batch_id=5,
            semester=5,
            content_hash="mock_hash_123",
            department_code="bce",
            batch_period="2024-2028",
            skills_count=10,
            has_resume=True,
        )
        for prohibited in PROHIBITED_PII_KEYS:
            self.assertNotIn(prohibited, student_payload, f"Prohibited key '{prohibited}' leaked into student payload.")

        alumni_payload = build_alumni_payload(
            user_id=205,
            chunk_type="ALUMNI_CAREER",
            chunk_index=0,
            company_id=12,
            department_id=2,
            graduation_year=2020,
            experience_years=4.5,
            content_hash="mock_hash_456",
            company_name="Amazon",
            company_tier="SUPER_DREAM",
            job_category="SOFTWARE",
        )
        for prohibited in PROHIBITED_PII_KEYS:
            self.assertNotIn(prohibited, alumni_payload, f"Prohibited key '{prohibited}' leaked into alumni payload.")

    def test_payload_builder_full_fields(self):
        """Payloads must contain all mandatory structural and filtering keys accurately."""
        student_payload = build_student_payload(
            user_id=42,
            chunk_type="STUDENT_ACADEMIC",
            chunk_index=1,
            department_id=3,
            batch_id=8,
            semester=6,
            content_hash="sha256_dummy",
            department_code="bee",
            batch_period="2023-2027",
            skills_count=12,
            has_resume=True,
            is_active=True,
        )
        self.assertEqual(student_payload["mysql_user_id"], 42)
        self.assertEqual(student_payload["role"], "STUDENT")
        self.assertEqual(student_payload["chunk_type"], "STUDENT_ACADEMIC")
        self.assertEqual(student_payload["chunk_index"], 1)
        self.assertEqual(student_payload["department_id"], 3)
        self.assertEqual(student_payload["department_code"], "bee")
        self.assertEqual(student_payload["batch_period"], "2023-2027")
        self.assertEqual(student_payload["skills_count"], 12)
        self.assertTrue(student_payload["has_resume"])
        self.assertTrue(student_payload["is_active"])

        post_payload = build_post_payload(
            post_id=99,
            entity_type="OPPORTUNITY",
            author_role="PLACEMENT_CELL",
            company_id=15,
            company_name="Morgan Stanley",
            company_tier="SUPER_DREAM",
            opportunity_type="INTERNSHIP",
            salary_package="24 LPA",
            min_cgpa=8.5,
            eligible_department_ids=[1, 2],
            eligible_batch_ids=[5],
            status="OPEN",
            is_active=True,
        )
        self.assertEqual(post_payload["post_id"], 99)
        self.assertEqual(post_payload["author_role"], "PLACEMENT_CELL")
        self.assertEqual(post_payload["company_name"], "Morgan Stanley")
        self.assertEqual(post_payload["company_tier"], "SUPER_DREAM")
        self.assertEqual(post_payload["status"], "OPEN")
        self.assertEqual(post_payload["min_cgpa"], 8.5)

    def test_pii_guardrail_rejection(self):
        """_assert_no_pii must raise ValueError if any prohibited key is present."""
        leak_payload = {"mysql_user_id": 1, "name": "John Doe", "email": "john@test.com"}
        with self.assertRaises(ValueError):
            _assert_no_pii(leak_payload)

        leak_payload_phone = {"mysql_user_id": 1, "phone": "+919999999999"}
        with self.assertRaises(ValueError):
            _assert_no_pii(leak_payload_phone)

    def test_embedding_service_dimensions_and_norm(self):
        """Embedding model must output exactly 384 floats normalized to unit length."""
        service = get_embedding_service()
        self.assertEqual(service.get_dimension(), 384)

        query_text = "Python Django Backend Development REST API"
        vector = service.embed_query(query_text)

        self.assertIsInstance(vector, list)
        self.assertEqual(len(vector), 384, "Vector dimension must be exactly 384.")

        # Check L2 Norm = sqrt(sum(x^2)) ~= 1.0
        norm = math.sqrt(sum(x * x for x in vector))
        self.assertAlmostEqual(norm, 1.0, places=3, msg="L2 normalized vector must have norm approximately 1.0.")

    def test_embedding_service_empty_text_rejection(self):
        """Embedding service must reject empty strings with ValueError."""
        service = get_embedding_service()
        with self.assertRaises(ValueError):
            service.embed_query("")
        with self.assertRaises(ValueError):
            service.embed_query("   ")
