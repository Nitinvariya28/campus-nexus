from unittest.mock import MagicMock, patch
from django.test import SimpleTestCase

from apps.ai_module.vector_store.vector_lifecycle import (
    get_target_collection_for_role,
    delete_user_vectors,
    soft_delete_user_vectors,
    upsert_user_chunks,
    delete_opportunity_vector,
    COLLECTION_STUDENT_VECTORS,
    COLLECTION_ALUMNI_VECTORS,
    COLLECTION_OPPORTUNITY_POST_VECTORS,
)
from apps.ai_module.indexing.profile_chunker import ProfileChunk


class VectorLifecycleTestCase(SimpleTestCase):
    """
    Unit tests for vector lifecycle operations:
    1. Role-to-collection mapping
    2. Filter deletion of user vectors (orphan elimination)
    3. Soft-deletion of vectors via payload
    4. Upserting chunks with zero orphan risk
    5. Opportunity deletion
    """

    def test_target_collection_for_role(self):
        """Role must correctly resolve to dedicated Qdrant collection."""
        self.assertEqual(get_target_collection_for_role("STUDENT"), COLLECTION_STUDENT_VECTORS)
        self.assertEqual(get_target_collection_for_role("ALUMNI"), COLLECTION_ALUMNI_VECTORS)
        with self.assertRaises(ValueError):
            get_target_collection_for_role("PLACEMENT_CELL")

    def test_delete_user_vectors_filter(self):
        """delete_user_vectors must execute a FilterSelector on mysql_user_id."""
        mock_client = MagicMock()
        deleted = delete_user_vectors(user_id=101, role="STUDENT", client=mock_client)

        self.assertEqual(deleted, 1)
        mock_client.delete.assert_called_once()
        call_kwargs = mock_client.delete.call_args[1]
        self.assertEqual(call_kwargs["collection_name"], COLLECTION_STUDENT_VECTORS)

        # Inspect the filter selector
        selector = call_kwargs["points_selector"]
        must_conditions = selector.filter.must
        self.assertEqual(len(must_conditions), 1)
        self.assertEqual(must_conditions[0].key, "mysql_user_id")
        self.assertEqual(must_conditions[0].match.value, 101)

    def test_delete_user_vectors_unknown_role_cleans_both(self):
        """When role is None, delete_user_vectors cleans both student and alumni collections."""
        mock_client = MagicMock()
        deleted = delete_user_vectors(user_id=42, role=None, client=mock_client)

        self.assertEqual(deleted, 2)
        self.assertEqual(mock_client.delete.call_count, 2)

    def test_soft_delete_user_vectors(self):
        """soft_delete_user_vectors must update payload is_active flag."""
        mock_client = MagicMock()
        soft_delete_user_vectors(user_id=205, role="ALUMNI", is_active=False, client=mock_client)

        mock_client.set_payload.assert_called_once()
        call_kwargs = mock_client.set_payload.call_args[1]
        self.assertEqual(call_kwargs["collection_name"], COLLECTION_ALUMNI_VECTORS)
        self.assertEqual(call_kwargs["payload"], {"is_active": False})

    def test_delete_opportunity_vector(self):
        """delete_opportunity_vector must target opportunity_post_vectors with point ID."""
        mock_client = MagicMock()
        delete_opportunity_vector(post_id=55, client=mock_client)

        mock_client.delete.assert_called_once()
        call_kwargs = mock_client.delete.call_args[1]
        self.assertEqual(call_kwargs["collection_name"], COLLECTION_OPPORTUNITY_POST_VECTORS)

    @patch("apps.ai_module.vector_store.vector_lifecycle.get_embedding_service")
    def test_upsert_user_chunks_clean_replacement(self, mock_get_embedding_service):
        """upsert_user_chunks executes clean delete first, batch embeds, then upserts."""
        mock_service = MagicMock()
        mock_service.embed_documents.return_value = [[0.1] * 384, [0.2] * 384]
        mock_get_embedding_service.return_value = mock_service

        mock_client = MagicMock()
        chunks = [
            ProfileChunk(
                chunk_type="STUDENT_SKILLS",
                chunk_index=0,
                point_id="point_1",
                text="Python Django Skills",
                token_count=10,
                payload={"mysql_user_id": 101, "role": "STUDENT"},
            ),
            ProfileChunk(
                chunk_type="STUDENT_ACADEMIC",
                chunk_index=0,
                point_id="point_2",
                text="CSE Batch 2024",
                token_count=10,
                payload={"mysql_user_id": 101, "role": "STUDENT"},
            ),
        ]

        count = upsert_user_chunks(
            user_id=101,
            role="STUDENT",
            chunks=chunks,
            content_hash="mock_hash_abc",
            client=mock_client,
            sync_db_state=False,  # Skip DB state save in SimpleTestCase
        )

        self.assertEqual(count, 2)
        # Verify clean filter delete was executed before upsert
        mock_client.delete.assert_called_once()
        # Verify upsert was called with 2 points
        mock_client.upsert.assert_called_once()
        upsert_kwargs = mock_client.upsert.call_args[1]
        self.assertEqual(upsert_kwargs["collection_name"], COLLECTION_STUDENT_VECTORS)
        self.assertEqual(len(upsert_kwargs["points"]), 2)
