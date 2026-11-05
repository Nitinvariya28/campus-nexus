import uuid
from unittest.mock import MagicMock, patch
from django.test import TestCase

from apps.ai_module.rag.document_loader import KnowledgeDocument, KnowledgeDocumentLoader
from apps.ai_module.rag.chunker import MarkdownSemanticChunker, KnowledgeChunk
from apps.ai_module.rag.knowledge_indexer import KnowledgeIndexer

SAMPLE_MARKDOWN = """# Campus Placement Guidelines 2026

## 1. Overview and Purpose
The Campus Placement Cell facilitates employment and internship opportunities for all registered final-year students. This policy outlines eligibility, code of conduct, and recruitment tiers.

## 2. Tiered Recruitment Framework
Placement drives are categorized into three distinct compensation tiers:
- Regular Category: Offers up to 8.0 LPA CTC.
- Dream Category: Offers from 8.0 LPA to 15.0 LPA CTC.
- Super Dream Category: Offers exceeding 15.0 LPA CTC.

### 2.1 Super Dream Eligibility Rules
Students with a cumulative grade point average (CGPA) of 8.0 and above with no standing arrears are eligible to sit for Super Dream drives. If a student secures a Super Dream offer, they are deemed placed and cannot participate in further campus recruitment drives unless permitted by the Placement Director.

## 3. Disciplinary Sanctions
Failure to attend a scheduled interview without prior written approval will result in immediate suspension from the placement portal for two consecutive weeks.
"""


class KnowledgeDocumentLoaderTests(TestCase):
    """Tests loading and metadata extraction of RAG knowledge documents."""

    def test_document_loader_discovers_documents(self):
        loader = KnowledgeDocumentLoader()
        docs = loader.load_documents()
        self.assertGreaterEqual(len(docs), 40)

        # Check first doc attributes
        sample_doc = docs[0]
        self.assertTrue(bool(sample_doc.document_id))
        self.assertTrue(bool(sample_doc.title))
        self.assertIn(
            sample_doc.category,
            ["NSU", "PLACEMENT_CELL", "INTERVIEW_PREP", "INDUSTRY_TECH"],
        )
        self.assertTrue(len(sample_doc.content) > 100)
        self.assertTrue(len(sample_doc.content_hash) == 64)

    def test_category_filtering(self):
        loader = KnowledgeDocumentLoader()
        placement_docs = loader.load_documents(category_filter="PLACEMENT_CELL")
        self.assertGreaterEqual(len(placement_docs), 5)
        for doc in placement_docs:
            self.assertEqual(doc.category, "PLACEMENT_CELL")


class MarkdownSemanticChunkerTests(TestCase):
    """Tests structure-aware hierarchical chunking, sliding window, and deterministic UUIDs."""

    def setUp(self):
        self.chunker = MarkdownSemanticChunker(target_chunk_tokens=100, overlap_tokens=25)
        self.sample_doc = KnowledgeDocument(
            document_id="NSU-PLACE-001",
            title="Campus Placement Guidelines 2026",
            category="PLACEMENT_CELL",
            relative_path="Placement/guidelines.md",
            content=SAMPLE_MARKDOWN,
            content_hash="mockhash123",
            word_count=len(SAMPLE_MARKDOWN.split()),
        )

    def test_chunking_preserves_headers_and_breadcrumbs(self):
        chunks = self.chunker.chunk_document(self.sample_doc)
        self.assertGreaterEqual(len(chunks), 3)

        for chunk in chunks:
            self.assertEqual(chunk.document_id, "NSU-PLACE-001")
            self.assertEqual(chunk.category, "PLACEMENT_CELL")
            # Breadcrumb verification
            self.assertIn("[Document: Campus Placement Guidelines 2026", chunk.text)
            self.assertIn("Category: PLACEMENT_CELL]", chunk.text)
            # Section header verification
            self.assertTrue(bool(chunk.section))

    def test_deterministic_uuid5_generation(self):
        chunks_run_1 = self.chunker.chunk_document(self.sample_doc)
        chunks_run_2 = self.chunker.chunk_document(self.sample_doc)

        self.assertEqual(len(chunks_run_1), len(chunks_run_2))
        for c1, c2 in zip(chunks_run_1, chunks_run_2):
            self.assertEqual(c1.chunk_id, c2.chunk_id)
            # Verify valid UUID format
            val = uuid.UUID(c1.chunk_id)
            self.assertEqual(val.version, 5)


class KnowledgeIndexerTests(TestCase):
    """Tests embedding generation and Qdrant batch upsert logic."""

    @patch("apps.ai_module.rag.knowledge_indexer.get_embedding_service")
    @patch("apps.ai_module.rag.knowledge_indexer.get_qdrant_client")
    def test_knowledge_indexer_batch_upsert(self, mock_get_client, mock_get_embedder):
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client

        mock_embedder = MagicMock()
        # Return a mock 384-dim vector for each text
        mock_embedder.embed_documents.side_effect = lambda texts, batch_size=32: [
            [0.1] * 384 for _ in texts
        ]
        mock_get_embedder.return_value = mock_embedder

        mock_loader = MagicMock()
        mock_loader.load_documents.return_value = [
            KnowledgeDocument(
                document_id="NSU-ACAD-001",
                title="Academic Calendar",
                category="NSU",
                relative_path="NSU/calendar.md",
                content="# Academic Calendar\n\n## 1. Semester Dates\nClasses commence on August 1st.",
                content_hash="calendarhash",
                word_count=15,
            )
        ]

        indexer = KnowledgeIndexer(client=mock_client, loader=mock_loader)
        res = indexer.index_all(batch_size=10)

        self.assertEqual(res["status"], "SUCCESS")
        self.assertEqual(res["documents_count"], 1)
        self.assertGreaterEqual(res["chunks_count"], 1)
        self.assertEqual(res["points_upserted"], res["chunks_count"])

        # Verify Qdrant upsert was called
        mock_client.upsert.assert_called()
        call_kwargs = mock_client.upsert.call_args[1]
        self.assertEqual(call_kwargs["collection_name"], "knowledge_vectors")
        self.assertEqual(len(call_kwargs["points"]), res["chunks_count"])
