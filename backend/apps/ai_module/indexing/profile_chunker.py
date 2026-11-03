import hashlib
import logging
from dataclasses import dataclass
from typing import Dict, Any, List, Tuple, Union, Optional

from apps.ai_module.indexing.profile_document_builder import build_user_document
from apps.ai_module.vector_store.point_id_generator import (
    generate_student_point_id,
    generate_alumni_point_id,
)
from apps.ai_module.vector_store.payload_builder import (
    build_student_payload,
    build_alumni_payload,
)

logger = logging.getLogger(__name__)

# Token window boundaries for all-MiniLM-L6-v2
TARGET_MIN_TOKENS = 60
TARGET_MAX_TOKENS = 220
SLIDING_WINDOW_OVERLAP = 30

_tokenizer_instance = None


def get_tokenizer():
    """Lazy singleton for the HuggingFace tokenizer with offline cache fallback."""
    global _tokenizer_instance
    if _tokenizer_instance is None:
        try:
            from transformers import AutoTokenizer
            try:
                _tokenizer_instance = AutoTokenizer.from_pretrained(
                    "sentence-transformers/all-MiniLM-L6-v2",
                    local_files_only=True
                )
            except Exception:
                _tokenizer_instance = AutoTokenizer.from_pretrained(
                    "sentence-transformers/all-MiniLM-L6-v2"
                )
        except Exception as e:
            logger.warning(f"Could not load HuggingFace tokenizer ({e}), using word-based estimation.")
            _tokenizer_instance = None
    return _tokenizer_instance


def count_tokens(text: str) -> int:
    """Counts tokens accurately using the MiniLM tokenizer or word-ratio fallback."""
    if not text:
        return 0
    tokenizer = get_tokenizer()
    if tokenizer is not None:
        try:
            return len(tokenizer.encode(text, add_special_tokens=False))
        except Exception:
            pass
    # Fallback heuristic: 1 word ~= 1.33 subword tokens
    return max(1, int(len(text.split()) * 1.33))


@dataclass
class ProfileChunk:
    """Represents a validated, token-bounded semantic chunk ready for vectorization."""
    chunk_type: str
    chunk_index: int
    point_id: str
    text: str
    token_count: int
    payload: Dict[str, Any]


def split_text_into_token_windows(
    text: str,
    max_tokens: int = TARGET_MAX_TOKENS,
    overlap_tokens: int = SLIDING_WINDOW_OVERLAP
) -> List[str]:
    """
    Splits long text into overlapping token windows if it exceeds max_tokens.
    For standard profiles (< 220 tokens), returns a single item list.
    """
    if not text or not text.strip():
        return []

    tokenizer = get_tokenizer()
    total_tokens = count_tokens(text)

    if total_tokens <= max_tokens:
        return [text.strip()]

    # If tokenizer is available, perform word-level boundary splitting
    words = text.strip().split()
    chunks = []
    current_words: List[str] = []

    for word in words:
        current_words.append(word)
        current_text = " ".join(current_words)
        if count_tokens(current_text) >= max_tokens:
            chunks.append(current_text)
            # Retain overlap words for context continuity
            step_back = max(1, int(len(current_words) * (overlap_tokens / max_tokens)))
            current_words = current_words[-step_back:]

    if current_words:
        remaining_text = " ".join(current_words)
        if not chunks or remaining_text != chunks[-1]:
            chunks.append(remaining_text)

    return chunks if chunks else [text.strip()]


def compute_profile_content_hash(raw_facets: List[Dict[str, Any]]) -> str:
    """
    Computes a deterministic SHA-256 fingerprint over all generated facet texts.
    Used by VectorIndexState (Table 31) for zero-latency change detection.
    """
    components = []
    for f in raw_facets:
        c_type = f.get("chunk_type", "")
        c_idx = f.get("chunk_index", 0)
        c_text = f.get("text", "").strip()
        components.append(f"{c_type}:{c_idx}:{c_text}")
    combined_str = "||".join(components)
    return hashlib.sha256(combined_str.encode("utf-8")).hexdigest()


def chunk_user_profile(user_or_id: Union[Any, int]) -> Tuple[List[ProfileChunk], str, Dict[str, Any]]:
    """
    Master chunking entry point for user profiles.
    1. Builds normalized document representation via profile_document_builder.
    2. Validates and tokenizes semantic facets.
    3. Computes deterministic SHA-256 content_hash.
    4. Generates deterministic UUID5 point IDs.
    5. Assembles clean, PII-safe Qdrant payloads.

    Returns:
        (chunks: List[ProfileChunk], content_hash: str, metadata: Dict[str, Any])
    """
    doc = build_user_document(user_or_id)
    user_id = doc["user_id"]
    role = doc["role"]
    metadata = doc["metadata"]
    facets = doc["facets"]

    # 1. Expand facets through sliding-window chunker if needed
    expanded_chunks: List[Dict[str, Any]] = []
    for facet in facets:
        c_type = facet["chunk_type"]
        raw_text = facet["text"]
        windows = split_text_into_token_windows(raw_text, max_tokens=TARGET_MAX_TOKENS)

        for idx, win_text in enumerate(windows):
            token_len = count_tokens(win_text)
            expanded_chunks.append({
                "chunk_type": c_type,
                "chunk_index": idx,
                "text": win_text,
                "token_count": token_len,
            })

    # 2. Compute SHA-256 content_hash over the expanded facets
    content_hash = compute_profile_content_hash(expanded_chunks)

    # 3. Assemble ProfileChunk objects with point IDs and validated payloads
    profile_chunks: List[ProfileChunk] = []
    for item in expanded_chunks:
        c_type = item["chunk_type"]
        c_idx = item["chunk_index"]
        c_text = item["text"]
        t_count = item["token_count"]

        if role == "STUDENT":
            point_id = generate_student_point_id(user_id=user_id, chunk_type=c_type, chunk_index=c_idx)
            payload = build_student_payload(
                user_id=user_id,
                chunk_type=c_type,
                chunk_index=c_idx,
                department_id=metadata.get("department_id"),
                batch_id=metadata.get("batch_id"),
                semester=metadata.get("semester"),
                content_hash=content_hash,
                department_code=metadata.get("department_code"),
                batch_period=metadata.get("batch_period"),
                skills_count=metadata.get("skills_count", 0),
                has_resume=metadata.get("has_resume", False),
                is_active=metadata.get("is_active", True),
            )
        elif role == "ALUMNI":
            point_id = generate_alumni_point_id(user_id=user_id, chunk_type=c_type, chunk_index=c_idx)
            payload = build_alumni_payload(
                user_id=user_id,
                chunk_type=c_type,
                chunk_index=c_idx,
                company_id=metadata.get("company_id"),
                department_id=metadata.get("department_id"),
                graduation_year=metadata.get("graduation_year"),
                experience_years=metadata.get("experience_years"),
                content_hash=content_hash,
                company_name=metadata.get("company_name"),
                company_tier=metadata.get("company_tier"),
                job_category=metadata.get("job_category"),
                is_active=metadata.get("is_active", True),
            )
        else:
            raise ValueError(f"Unsupported role for profile chunking: {role}")

        profile_chunks.append(ProfileChunk(
            chunk_type=c_type,
            chunk_index=c_idx,
            point_id=point_id,
            text=c_text,
            token_count=t_count,
            payload=payload,
        ))

    return profile_chunks, content_hash, metadata
