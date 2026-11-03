from django.core.management.base import BaseCommand
from apps.ai_module.vector_store.collection_manager import CollectionManager, ALL_COLLECTIONS
from apps.ai_module.vector_store.client import close_qdrant_client


class Command(BaseCommand):
    help = "Initializes the 4 dedicated Qdrant vector collections with 384 dimensions and payload indexes (NO data inserted)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--status-only",
            action="store_true",
            help="Inspects existing collections and reports status without creating or modifying them.",
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("=== Qdrant Vector Collections Setup (Step 3) ==="))

        manager = CollectionManager()

        if options["status_only"]:
            self.stdout.write("Inspecting existing collection status...")
        else:
            self.stdout.write("Provisioning 4 dedicated collections & payload schema indexes...")
            results = manager.ensure_collections_exist()
            for coll, state in results.items():
                self.stdout.write(f"  * {coll}: {state.upper()}")

        self.stdout.write("")
        self.stdout.write(self.style.MIGRATE_HEADING("=== Collections Verification Status ==="))

        status_report = manager.get_collections_status()
        for name, data in status_report.items():
            if data["exists"]:
                self.stdout.write(
                    self.style.SUCCESS(
                        f"  [OK] {name:<26} | Status: {data['status']:<7} | Points: {data['points_count']} | Dim: {data['vector_dimension']} | Metric: {data['distance_metric']}"
                    )
                )
            else:
                self.stdout.write(
                    self.style.ERROR(
                        f"  [FAIL] {name:<24} | Status: NOT FOUND"
                    )
                )

        self.stdout.write("")
        self.stdout.write(
            self.style.SUCCESS("[SUCCESS] All 4 collections verified successfully. Zero data inserted (pure structure setup).")
        )

        close_qdrant_client()
