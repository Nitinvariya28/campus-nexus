import hashlib
import json
import logging
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional
from django.conf import settings

logger = logging.getLogger(__name__)

CATEGORY_NORMALIZATION_MAP = {
    "NIRMA": "NIRMA",
    "Nirma": "NIRMA",
    "NSU": "NIRMA",
    "Placement": "PLACEMENT_CELL",
    "PLACEMENT_CELL": "PLACEMENT_CELL",
    "Interview_Preparation": "INTERVIEW_PREP",
    "INTERVIEW_PREP": "INTERVIEW_PREP",
    "Industry_Technology": "INDUSTRY_TECH",
    "INDUSTRY_TECH": "INDUSTRY_TECH",
}


@dataclass
class KnowledgeDocument:
    document_id: str
    title: str
    category: str
    relative_path: str
    content: str
    content_hash: str
    word_count: int


class KnowledgeDocumentLoader:
    """
    Discovers, verifies, and loads substantive Markdown documents from the
    AlumiBridge RAG Knowledge Dataset.
    """

    def __init__(self, data_dir: Optional[str] = None):
        self.data_dir = self._resolve_data_dir(data_dir)

    def _resolve_data_dir(self, explicit_path: Optional[str] = None) -> Path:
        """Resolves the root directory containing RAG documents."""
        candidates = []
        if explicit_path:
            candidates.append(Path(explicit_path))

        settings_dir = getattr(settings, "RAG_DATA_DIR", None)
        if settings_dir:
            candidates.append(Path(settings_dir))

        base_dir = getattr(settings, "BASE_DIR", None)
        if base_dir:
            candidates.append(Path(base_dir) / "data" / "rag_knowledge")

        # Fallback to external documentation path
        candidates.append(Path(r"E:\Documents\Camera Roll\alumiBridge\documentation\AI\RAG_SYSTEM_EXTERNAL_DATA"))

        for path in candidates:
            if path and path.exists() and path.is_dir():
                logger.debug(f"[Knowledge Loader] Resolved RAG data directory: {path}")
                return path

        raise FileNotFoundError(
            f"Could not locate RAG data directory in any evaluated location: {[str(p) for p in candidates]}"
        )

    def load_manifest(self) -> Optional[Dict[str, Any]]:
        """Loads dataset_manifest.json if present in the data directory."""
        manifest_path = self.data_dir / "dataset_manifest.json"
        if manifest_path.exists():
            try:
                with open(manifest_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"[Knowledge Loader] Failed reading manifest at {manifest_path}: {e}")
        return None

    def load_documents(self, category_filter: Optional[str] = None) -> List[KnowledgeDocument]:
        """
        Loads all substantive knowledge documents matching the optional category filter.
        """
        manifest = self.load_manifest()
        loaded_docs: List[KnowledgeDocument] = []

        if manifest and "documents" in manifest:
            # Load driven by manifest
            for doc_entry in manifest["documents"]:
                raw_cat = doc_entry.get("category", "")
                normalized_cat = CATEGORY_NORMALIZATION_MAP.get(raw_cat, raw_cat.upper())

                if category_filter and normalized_cat != category_filter.upper():
                    continue

                rel_path = doc_entry.get("relative_path", "")
                full_path = self.data_dir / rel_path

                if not full_path.exists():
                    logger.warning(f"[Knowledge Loader] File missing from manifest: {full_path}")
                    continue

                try:
                    with open(full_path, "r", encoding="utf-8") as f:
                        content = f.read()

                    doc_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()
                    doc_id = doc_entry.get("document_id", full_path.stem)
                    title = doc_entry.get("title", full_path.stem.replace("_", " ").title())

                    loaded_docs.append(
                        KnowledgeDocument(
                            document_id=doc_id,
                            title=title,
                            category=normalized_cat,
                            relative_path=rel_path,
                            content=content,
                            content_hash=doc_hash,
                            word_count=len(content.split()),
                        )
                    )
                except Exception as e:
                    logger.error(f"[Knowledge Loader] Error reading {full_path}: {e}")

        else:
            # Fallback to direct directory walk
            logger.info("[Knowledge Loader] Manifest missing, performing direct directory walk.")
            for root, _, files in os.walk(self.data_dir):
                for fname in files:
                    if not fname.endswith(".md") or fname.lower() == "readme.md":
                        continue

                    full_path = Path(root) / fname
                    rel_path = str(full_path.relative_to(self.data_dir)).replace("\\", "/")
                    parent_folder = Path(rel_path).parts[0]

                    normalized_cat = CATEGORY_NORMALIZATION_MAP.get(parent_folder, parent_folder.upper())
                    if category_filter and normalized_cat != category_filter.upper():
                        continue

                    try:
                        with open(full_path, "r", encoding="utf-8") as f:
                            content = f.read()

                        # Extract title from first H1 header if possible
                        lines = content.split("\n")
                        title = full_path.stem.replace("_", " ").title()
                        for line in lines:
                            if line.strip().startswith("# "):
                                title = line.strip("# ").strip()
                                break

                        doc_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()
                        doc_id = full_path.stem.upper()

                        loaded_docs.append(
                            KnowledgeDocument(
                                document_id=doc_id,
                                title=title,
                                category=normalized_cat,
                                relative_path=rel_path,
                                content=content,
                                content_hash=doc_hash,
                                word_count=len(content.split()),
                            )
                        )
                    except Exception as e:
                        logger.error(f"[Knowledge Loader] Error reading {full_path}: {e}")

        logger.info(f"[Knowledge Loader] Loaded {len(loaded_docs)} substantive documents from {self.data_dir}")
        return loaded_docs
