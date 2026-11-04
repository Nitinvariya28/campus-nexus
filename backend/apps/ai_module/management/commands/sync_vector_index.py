import logging
import time
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

from apps.ai_module.models import VectorIndexState
from apps.ai_module.vector_store.vector_lifecycle import sync_user_profile_vector
from apps.ai_module.indexing.profile_document_builder import is_profile_ready

logger = logging.getLogger(__name__)
User = get_user_model()


class Command(BaseCommand):
    help = (
        "Phase 8: Background Vector Index Reconciliation Worker. "
        "Scans VectorIndexState for PENDING or FAILED records and attempts "
        "to reconcile and synchronize them into Qdrant collections."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--retry-failed",
            action="store_true",
            default=True,
            help="Retry records currently marked as FAILED (default: True)",
        )
        parser.add_argument(
            "--retry-pending",
            action="store_true",
            default=True,
            help="Retry records currently marked as PENDING (default: True)",
        )
        parser.add_argument(
            "--role",
            type=str,
            default="ALL",
            choices=["STUDENT", "ALUMNI", "ALL"],
            help="Filter by target user role (default: ALL)",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=None,
            help="Maximum number of records to reconcile in this execution run",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Simulate reconciliation without upserting to Qdrant or updating DB",
        )

    def handle(self, *args, **options):
        retry_failed = options.get("retry_failed")
        retry_pending = options.get("retry_pending")
        role = options.get("role")
        limit = options.get("limit")
        dry_run = options.get("dry_run", False)

        statuses = []
        if retry_pending:
            statuses.append("PENDING")
        if retry_failed:
            statuses.append("FAILED")

        mode_str = "DRY RUN (Simulation)" if dry_run else "LIVE RECONCILIATION"

        self.stdout.write(self.style.MIGRATE_HEADING("\n" + "=" * 68))
        self.stdout.write(self.style.MIGRATE_HEADING("   VECTOR INDEX RECONCILIATION WORKER (STEP 8)"))
        self.stdout.write(self.style.MIGRATE_HEADING(f"   Mode: {mode_str} | Target Statuses: {statuses}"))
        self.stdout.write(self.style.MIGRATE_HEADING("=" * 68 + "\n"))

        start_time = time.time()
        states_qs = VectorIndexState.objects.filter(
            source_type="PROFILE",
            status__in=statuses,
        ).order_by("requested_at")

        total_target = states_qs.count()
        if total_target == 0:
            self.stdout.write(self.style.SUCCESS("  [OK] No PENDING or FAILED records found in Table 31. Vector store is in sync!"))
            return

        if limit and limit > 0:
            states_qs = states_qs[:limit]

        reconciled = 0
        still_pending = 0
        failed = 0
        skipped_unchanged = 0
        errors = []

        for state in states_qs:
            user_id = state.source_id
            try:
                try:
                    user = User.objects.select_related(
                        "student_profile__department",
                        "student_profile__batch",
                        "alumni_profile__department",
                        "alumni_profile__batch",
                        "alumni_profile__current_company",
                    ).prefetch_related(
                        "user_skills__skill__category",
                    ).get(id=user_id)
                except User.DoesNotExist:
                    # User was deleted from MySQL
                    if not dry_run:
                        state.delete()
                    continue

                if role in ("STUDENT", "ALUMNI") and user.role != role:
                    continue

                # Check readiness
                ready, reason = is_profile_ready(user)
                if not ready:
                    still_pending += 1
                    if not dry_run:
                        state.last_error = f"Not ready: {reason}"
                        state.save(update_fields=["last_error", "requested_at"])
                    continue

                if dry_run:
                    reconciled += 1
                else:
                    outcome = sync_user_profile_vector(user_id=user_id, force=True, sync_db_state=True)
                    st = outcome.get("status")
                    if st == "SYNCED":
                        reconciled += 1
                    elif st == "SKIPPED_UNCHANGED":
                        skipped_unchanged += 1
                    elif st == "SKIPPED_NOT_READY":
                        still_pending += 1

            except Exception as e:
                failed += 1
                errors.append({"user_id": user_id, "error": str(e)})
                if not dry_run:
                    state.status = "FAILED"
                    state.last_error = str(e)
                    state.save(update_fields=["status", "last_error", "requested_at"])

        elapsed = round(time.time() - start_time, 2)
        self.stdout.write(self.style.MIGRATE_HEADING("\n" + "=" * 68))
        self.stdout.write(self.style.MIGRATE_HEADING("   RECONCILIATION SUMMARY"))
        self.stdout.write(self.style.MIGRATE_HEADING("=" * 68))
        self.stdout.write(self.style.SUCCESS(f"  Successfully Reconciled (SYNCED):  {reconciled}"))
        self.stdout.write(self.style.WARNING(f"  Still Pending (Profile Incomplete): {still_pending}"))
        self.stdout.write(f"  Skipped Unchanged:                  {skipped_unchanged}")
        self.stdout.write(self.style.ERROR(f"  Failed / Encountered Errors:        {failed}"))
        self.stdout.write(f"  Elapsed Time:                       {elapsed} seconds")
        self.stdout.write(self.style.MIGRATE_HEADING("=" * 68 + "\n"))
