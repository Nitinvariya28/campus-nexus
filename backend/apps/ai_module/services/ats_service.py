import logging
import re
from typing import Any, Dict, List, Optional
import numpy as np

from apps.ai_module.resume_processing.extractor import (
    extract_skills_from_text,
    segment_resume_sections,
)
from apps.ai_module.vector_store.embedding_service import get_embedding_service

logger = logging.getLogger(__name__)

DEGREE_PATTERNS = [
    r"\bb\.?tech\b", r"\bb\.?e\b", r"\bm\.?tech\b", r"\bm\.?e\b",
    r"\bbca\b", r"\bmca\b", r"\bbs\b", r"\bms\b", r"\bbachelor",
    r"\bmaster", r"\bph\.?d\b", r"\bcomputer\s+science\b",
    r"\binformation\s+technology\b", r"\bsoftware\s+engineering\b",
    r"\belectronics\b", r"\bdata\s+science\b",
]

SENIOR_KEYWORDS = ["senior", "lead", "principal", "architect", "staff", "head"]
MID_KEYWORDS = ["mid-level", "experienced", "intermediate", "3+ years", "4+ years", "5+ years"]
ENTRY_KEYWORDS = ["entry level", "fresher", "junior", "intern", "associate", "graduate", "0-2 years"]


