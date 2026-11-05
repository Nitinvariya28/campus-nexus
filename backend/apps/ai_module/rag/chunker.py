import re
import uuid
import logging
from dataclasses import dataclass
from typing import List, Optional, Tuple

from apps.ai_module.rag.document_loader import KnowledgeDocument

logger = logging.getLogger(__name__)

# Heuristic: 1 token ≈ 0.75 words (or 1 word ≈ 1.33 tokens)
WORDS_PER_TOKEN = 0.75


@dataclass
class KnowledgeChunk:
    chunk_id: str
    document_id: str
    title: str
    category: str
    section: str
    chunk_index: int
    total_chunks: int
    text: str
    char_count: int
    approx_tokens: int


class MarkdownSemanticChunker:
    """
    Structure-Aware Hierarchical Markdown Chunker (Step 2).
    Divides documents by semantic headings, enforces target token bounds with
    a 15% sliding window overlap across paragraph boundaries, and prepends
    contextual metadata breadcrumbs.
    """

    def __init__(
        self,
        target_chunk_tokens: int = 450,
        overlap_tokens: int = 70,
    ):
        self.target_chunk_tokens = target_chunk_tokens
        self.overlap_tokens = overlap_tokens

    def _estimate_tokens(self, text: str) -> int:
        """Estimates token count from whitespace-delimited words."""
        words = len(text.split())
        return max(1, int(words / WORDS_PER_TOKEN))

    def _split_into_sections(self, content: str) -> List[Tuple[str, str]]:
        """
        Splits Markdown content by H1, H2, and H3 headers.
        Returns a list of tuples: (section_title, section_text).
        """
        lines = content.split("\n")
        sections: List[Tuple[str, List[str]]] = []

        current_header = "Introduction / Overview"
        current_lines: List[str] = []

        header_regex = re.compile(r"^(#{1,3})\s+(.+)$")

        for line in lines:
            match = header_regex.match(line.strip())
            if match:
                if current_lines:
                    text_block = "\n".join(current_lines).strip()
                    if text_block:
                        sections.append((current_header, text_block))
                current_header = match.group(2).strip()
                current_lines = [line]
            else:
                current_lines.append(line)

        if current_lines:
            text_block = "\n".join(current_lines).strip()
            if text_block:
                sections.append((current_header, text_block))

        return sections

    def _subdivide_large_section(self, section_text: str) -> List[str]:
        """
        Subdivides a section that exceeds target token limits across paragraph boundaries
        with a 15% sliding window overlap.
        """
        paragraphs = [p.strip() for p in section_text.split("\n\n") if p.strip()]
        if not paragraphs:
            return [section_text]

        chunks_text: List[str] = []
        current_paras: List[str] = []
        current_tokens = 0

        for para in paragraphs:
            para_tokens = self._estimate_tokens(para)

            # If adding this paragraph exceeds target token size and we already have content:
            if current_tokens + para_tokens > self.target_chunk_tokens and current_paras:
                chunks_text.append("\n\n".join(current_paras))

                # Slide window: keep the last paragraph if it's within overlap threshold
                overlap_paras = []
                overlap_count = 0
                for op in reversed(current_paras):
                    op_tok = self._estimate_tokens(op)
                    if overlap_count + op_tok <= self.overlap_tokens:
                        overlap_paras.insert(0, op)
                        overlap_count += op_tok
                    else:
                        break

                current_paras = overlap_paras + [para]
                current_tokens = sum(self._estimate_tokens(p) for p in current_paras)
            else:
                current_paras.append(para)
                current_tokens += para_tokens

        if current_paras:
            chunks_text.append("\n\n".join(current_paras))

        return chunks_text

    def chunk_document(self, doc: KnowledgeDocument) -> List[KnowledgeChunk]:
        """
        Chunks a single KnowledgeDocument into discrete, metadata-enriched KnowledgeChunk instances.
        """
        raw_sections = self._split_into_sections(doc.content)
        intermediate_chunks: List[Tuple[str, str]] = []

        for sec_title, sec_text in raw_sections:
            tokens = self._estimate_tokens(sec_text)
            if tokens <= self.target_chunk_tokens:
                intermediate_chunks.append((sec_title, sec_text))
            else:
                sub_blocks = self._subdivide_large_section(sec_text)
                for block in sub_blocks:
                    intermediate_chunks.append((sec_title, block))

        total_chunks = len(intermediate_chunks)
        final_chunks: List[KnowledgeChunk] = []

        for idx, (sec_title, body_text) in enumerate(intermediate_chunks):
            # Prepend contextual breadcrumb
            breadcrumb = f"[Document: {doc.title} | Section: {sec_title} | Category: {doc.category}]\n\n"
            full_chunk_text = breadcrumb + body_text

            # Deterministic UUID5 point ID
            chunk_uuid = str(
                uuid.uuid5(
                    uuid.NAMESPACE_DNS,
                    f"knowledge_{doc.document_id}_{idx}"
                )
            )

            est_tokens = self._estimate_tokens(full_chunk_text)

            final_chunks.append(
                KnowledgeChunk(
                    chunk_id=chunk_uuid,
                    document_id=doc.document_id,
                    title=doc.title,
                    category=doc.category,
                    section=sec_title,
                    chunk_index=idx,
                    total_chunks=total_chunks,
                    text=full_chunk_text,
                    char_count=len(full_chunk_text),
                    approx_tokens=est_tokens,
                )
            )

        return final_chunks
