import time
from django.core.management.base import BaseCommand
from apps.ai_module.rag.knowledge_indexer import KnowledgeIndexer


class Command(BaseCommand):
    help = (
        "Phase 15 (Steps 2, 3 & 4): Ingests, chunks, embeds, and indexes the "
        "48 AlumiBridge RAG Knowledge Documents into Qdrant collection 'knowledge_vectors'."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--category",
            type=str,
            default=None,
            help="Optional domain category filter: NSU, PLACEMENT_CELL, INTERVIEW_PREP, or INDUSTRY_TECH",
        )
        parser.add_argument(
            "--batch-size",
            type=int,
            default=32,
            help="Batch size for embedding generation and Qdrant upserts (default: 32)",
        )

    def handle(self, *args, **options):
        category = options.get("category")
        batch_size = options.get("batch_size", 32)

        self.stdout.write(
            self.style.MIGRATE_HEADING(
                f"Starting RAG Knowledge Indexing Engine (Category: {category or 'ALL'})..."
            )
        )

        indexer = KnowledgeIndexer()
        start = time.time()
        result = indexer.index_all(category_filter=category, batch_size=batch_size)

        if result["status"] == "SUCCESS":
            info = indexer.get_collection_info()
            self.stdout.write(
                self.style.SUCCESS(
                    f"\n[OK] RAG Knowledge Indexing Completed Successfully!\n"
                    f" - Documents Processed: {result['documents_count']}\n"
                    f" - Chunks Generated:    {result['chunks_count']}\n"
                    f" - Points Upserted:     {result['points_upserted']}\n"
                    f" - Elapsed Time:        {result['elapsed_seconds']}s\n"
                    f" - Total Points in Qdrant: {info['points_count']}\n"
                )
            )
        else:
            self.stdout.write(
                self.style.WARNING(f"\n[WARNING] Indexing returned status: {result['status']}")
            )