def _calculate_cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Calculates cosine similarity between two vectors."""
    try:
        a = np.array(vec1, dtype=np.float32)
        b = np.array(vec2, dtype=np.float32)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(np.dot(a, b) / (norm_a * norm_b))
    except Exception as e:
        logger.warning(f"[ATS Service] Vector dot product failed: {e}")
        return 0.5


def _score_semantic_similarity(resume_text: str, jd_text: str) -> float:
    """
    Computes semantic similarity score (0 to 100) using SentenceTransformers.
    """
    try:
        embedder = get_embedding_service()
        # Truncate text to avoid model length overflows
        clean_resume = resume_text[:2000].strip()
        clean_jd = jd_text[:2000].strip()

        r_vec = embedder.embed_query(clean_resume)
        j_vec = embedder.embed_query(clean_jd)
        sim = _calculate_cosine_similarity(r_vec, j_vec)

        # Scale cosine similarity (typically 0.20 to 0.85) to 0 - 100
        scaled = ((sim - 0.20) / 0.65) * 100.0
        return round(float(np.clip(scaled, 15.0, 98.0)), 1)
    except Exception as e:
        logger.warning(f"[ATS Service] Semantic embedding score failed, using fallback: {e}")
        # Word set Jaccard fallback
        r_words = set(re.findall(r"\w+", resume_text.lower()))
        jd_words = set(re.findall(r"\w+", jd_text.lower()))
        if not jd_words:
            return 50.0
        jaccard = len(r_words.intersection(jd_words)) / len(jd_words)
        return round(min(100.0, jaccard * 200.0), 1)


def _score_skills_match(
    resume_skills: List[str], jd_text: str
) -> Dict[str, Any]:
    """
    Evaluates hard and soft skill overlap between candidate resume and target JD.
    """
    jd_skills = extract_skills_from_text(jd_text)

    # Lowercase lookup map
    resume_skills_lower = {s.lower(): s for s in resume_skills}

    matched = []
    missing = []

    for s in jd_skills:
        if s.lower() in resume_skills_lower:
            matched.append(s)
        else:
            missing.append(s)

    # If JD has detected skills:
    if jd_skills:
        score = round(min(100.0, (len(matched) / len(jd_skills)) * 100.0), 1)
    else:
        # If JD has no predefined skills, evaluate how many skills the candidate brings
        count = len(resume_skills)
        score = min(100.0, count * 10.0) if count > 0 else 50.0

    return {
        "score": score,
        "matched_skills": sorted(matched),
        "missing_skills": sorted(missing),
        "jd_skills": jd_skills,
    }


def _score_experience_alignment(
    sections: Dict[str, str], jd_text: str
) -> float:
    """
    Evaluates candidate experience & projects against seniority cues in the JD.
    """
    exp_text = (sections.get("experience", "") + " " + sections.get("projects", "")).lower()
    jd_lower = jd_text.lower()

    base_score = 70.0

    # Check JD seniority target
    is_senior_jd = any(k in jd_lower for k in SENIOR_KEYWORDS)
    is_mid_jd = any(k in jd_lower for k in MID_KEYWORDS)
    is_entry_jd = any(k in jd_lower for k in ENTRY_KEYWORDS)

    # Detect candidate experience indicators
    has_experience_section = bool(sections.get("experience", "").strip())
    has_projects_section = bool(sections.get("projects", "").strip())

    # Count years mentioned (e.g. "3 years", "2+ yrs")
    year_matches = re.findall(r"(\d+)\+?\s*(?:years?|yrs?)", exp_text)
    years_detected = [int(y) for y in year_matches] if year_matches else [0]
    max_years = max(years_detected) if years_detected else 0

    if is_senior_jd:
        if max_years >= 5:
            base_score = 95.0
        elif max_years >= 3 or has_experience_section:
            base_score = 75.0
        else:
            base_score = 55.0
    elif is_mid_jd:
        if max_years >= 2 or has_experience_section:
            base_score = 90.0
        elif has_projects_section:
            base_score = 75.0
        else:
            base_score = 60.0
    else:  # Entry-level / Fresher / General
        if has_experience_section and has_projects_section:
            base_score = 95.0
        elif has_projects_section or has_experience_section:
            base_score = 85.0
        else:
            base_score = 65.0

    # Bonus for metric/quantified bullets (e.g. 20%, 10x, $50k)
    metric_count = len(re.findall(r"\b\d+[\%xX\+]|\$\d+", exp_text))
    bonus = min(10.0, metric_count * 2.5)

    return round(min(100.0, base_score + bonus), 1)


def _score_education_alignment(sections: Dict[str, str], jd_text: str) -> float:
    """
    Verifies degree, major, and graduation cues against JD requirements.
    """
    edu_text = (sections.get("education", "") + " " + sections.get("summary", "")).lower()

    matched_degrees = 0
    for pat in DEGREE_PATTERNS:
        if re.search(pat, edu_text, re.IGNORECASE):
            matched_degrees += 1

    if matched_degrees >= 2:
        return 95.0
    elif matched_degrees == 1:
        return 85.0
    elif bool(sections.get("education", "").strip()):
        return 75.0
    return 50.0


def _score_format_parseability(
    sections: Dict[str, str], raw_text: str, page_count: int
) -> float:
    """
    Evaluates ATS standard section completeness, length, and structure.
    """
    score = 0.0

    # Key section completeness (max 60 pts)
    if sections.get("skills"):
        score += 20.0
    if sections.get("experience") or sections.get("projects"):
        score += 20.0
    if sections.get("education"):
        score += 20.0

    # Length and page count checks (max 20 pts)
    if 1 <= page_count <= 2:
        score += 20.0
    elif page_count == 3:
        score += 10.0
    else:
        score += 5.0

    # Bullet point and structure cleanliness (max 20 pts)
    bullet_count = raw_text.count("- ")
    if bullet_count >= 5:
        score += 20.0
    elif bullet_count >= 2:
        score += 12.0
    else:
        score += 5.0

    return round(min(100.0, score), 1)


def calculate_ats_score(
    resume_text: str,
    job_description: str,
    parsed_sections: Optional[Dict[str, str]] = None,
    extracted_skills: Optional[List[str]] = None,
    page_count: int = 1,
) -> Dict[str, Any]:
    """
    Executes the multi-dimensional ATS Compatibility scoring engine.
    Returns composite score, category rating, 5 breakdown dimensions, and skill lists.
    """
    if parsed_sections is None:
        parsed_sections = segment_resume_sections(resume_text)

    if extracted_skills is None:
        extracted_skills = extract_skills_from_text(resume_text)

    # 1. Semantic Similarity (40%)
    s_semantic = _score_semantic_similarity(resume_text, job_description)

    # 2. Hard & Soft Skills Overlap (30%)
    skills_data = _score_skills_match(extracted_skills, job_description)
    s_skills = skills_data["score"]
    matched_skills = skills_data["matched_skills"]
    missing_skills = skills_data["missing_skills"]

    # 3. Experience & Seniority Alignment (15%)
    s_exp = _score_experience_alignment(parsed_sections, job_description)

    # 4. Academic Alignment (10%)
    s_edu = _score_education_alignment(parsed_sections, job_description)

    # 5. Format & Parseability (5%)
    s_format = _score_format_parseability(parsed_sections, resume_text, page_count)

    # Composite weighted ATS score
    overall = (
        (0.40 * s_semantic)
        + (0.30 * s_skills)
        + (0.15 * s_exp)
        + (0.10 * s_edu)
        + (0.05 * s_format)
    )
    overall = round(max(0.0, min(100.0, overall)), 1)

    # Rating badge
    if overall >= 80.0:
        rating = "STRONG_MATCH"
    elif overall >= 65.0:
        rating = "GOOD_MATCH"
    elif overall >= 50.0:
        rating = "MODERATE_MATCH"
    else:
        rating = "LOW_MATCH"

    return {
        "overall_score": overall,
        "rating": rating,
        "dimensions": {
            "semantic_similarity": {"score": s_semantic, "weight": 0.40},
            "skills_match": {"score": s_skills, "weight": 0.30},
            "experience_match": {"score": s_exp, "weight": 0.15},
            "education_match": {"score": s_edu, "weight": 0.10},
            "formatting_parseability": {"score": s_format, "weight": 0.05},
        },
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
    }
