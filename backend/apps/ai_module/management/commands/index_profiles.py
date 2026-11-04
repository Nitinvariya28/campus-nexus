import time
from django.core.management.base import BaseCommand
from apps.ai_module.indexing.profile_indexer import ProfileIndexer
from apps.ai_module.vector_store.client import get_qdrant_client
from apps.ai_module.vector_store.collection_manager import (
    COLLECTION_STUDENT_VECTORS,
    COLLECTION_ALUMNI_VECTORS,
)


class Command(BaseCommand):
    help = (
        "Phase 7: Profile Indexer & Management Backfill CLI. "
        "Batch indexes active students and alumni into Qdrant collections "
        "(student_vectors and alumni_vectors) with readiness gating, "
        "SHA-256 change detection, memory-safe streaming, and error isolation."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--role",
            type=str,
            default="ALL",
            choices=["STUDENT", "ALUMNI", "ALL"],
            help="Target role to index: STUDENT, ALUMNI, or ALL (default: ALL)",
        )
        parser.add_argument(
            "--batch-size",
            type=int,
            default=50,
            help="Database cursor batch size (default: 50)",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=None,
            help="Maximum number of records to process (useful for testing small batches)",
        )
        parser.add_argument(
            "--user-id",
            type=int,
            default=None,
            help="Index a single specific user by ID",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Simulate indexing: evaluate readiness and hashes without writing to Qdrant or MySQL",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Bypass hash checks and force re-embedding of all eligible profiles",
        )

    def handle(self, *args, **options):
        role = options.get("role")
        batch_size = options.get("batch_size")
        limit = options.get("limit")
        user_id = options.get("user_id")
        dry_run = options.get("dry_run", False)
        force = options.get("force", False)

        mode_str = "DRY RUN (Simulation)" if dry_run else "LIVE EXECUTION"

        self.stdout.write(self.style.MIGRATE_HEADING("\n" + "=" * 68))
        self.stdout.write(self.style.MIGRATE_HEADING(f"   PROFILE BATCH INDEXING & BACKFILL ENGINE (STEP 7)"))
        self.stdout.write(self.style.MIGRATE_HEADING(f"   Mode: {mode_str} | Role: {role}"))
        self.stdout.write(self.style.MIGRATE_HEADING("=" * 68 + "\n"))

        indexer = ProfileIndexer()

        # Case 1: Single User Targeted
        if user_id:
            self.stdout.write(self.style.WARNING(f"Processing Single User #{user_id}..."))
            if dry_run:
                self.stdout.write(self.style.SUCCESS(f"  [DRY RUN] Evaluated User #{user_id}. No changes written."))
                return

            outcome = indexer.index_single_user(user_id=user_id, force=force)
            status = outcome.get("status")
            if status == "SYNCED":
                self.stdout.write(self.style.SUCCESS(
                    f"  [OK] User #{user_id} ({outcome.get('role')}) synced successfully.\n"
                    f"       Points upserted: {outcome.get('chunk_count')} | Hash: {outcome.get('hash')[:16]}..."
                ))
            elif status == "SKIPPED_UNCHANGED":
                self.stdout.write(self.style.WARNING(
                    f"  [SKIP] User #{user_id} profile unchanged (SHA-256 matched). Use --force to re-embed."
                ))
            elif status == "SKIPPED_NOT_READY":
                self.stdout.write(self.style.ERROR(
                    f"  [NOT READY] User #{user_id}: {outcome.get('reason')}"
                ))
            return

        # Case 2: Batch Run
        def progress_tracker(current_stats, total_count):
            scanned = current_stats["total_scanned"]
            synced = current_stats["synced_users"]
            skipped_not_ready = current_stats["skipped_not_ready"]
            skipped_unchanged = current_stats["skipped_unchanged"]
            pct = int((scanned / total_count) * 100) if total_count > 0 else 100
            self.stdout.write(
                f"  [{pct:>3}%] Scanned: {scanned:>4}/{total_count} | Synced: {synced:>4} | "
                f"Unchanged: {skipped_unchanged:>4} | Not Ready: {skipped_not_ready:>3}"
            )

        self.stdout.write(self.style.WARNING(f"Starting batch scan (Batch Size: {batch_size}, Limit: {limit or 'ALL'})...\n"))

        stats = indexer.run_batch_index(
            role=role,
            batch_size=batch_size,
            limit=limit,
            dry_run=dry_run,
            force=force,
            progress_callback=progress_tracker,
        )

        # Inspect current Qdrant point counts
        client = get_qdrant_client()
        try:
            student_col = client.get_collection(COLLECTION_STUDENT_VECTORS)
            student_points = student_col.points_count
        except Exception:
            student_points = "N/A"

        try:
            alumni_col = client.get_collection(COLLECTION_ALUMNI_VECTORS)
            alumni_points = alumni_col.points_count
        except Exception:
            alumni_points = "N/A"

        # Final Summary Table
        elapsed = stats["elapsed_seconds"]
        throughput = round(stats["total_scanned"] / elapsed, 1) if elapsed > 0 else 0.0

        self.stdout.write(self.style.MIGRATE_HEADING("\n" + "=" * 68))
        self.stdout.write(self.style.MIGRATE_HEADING("   INDEXING & BACKFILL COMPREHENSIVE SUMMARY"))
        self.stdout.write(self.style.MIGRATE_HEADING("=" * 68))
        self.stdout.write(f"  Execution Mode:         {mode_str}")
        self.stdout.write(f"  Target Role:            {role}")
        self.stdout.write(f"  Total Users Scanned:    {stats['total_scanned']}")
        self.stdout.write("-" * 68)
        self.stdout.write(self.style.SUCCESS(f"  Successfully Synced:    {stats['synced_users']} users ({stats['total_points_upserted']} vector points)"))
        self.stdout.write(self.style.WARNING(f"  Skipped (Unchanged):    {stats['skipped_unchanged']} users (SHA-256 matched, 0 CPU wasted)"))
        self.stdout.write(f"  Skipped (Not Ready):    {stats['skipped_not_ready']} users (Incomplete profile or 0 skills)")
        self.stdout.write(f"  Failed / Errors:        {stats['failed']} users")
        self.stdout.write("-" * 68)
        self.stdout.write(f"  Elapsed Time:           {elapsed} seconds ({throughput} users/sec)")
        self.stdout.write(f"  Qdrant student_vectors: {student_points} points")
        self.stdout.write(f"  Qdrant alumni_vectors:  {alumni_points} points")
        self.stdout.write(self.style.MIGRATE_HEADING("=" * 68 + "\n"))

        if stats["errors"]:
            self.stdout.write(self.style.ERROR(f"Encountered {len(stats['errors'])} error(s):"))
            for err in stats["errors"][:5]:
                self.stdout.write(self.style.ERROR(f"  * User #{err['user_id']}: {err['error']}"))
            if len(stats["errors"]) > 5:
                self.stdout.write(self.style.ERROR(f"  ... and {len(stats['errors']) - 5} more errors logged to Table 31."))
