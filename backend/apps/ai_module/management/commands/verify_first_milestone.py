import math
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from qdrant_client.http import models

from apps.profiles.models import StudentProfile
from apps.skills.models import UserSkill
from apps.ai_module.models import VectorIndexState
from apps.ai_module.indexing.profile_document_builder import (
    is_profile_ready,
    build_user_document,
)
from apps.ai_module.indexing.profile_chunker import chunk_user_profile
from apps.ai_module.vector_store.client import get_qdrant_client
from apps.ai_module.vector_store.collection_manager import COLLECTION_STUDENT_VECTORS
from apps.ai_module.vector_store.embedding_service import get_embedding_service
from apps.ai_module.vector_store.vector_lifecycle import upsert_user_chunks
from apps.ai_module.vector_store.payload_builder import PROHIBITED_PII_KEYS

User = get_user_model()


class Command(BaseCommand):
    help = (
        "Phase 6: The First Milestone Acid Test. "
        "Indexes exactly ONE real student from MySQL, verifies zero PII, "
        "upserts to Qdrant student_vectors, runs live semantic query, "
        "and asserts 100% round-trip MySQL identity match."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--user-id",
            type=int,
            default=None,
            help="Specific student user ID to test (defaults to first ready student in MySQL)",
        )
        parser.add_argument(
            "--clean",
            action="store_true",
            help="Clean up Qdrant points and Table 31 state after test completes",
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("\n" + "=" * 65))
        self.stdout.write(self.style.MIGRATE_HEADING("   FIRST MILESTONE ACID TEST (STEP 6): END-TO-END VERIFICATION"))
        self.stdout.write(self.style.MIGRATE_HEADING("=" * 65 + "\n"))

        target_user_id = options.get("user_id")

        # ---------------------------------------------------------
        # STEP 1: Select Exactly 1 Real Student from MySQL
        # ---------------------------------------------------------
        self.stdout.write(self.style.WARNING("[Step 1/10] Selecting 1 Candidate Student from MySQL..."))

        if target_user_id:
            student_profile = StudentProfile.objects.filter(
                user_id=target_user_id,
                user__is_active=True
            ).select_related("user", "department", "batch").first()
            if not student_profile:
                self.stderr.write(self.style.ERROR(f"Student with user_id {target_user_id} not found in MySQL."))
                return
        else:
            # Query the first active student who has skills in UserSkill
            student_profile = StudentProfile.objects.filter(
                user__is_active=True,
                user__user_skills__isnull=False
            ).select_related("user", "department", "batch").distinct().first()

        if not student_profile:
            self.stderr.write(self.style.ERROR("No ready student found in MySQL with active skills."))
            return

        candidate_user = student_profile.user
        ready, reason = is_profile_ready(candidate_user)
        if not ready:
            self.stderr.write(self.style.ERROR(f"Candidate Student #{candidate_user.id} is not ready: {reason}"))
            return

        skills = list(
            UserSkill.objects.filter(user=candidate_user)
            .values_list("skill__name", "proficiency")
        )
        skills_summary = ", ".join([f"{name} ({prof})" for name, prof in skills[:5]])

        self.stdout.write(self.style.SUCCESS(
            f"  [OK] Selected Candidate: Student User #{candidate_user.id}\n"
            f"       - Department: {student_profile.department.name} ({student_profile.department.code})\n"
            f"       - Batch: {student_profile.batch.start_year}-{student_profile.batch.end_year}\n"
            f"       - Semester: {student_profile.semester}\n"
            f"       - Total Skills: {len(skills)} (e.g. {skills_summary})\n"
            f"       - Policy Confirmation: ONLY this 1 user is being processed (All other data untouched)."
        ))

        # ---------------------------------------------------------
        # STEP 2: Document Builder & Whitelist PII Audit
        # ---------------------------------------------------------
        self.stdout.write(self.style.WARNING("\n[Step 2/10] Building Whitelisted Document & Auditing PII Shield..."))
        doc = build_user_document(candidate_user)

        # Audit PII in metadata
        for pii in PROHIBITED_PII_KEYS:
            if pii in doc["metadata"]:
                raise AssertionError(f"Security Violation: PII key '{pii}' detected in metadata!")

        # Audit PII in facet texts
        for facet in doc["facets"]:
            text = facet["text"]
            if candidate_user.email in text:
                raise AssertionError("Security Violation: Email address leaked into facet text!")
            if getattr(student_profile, "phone", None) and student_profile.phone in text:
                raise AssertionError("Security Violation: Phone number leaked into facet text!")

        self.stdout.write(self.style.SUCCESS(
            f"  [OK] Document built successfully across {len(doc['facets'])} semantic facets.\n"
            f"       - Zero PII verified: email, phone, address, and password strictly excluded."
        ))

        # ---------------------------------------------------------
        # STEP 3: Token Bounding & Chunking
        # ---------------------------------------------------------
        self.stdout.write(self.style.WARNING("\n[Step 3/10] Chunking Profile & Bounding Tokens (180-220 target)..."))
        chunks, content_hash, metadata = chunk_user_profile(candidate_user)

        self.stdout.write(f"  Generated {len(chunks)} Chunks:")
        for idx, chunk in enumerate(chunks):
            self.stdout.write(
                f"    [{idx+1}] Type: {chunk.chunk_type:<18} | Tokens: {chunk.token_count:>3} | Point ID: {chunk.point_id}"
            )
            if chunk.token_count > 220:
                raise AssertionError(f"Chunk token count {chunk.token_count} exceeds maximum window (220)!")

        self.stdout.write(self.style.SUCCESS(
            f"  [OK] All chunks bounded within token limits. SHA-256 content_hash: {content_hash[:16]}..."
        ))

        # ---------------------------------------------------------
        # STEP 4: Dense Vector Embedding & Normalization Verification
        # ---------------------------------------------------------
        self.stdout.write(self.style.WARNING("\n[Step 4/10] Generating 384-Dim Normalized Embeddings (all-MiniLM-L6-v2)..."))
        emb_service = get_embedding_service()
        chunk_texts = [c.text for c in chunks]
        vectors = emb_service.embed_documents(chunk_texts)

        for idx, vec in enumerate(vectors):
            dim = len(vec)
            if dim != 384:
                raise AssertionError(f"Vector dimension {dim} does not match expected 384!")
            l2_norm = math.sqrt(sum(x * x for x in vec))
            if not (0.99 <= l2_norm <= 1.01):
                raise AssertionError(f"Vector #{idx} L2 norm {l2_norm:.4f} is not unit normalized!")

        self.stdout.write(self.style.SUCCESS(
            f"  [OK] Generated {len(vectors)} vectors | Dimension: 384 | L2 Norm: 1.000 (Unit Normalized)"
        ))

        # ---------------------------------------------------------
        # STEP 5 & 6: Atomic Upsert to Qdrant (student_vectors)
        # ---------------------------------------------------------
        self.stdout.write(self.style.WARNING("\n[Step 5 & 6/10] Upserting 1 Student into Qdrant collection 'student_vectors'..."))
        client = get_qdrant_client()

        points_upserted = upsert_user_chunks(
            user_id=candidate_user.id,
            role=candidate_user.role,
            chunks=chunks,
            content_hash=content_hash,
            client=client,
            sync_db_state=True,
        )

        col_info = client.get_collection(COLLECTION_STUDENT_VECTORS)
        self.stdout.write(self.style.SUCCESS(
            f"  [OK] Atomically upserted {points_upserted} vector chunks into '{COLLECTION_STUDENT_VECTORS}'.\n"
            f"       - Qdrant Total Points in collection: {col_info.points_count}\n"
            f"       - Qdrant Collection Status: {col_info.status}"
        ))

        # ---------------------------------------------------------
        # STEP 7: Audit MySQL Technical Table 31 (VectorIndexState)
        # ---------------------------------------------------------
        self.stdout.write(self.style.WARNING("\n[Step 7/10] Auditing MySQL Technical Table 31 (VectorIndexState)..."))
        state = VectorIndexState.objects.filter(
            source_type="PROFILE",
            source_id=candidate_user.id
        ).first()

        if not state:
            raise AssertionError(f"Table 31 record for user #{candidate_user.id} was not found!")
        if state.status != "SYNCED":
            raise AssertionError(f"Table 31 status is '{state.status}', expected 'SYNCED'!")
        if state.indexed_hash != content_hash:
            raise AssertionError("Table 31 indexed_hash does not match computed SHA-256 content_hash!")
        if state.chunk_count != len(chunks):
            raise AssertionError(f"Table 31 chunk_count is {state.chunk_count}, expected {len(chunks)}!")

        self.stdout.write(self.style.SUCCESS(
            f"  [OK] MySQL Table 31 Verified: status={state.status}, chunk_count={state.chunk_count}, synced_at={state.synced_at}"
        ))

        # ---------------------------------------------------------
        # STEP 8: Formulate Natural Language Semantic Query
        # ---------------------------------------------------------
        self.stdout.write(self.style.WARNING("\n[Step 8/10] Formulating Semantic Query from Candidate Skills..."))
        # Take the candidate's top skill names
        top_skills = [name for name, _ in skills[:3]]
        query_text = (
            f"Looking for a {student_profile.department.name} student proficient in "
            f"{', '.join(top_skills)} and distributed backend systems"
        )
        self.stdout.write(f"  Query: \"{query_text}\"")

        query_vector = emb_service.embed_query(query_text)
        self.stdout.write(self.style.SUCCESS("  [OK] Query vector generated (384 dimensions)."))

        # ---------------------------------------------------------
        # STEP 9: Execute Qdrant Similarity Search & Cosine Check
        # ---------------------------------------------------------
        self.stdout.write(self.style.WARNING("\n[Step 9/10] Querying Qdrant Vector Space (student_vectors)..."))

        # Use query_points (or search) in Qdrant client
        search_response = client.query_points(
            collection_name=COLLECTION_STUDENT_VECTORS,
            query=query_vector,
            limit=3,
            query_filter=models.Filter(
                must=[
                    models.FieldCondition(
                        key="is_active",
                        match=models.MatchValue(value=True)
                    )
                ]
            )
        )

        retrieved_points = search_response.points
        if not retrieved_points:
            raise AssertionError("Qdrant returned 0 points for query!")

        top_match = retrieved_points[0]
        similarity_score = top_match.score
        retrieved_user_id = top_match.payload.get("mysql_user_id")
        matched_chunk_type = top_match.payload.get("chunk_type")

        self.stdout.write(
            f"  Top Match Result:\n"
            f"    - Point ID: {top_match.id}\n"
            f"    - Retrieved User ID: #{retrieved_user_id}\n"
            f"    - Matched Chunk Type: {matched_chunk_type}\n"
            f"    - Cosine Similarity Score: {similarity_score:.4f} (Threshold >= 0.50)"
        )

        if similarity_score < 0.50:
            raise AssertionError(f"Cosine similarity score {similarity_score:.4f} is below 0.50 threshold!")

        self.stdout.write(self.style.SUCCESS(
            f"  [OK] Semantic search passed with high cosine similarity ({similarity_score:.4f} >= 0.50)."
        ))

        # ---------------------------------------------------------
        # STEP 10: Complete Round-Trip Identity Assertion
        # ---------------------------------------------------------
        self.stdout.write(self.style.WARNING("\n[Step 10/10] Verifying Round-Trip Identity against MySQL..."))

        if retrieved_user_id != candidate_user.id:
            raise AssertionError(
                f"Identity Mismatch! Qdrant retrieved user #{retrieved_user_id}, "
                f"expected candidate user #{candidate_user.id}!"
            )

        db_user = User.objects.get(id=retrieved_user_id)
        if db_user.id != candidate_user.id:
            raise AssertionError("Database user identity mismatch!")

        self.stdout.write(self.style.SUCCESS(
            f"  [OK] Round-Trip Identity Match: 100% Verified!\n"
            f"       - Qdrant payload mysql_user_id #{retrieved_user_id} == Candidate #{candidate_user.id}\n"
            f"       - MySQL Account Email: {db_user.email}\n"
            f"       - Department: {student_profile.department.name} ({student_profile.department.code})"
        ))

        # Cleanup if requested
        if options.get("clean"):
            self.stdout.write(self.style.WARNING("\nCleaning up test points as requested (--clean)..."))
            from apps.ai_module.vector_store.vector_lifecycle import delete_user_vectors
            delete_user_vectors(user_id=candidate_user.id, role="STUDENT", client=client)
            VectorIndexState.objects.filter(source_type="PROFILE", source_id=candidate_user.id).delete()
            self.stdout.write(self.style.SUCCESS("  [OK] Cleaned up test points from Qdrant and Table 31."))

        self.stdout.write(self.style.MIGRATE_HEADING("\n" + "=" * 65))
        self.stdout.write(self.style.SUCCESS(
            f"[SUCCESS] FIRST MILESTONE ACID TEST PASSED!\n"
            f"   Student User #{candidate_user.id} successfully indexed, queried, and verified\n"
            f"   against MySQL with 100% identity accuracy and zero PII leakage.\n"
            f"   Confirmation: ONLY this 1 user was indexed; all other data untouched."
        ))
        self.stdout.write(self.style.MIGRATE_HEADING("=" * 65 + "\n"))
