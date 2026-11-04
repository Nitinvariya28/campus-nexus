from unittest.mock import MagicMock, patch
from django.test import SimpleTestCase

from apps.ai_module.indexing.sync_service import (
    schedule_profile_sync,
    schedule_profile_deletion,
    schedule_profile_deactivation,
)
from apps.ai_module.signals import (
    on_user_post_save,
    on_user_post_delete,
    on_student_profile_post_save,
    on_student_profile_post_delete,
    on_alumni_profile_post_save,
    on_alumni_profile_post_delete,
    on_user_skill_post_save,
    on_user_skill_post_delete,
)


class Step8SignalsAndSyncTestCase(SimpleTestCase):
    """
    Unit tests for Step 8: Real-Time Event Synchronization and Django Signals.
    Verifies:
    1. Transaction commit scheduling for sync, deletion, and deactivation
    2. User signal triggers (activation, deactivation, admin ignore)
    3. Profile signal triggers (StudentProfile, AlumniProfile)
    4. Skill signal triggers (UserSkill additions and deletions)
    5. Error isolation during commit hook execution
    """

    @patch("apps.ai_module.indexing.sync_service.sync_user_profile_vector")
    @patch("apps.ai_module.indexing.sync_service.transaction.on_commit")
    def test_schedule_profile_sync_executes_on_commit(self, mock_on_commit, mock_sync):
        """schedule_profile_sync registers a callback that calls sync_user_profile_vector."""
        # Setup: capture callback passed to transaction.on_commit
        def side_effect(cb):
            cb()  # Simulate transaction committing immediately

        mock_on_commit.side_effect = side_effect
        mock_sync.return_value = {"status": "SYNCED", "chunk_count": 3}

        schedule_profile_sync(user_id=101, force=False)

        mock_on_commit.assert_called_once()
        mock_sync.assert_called_once_with(user_id=101, force=False, sync_db_state=True)

    @patch("apps.ai_module.indexing.sync_service.VectorIndexState.objects.update_or_create")
    @patch("apps.ai_module.indexing.sync_service.sync_user_profile_vector")
    @patch("apps.ai_module.indexing.sync_service.transaction.on_commit")
    def test_schedule_profile_sync_error_handling(self, mock_on_commit, mock_sync, mock_update_or_create):
        """If sync_user_profile_vector raises, schedule_profile_sync records FAILED state."""
        def side_effect(cb):
            cb()

        mock_on_commit.side_effect = side_effect
        mock_sync.side_effect = RuntimeError("Qdrant connection refused")

        schedule_profile_sync(user_id=102)

        mock_update_or_create.assert_called_once_with(
            source_type="PROFILE",
            source_id=102,
            defaults={"status": "FAILED", "last_error": "Qdrant connection refused"},
        )

    @patch("apps.ai_module.indexing.sync_service.VectorIndexState.objects.filter")
    @patch("apps.ai_module.indexing.sync_service.delete_user_vectors")
    @patch("apps.ai_module.indexing.sync_service.transaction.on_commit")
    def test_schedule_profile_deletion(self, mock_on_commit, mock_delete_vectors, mock_filter):
        """schedule_profile_deletion drops vector points and removes Table 31 state."""
        def side_effect(cb):
            cb()

        mock_on_commit.side_effect = side_effect
        mock_state_qs = MagicMock()
        mock_filter.return_value = mock_state_qs

        schedule_profile_deletion(user_id=202, role="STUDENT")

        mock_on_commit.assert_called_once()
        mock_delete_vectors.assert_called_once_with(user_id=202, role="STUDENT")
        mock_filter.assert_called_once_with(source_type="PROFILE", source_id=202)
        mock_state_qs.delete.assert_called_once()

    @patch("apps.ai_module.indexing.sync_service.VectorIndexState.objects.filter")
    @patch("apps.ai_module.indexing.sync_service.soft_delete_user_vectors")
    @patch("apps.ai_module.indexing.sync_service.transaction.on_commit")
    def test_schedule_profile_deactivation(self, mock_on_commit, mock_soft_delete, mock_filter):
        """schedule_profile_deactivation sets payload is_active=False and Table 31 DEACTIVATED."""
        def side_effect(cb):
            cb()

        mock_on_commit.side_effect = side_effect
        mock_state_qs = MagicMock()
        mock_filter.return_value = mock_state_qs

        schedule_profile_deactivation(user_id=303, role="ALUMNI")

        mock_on_commit.assert_called_once()
        mock_soft_delete.assert_called_once_with(user_id=303, role="ALUMNI", is_active=False)
        mock_filter.assert_called_once_with(source_type="PROFILE", source_id=303)
        mock_state_qs.update.assert_called_once_with(status="DEACTIVATED")

    # ------------------ Signal Receivers Tests ------------------

    @patch("apps.ai_module.signals.schedule_profile_sync")
    def test_user_post_save_active_student_triggers_sync(self, mock_sync):
        """Active student User save triggers schedule_profile_sync."""
        user = MagicMock(id=50, role="STUDENT", is_active=True)
        on_user_post_save(sender=None, instance=user, created=False)
        mock_sync.assert_called_once_with(50)

    @patch("apps.ai_module.signals.schedule_profile_deactivation")
    def test_user_post_save_inactive_alumni_triggers_deactivation(self, mock_deact):
        """Inactive alumni User save triggers schedule_profile_deactivation."""
        user = MagicMock(id=51, role="ALUMNI", is_active=False)
        on_user_post_save(sender=None, instance=user, created=False)
        mock_deact.assert_called_once_with(51, role="ALUMNI")

    @patch("apps.ai_module.signals.schedule_profile_sync")
    @patch("apps.ai_module.signals.schedule_profile_deactivation")
    def test_user_post_save_admin_ignored(self, mock_deact, mock_sync):
        """Non-profile roles (ADMIN, PLACEMENT_CELL) are ignored by signals."""
        user = MagicMock(id=1, role="ADMIN", is_active=True)
        on_user_post_save(sender=None, instance=user, created=False)
        mock_sync.assert_not_called()
        mock_deact.assert_not_called()

    @patch("apps.ai_module.signals.schedule_profile_deletion")
    def test_user_post_delete_triggers_deletion(self, mock_delete):
        """User post_delete triggers schedule_profile_deletion."""
        user = MagicMock(id=52, role="STUDENT")
        on_user_post_delete(sender=None, instance=user)
        mock_delete.assert_called_once_with(52, role="STUDENT")

    @patch("apps.ai_module.signals.schedule_profile_sync")
    def test_student_profile_post_save_triggers_sync(self, mock_sync):
        """StudentProfile post_save triggers schedule_profile_sync with user_id."""
        profile = MagicMock(user_id=70)
        on_student_profile_post_save(sender=None, instance=profile, created=True)
        mock_sync.assert_called_once_with(70)

    @patch("apps.ai_module.signals.schedule_profile_deletion")
    def test_student_profile_post_delete_triggers_deletion(self, mock_delete):
        """StudentProfile post_delete triggers schedule_profile_deletion."""
        profile = MagicMock(user_id=70)
        on_student_profile_post_delete(sender=None, instance=profile)
        mock_delete.assert_called_once_with(70, role="STUDENT")

    @patch("apps.ai_module.signals.schedule_profile_sync")
    def test_alumni_profile_post_save_triggers_sync(self, mock_sync):
        """AlumniProfile post_save triggers schedule_profile_sync with user_id."""
        profile = MagicMock(user_id=80)
        on_alumni_profile_post_save(sender=None, instance=profile, created=False)
        mock_sync.assert_called_once_with(80)

    @patch("apps.ai_module.signals.schedule_profile_deletion")
    def test_alumni_profile_post_delete_triggers_deletion(self, mock_delete):
        """AlumniProfile post_delete triggers schedule_profile_deletion."""
        profile = MagicMock(user_id=80)
        on_alumni_profile_post_delete(sender=None, instance=profile)
        mock_delete.assert_called_once_with(80, role="ALUMNI")

    @patch("apps.ai_module.signals.schedule_profile_sync")
    def test_user_skill_post_save_triggers_sync(self, mock_sync):
        """UserSkill post_save triggers schedule_profile_sync with user_id."""
        skill = MagicMock(user_id=90)
        on_user_skill_post_save(sender=None, instance=skill, created=True)
        mock_sync.assert_called_once_with(90)

    @patch("apps.ai_module.signals.schedule_profile_sync")
    def test_user_skill_post_delete_triggers_sync(self, mock_sync):
        """UserSkill post_delete triggers schedule_profile_sync with user_id to refresh chunks."""
        skill = MagicMock(user_id=90)
        on_user_skill_post_delete(sender=None, instance=skill)
        mock_sync.assert_called_once_with(90)
