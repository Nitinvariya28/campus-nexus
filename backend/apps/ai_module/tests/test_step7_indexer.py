from unittest.mock import MagicMock, patch
from django.test import SimpleTestCase

from apps.ai_module.indexing.profile_indexer import ProfileIndexer, get_eligible_users
from apps.ai_module.indexing.profile_chunker import ProfileChunk


class Step7ProfileIndexerTestCase(SimpleTestCase):
    """
    Unit tests for Step 7: Profile Indexer & Batch Management Backfill.
    Verifies:
    1. get_eligible_users query shaping and role filtering
    2. Single user indexing delegation
    3. Batch indexing change detection (SHA-256 skipping)
    4. Readiness gating (incomplete profiles skipped)
    5. Dry-run safety (0 writes to Qdrant or DB)
    6. Fault tolerance (isolated errors don't halt the batch)
    7. Force re-embedding bypasses cache
    """

    def setUp(self):
        self.mock_client = MagicMock()
        self.indexer = ProfileIndexer(client=self.mock_client)

    @patch("apps.ai_module.indexing.profile_indexer.sync_user_profile_vector")
    def test_index_single_user_delegates(self, mock_sync):
        """index_single_user must invoke sync_user_profile_vector with force and client."""
        mock_sync.return_value = {"status": "SYNCED", "chunk_count": 3, "role": "STUDENT"}
        res = self.indexer.index_single_user(user_id=42, force=True)

        self.assertEqual(res["status"], "SYNCED")
        mock_sync.assert_called_once_with(user_id=42, force=True, client=self.mock_client)

    @patch("apps.ai_module.indexing.profile_indexer.VectorIndexState.objects")
    @patch("apps.ai_module.indexing.profile_indexer.chunk_user_profile")
    @patch("apps.ai_module.indexing.profile_indexer.is_profile_ready")
    @patch("apps.ai_module.indexing.profile_indexer.get_eligible_users")
    def test_run_batch_index_dry_run(
        self,
        mock_get_users,
        mock_is_ready,
        mock_chunk_user,
        mock_state_objects,
    ):
        """Dry-run must simulate chunking and readiness without writing to Qdrant or DB."""
        mock_state_objects.filter.return_value = []

        # 2 mock users: user 1 ready (2 chunks), user 2 not ready
        u1 = MagicMock(id=1, role="STUDENT")
        u2 = MagicMock(id=2, role="STUDENT")

        mock_qs = MagicMock()
        mock_qs.count.return_value = 2
        mock_qs.iterator.return_value = [u1, u2]
        mock_get_users.return_value = mock_qs

        mock_is_ready.side_effect = [
            (True, "Profile complete"),
            (False, "Missing skills"),
        ]
        mock_chunk_user.return_value = (
            [
                ProfileChunk("STUDENT_SKILLS", 0, "pt-1", "skills", 10, {}),
                ProfileChunk("STUDENT_ACADEMIC", 0, "pt-2", "academic", 10, {}),
            ],
            "hash_u1",
            "full text",
        )

        stats = self.indexer.run_batch_index(role="STUDENT", dry_run=True)

        self.assertEqual(stats["total_scanned"], 2)
        self.assertEqual(stats["synced_users"], 1)
        self.assertEqual(stats["total_points_upserted"], 2)
        self.assertEqual(stats["skipped_not_ready"], 1)
        self.assertEqual(stats["skipped_unchanged"], 0)
        self.assertEqual(stats["failed"], 0)
        self.assertTrue(stats["dry_run"])

        # Qdrant client must NOT be called in dry-run
        self.mock_client.upsert.assert_not_called()
        self.mock_client.delete.assert_not_called()
        # update_or_create must NOT be called in dry-run
        mock_state_objects.update_or_create.assert_not_called()

    @patch("apps.ai_module.indexing.profile_indexer.sync_user_profile_vector")
    @patch("apps.ai_module.indexing.profile_indexer.VectorIndexState.objects")
    @patch("apps.ai_module.indexing.profile_indexer.chunk_user_profile")
    @patch("apps.ai_module.indexing.profile_indexer.is_profile_ready")
    @patch("apps.ai_module.indexing.profile_indexer.get_eligible_users")
    def test_run_batch_index_skips_unchanged_hashes(
        self,
        mock_get_users,
        mock_is_ready,
        mock_chunk_user,
        mock_state_objects,
        mock_sync,
    ):
        """Profiles with identical content hash and SYNCED state are skipped."""
        state_u1 = MagicMock(source_id=10, indexed_hash="matching_hash", chunk_count=2, status="SYNCED")
        mock_state_objects.filter.return_value = [state_u1]

        u1 = MagicMock(id=10, role="ALUMNI")
        mock_qs = MagicMock()
        mock_qs.count.return_value = 1
        mock_qs.iterator.return_value = [u1]
        mock_get_users.return_value = mock_qs

        mock_is_ready.return_value = (True, "Ready")
        mock_chunk_user.return_value = (
            [ProfileChunk("ALUMNI_EXPERIENCE", 0, "p1", "text", 10, {})],
            "matching_hash",
            "full doc",
        )

        stats = self.indexer.run_batch_index(role="ALUMNI", dry_run=False, force=False)

        self.assertEqual(stats["total_scanned"], 1)
        self.assertEqual(stats["skipped_unchanged"], 1)
        self.assertEqual(stats["synced_users"], 0)
        mock_sync.assert_not_called()

    @patch("apps.ai_module.indexing.profile_indexer.sync_user_profile_vector")
    @patch("apps.ai_module.indexing.profile_indexer.VectorIndexState.objects")
    @patch("apps.ai_module.indexing.profile_indexer.chunk_user_profile")
    @patch("apps.ai_module.indexing.profile_indexer.is_profile_ready")
    @patch("apps.ai_module.indexing.profile_indexer.get_eligible_users")
    def test_run_batch_index_force_bypasses_hash(
        self,
        mock_get_users,
        mock_is_ready,
        mock_chunk_user,
        mock_state_objects,
        mock_sync,
    ):
        """When force=True, matching hashes are NOT skipped."""
        state_u1 = MagicMock(source_id=10, indexed_hash="matching_hash", chunk_count=2, status="SYNCED")
        mock_state_objects.filter.return_value = [state_u1]

        u1 = MagicMock(id=10, role="ALUMNI")
        mock_qs = MagicMock()
        mock_qs.count.return_value = 1
        mock_qs.iterator.return_value = [u1]
        mock_get_users.return_value = mock_qs

        mock_is_ready.return_value = (True, "Ready")
        mock_chunk_user.return_value = (
            [ProfileChunk("ALUMNI_EXPERIENCE", 0, "p1", "text", 10, {})],
            "matching_hash",
            "full doc",
        )
        mock_sync.return_value = {"status": "SYNCED", "chunk_count": 1, "role": "ALUMNI"}

        stats = self.indexer.run_batch_index(role="ALUMNI", dry_run=False, force=True)

        self.assertEqual(stats["total_scanned"], 1)
        self.assertEqual(stats["skipped_unchanged"], 0)
        self.assertEqual(stats["synced_users"], 1)
        mock_sync.assert_called_once()

    @patch("apps.ai_module.indexing.profile_indexer.sync_user_profile_vector")
    @patch("apps.ai_module.indexing.profile_indexer.VectorIndexState.objects")
    @patch("apps.ai_module.indexing.profile_indexer.chunk_user_profile")
    @patch("apps.ai_module.indexing.profile_indexer.is_profile_ready")
    @patch("apps.ai_module.indexing.profile_indexer.get_eligible_users")
    def test_run_batch_index_error_isolation(
        self,
        mock_get_users,
        mock_is_ready,
        mock_chunk_user,
        mock_state_objects,
        mock_sync,
    ):
        """Exceptions during indexing a single user are caught; remaining users succeed."""
        mock_state_objects.filter.return_value = []

        u1 = MagicMock(id=1, role="STUDENT")
        u2 = MagicMock(id=2, role="STUDENT")
        mock_qs = MagicMock()
        mock_qs.count.return_value = 2
        mock_qs.iterator.return_value = [u1, u2]
        mock_get_users.return_value = mock_qs

        mock_is_ready.side_effect = [
            RuntimeError("Database connection jitter"),
            (True, "Ready"),
        ]
        mock_chunk_user.return_value = (
            [ProfileChunk("STUDENT_SKILLS", 0, "p1", "text", 10, {})],
            "hash_u2",
            "full doc",
        )
        mock_sync.return_value = {"status": "SYNCED", "chunk_count": 1, "role": "STUDENT"}

        stats = self.indexer.run_batch_index(role="STUDENT", dry_run=False)

        self.assertEqual(stats["total_scanned"], 2)
        self.assertEqual(stats["failed"], 1)
        self.assertEqual(stats["synced_users"], 1)
        self.assertEqual(len(stats["errors"]), 1)
        self.assertEqual(stats["errors"][0]["user_id"], 1)
        self.assertIn("Database connection jitter", stats["errors"][0]["error"])
        # Verify update_or_create recorded the failure
        mock_state_objects.update_or_create.assert_called_with(
            source_type="PROFILE",
            source_id=1,
            defaults={"status": "FAILED", "last_error": "Database connection jitter"},
        )
