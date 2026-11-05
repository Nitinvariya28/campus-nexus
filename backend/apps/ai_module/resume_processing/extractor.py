import io
import os
import re
import logging
from typing import Any, Dict, List, Optional, Union
import pypdf
import docx

logger = logging.getLogger(__name__)

# Common tech skills backup dictionary for instant zero-latency token matching
COMMON_TECH_SKILLS = [
    "Python", "Java", "C++", "C", "C#", "JavaScript", "TypeScript", "Go", "Rust", "PHP", "Ruby", "Swift", "Kotlin",
    "Django", "Django REST Framework", "Flask", "FastAPI", "React", "Next.js", "Vue.js", "Angular", "Node.js", "Express",
    "HTML", "CSS", "Tailwind CSS", "Bootstrap", "Redux", "GraphQL", "REST API", "gRPC", "WebSockets",
    "MySQL", "PostgreSQL", "MongoDB", "Redis", "SQLite", "Oracle", "Cassandra", "Elasticsearch",
    "AWS", "Azure", "GCP", "Google Cloud", "Docker", "Kubernetes", "Terraform", "CI/CD", "GitHub Actions", "Jenkins",
    "Linux", "Git", "GitHub", "GitLab", "Bash", "Shell Scripting",
    "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Scikit-Learn", "Pandas", "NumPy", "OpenCV",
    "NLP", "Natural Language Processing", "LLM", "Prompt Engineering", "Vector Databases", "Qdrant",
    "Data Structures", "Algorithms", "Object-Oriented Programming", "Microservices", "System Design", "Agile", "Scrum",
]

# Section header regex patterns
SECTION_PATTERNS = {
    "summary": re.compile(
        r"^(?:professional\s+summary|career\s+objective|profile\s+summary|about\s+me|summary|objective)\b",
        re.IGNORECASE,
    ),
    "skills": re.compile(
        r"^(?:technical\s+skills|core\s+competencies|technologies|skills\s*&\s*abilities|skills|tools\s*&\s*technologies|technical\s+proficiencies)\b",
        re.IGNORECASE,
    ),
    "experience": re.compile(
        r"^(?:work\s+experience|professional\s+experience|employment\s+history|experience|work\s+history|career\s+history|internships?)\b",
        re.IGNORECASE,
    ),
    "projects": re.compile(
        r"^(?:key\s+projects|academic\s+projects|personal\s+projects|notable\s+projects|projects)\b",
        re.IGNORECASE,
    ),
    "education": re.compile(
        r"^(?:academic\s+background|education\s*&\s*qualifications|academic\s+history|qualifications|education)\b",
        re.IGNORECASE,
    ),
    "certifications": re.compile(
        r"^(?:certifications?|licenses\s*&\s*certifications|achievements?|courses|honors\s*&\s*awards)\b",
        re.IGNORECASE,
    ),
}

UNICODE_BULLETS = ["•", "⁃", "◦", "▪", "▫", "‣", "⁃", "–", "—", "»", "✓", "✔"]


def clean_and_normalize_text(text: str) -> str:
    """
    Normalizes extracted resume text:
    - Standardizes bullet glyphs to hyphens.
    - Removes non-printable characters while preserving newlines and indentation.
    - Collapses excessive horizontal whitespace while keeping paragraph structure.
    """
    if not text:
        return ""

    for bullet in UNICODE_BULLETS:
        text = text.replace(bullet, "- ")

    # Normalize carriage returns
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    # Replace weird space characters (non-breaking space, etc.)
    text = re.sub(r"[\u00A0\u2000-\u200B\u2028\u2029]", " ", text)

    # Clean multiple spaces per line
    lines = []
    for line in text.split("\n"):
        cleaned_line = re.sub(r"[ \t]+", " ", line).strip()
        lines.append(cleaned_line)

    # Collapse more than 2 consecutive empty lines into one
    cleaned = "\n".join(lines)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()


def extract_text_from_pdf(file_input: Union[str, io.BytesIO, Any]) -> Dict[str, Any]:
    """
    Extracts text and page count from a PDF file path or file-like object using pypdf.
    """
    reader = pypdf.PdfReader(file_input)
    page_count = len(reader.pages)
    pages_text = []

    for idx, page in enumerate(reader.pages):
        try:
            page_text = page.extract_text() or ""
            pages_text.append(page_text)
        except Exception as e:
            logger.warning(f"[PDF Extraction] Error reading page {idx + 1}: {e}")
            pages_text.append("")

    raw_text = "\n\n".join(pages_text)
    clean_text = clean_and_normalize_text(raw_text)

    return {
        "raw_text": raw_text,
        "clean_text": clean_text,
        "page_count": page_count,
        "file_type": "PDF",
    }


def extract_text_from_docx(file_input: Union[str, io.BytesIO, Any]) -> Dict[str, Any]:
    """
    Extracts text from a DOCX file path or file-like object using python-docx.
    """
    doc = docx.Document(file_input)
    paragraphs_text = [p.text for p in doc.paragraphs if p.text and p.text.strip()]

    # Also capture tables text (resumes often use borderless tables for columns)
    for table in doc.tables:
        for row in table.rows:
            row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
            if row_text:
                paragraphs_text.append(row_text)

    raw_text = "\n".join(paragraphs_text)
    clean_text = clean_and_normalize_text(raw_text)

    return {
        "raw_text": raw_text,
        "clean_text": clean_text,
        "page_count": 1,  # DOCX does not have fixed pages without rendering engine
        "file_type": "DOCX",
    }


def extract_text_from_file(file_input: Union[str, io.BytesIO, Any], file_type: Optional[str] = None) -> Dict[str, Any]:
    """
    Universal dispatcher for extracting text from PDF or DOCX.
    """
    # Detect file type from argument, filename attribute, or path
    f_type = (file_type or "").upper()
    if not f_type:
        fname = getattr(file_input, "name", "") or (file_input if isinstance(file_input, str) else "")
        _, ext = os.path.splitext(fname)
        if ext.lower() in [".docx", ".doc"]:
            f_type = "DOCX"
        else:
            f_type = "PDF"

    if f_type == "DOCX":
        return extract_text_from_docx(file_input)
    return extract_text_from_pdf(file_input)


def segment_resume_sections(text: str) -> Dict[str, str]:
    """
    Fuzzy Section Boundary Detector (Tier 2).
    Partitions raw text into structured resume sections:
    summary, skills, experience, projects, education, certifications, other.
    """
    sections: Dict[str, List[str]] = {
        "summary": [],
        "skills": [],
        "experience": [],
        "projects": [],
        "education": [],
        "certifications": [],
        "other": [],
    }

    current_section = "other"
    lines = text.split("\n")

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        # Check if line matches a known section header
        # Section headers are usually short (under 50 chars) and standalone
        matched_section = None
        if len(stripped) <= 50:
            header_test = re.sub(r"[:\-_#=*]+$", "", stripped).strip()
            for sec_name, pattern in SECTION_PATTERNS.items():
                if pattern.match(header_test):
                    matched_section = sec_name
                    break

        if matched_section:
            current_section = matched_section
        else:
            sections[current_section].append(stripped)

    # Join lines for each section
    return {k: "\n".join(v).strip() for k, v in sections.items()}


def extract_skills_from_text(text: str) -> List[str]:
    """
    Extracts matched technical and domain skills from resume text.
    Combines active DB skills from Skill model with high-confidence tech skill set.
    Performs boundary-aware regex matching to avoid substring false positives.
    """
    if not text:
        return []

    # 1. Fetch DB skills if Django models are available
    candidate_skills = set(COMMON_TECH_SKILLS)
    try:
        from apps.skills.models import Skill
        db_skills = Skill.objects.filter(is_active=True).values_list("name", flat=True)
        for s in db_skills:
            if s and s.strip():
                candidate_skills.add(s.strip())
    except Exception as e:
        logger.debug(f"[Skill Extractor] Using default skill list: {e}")

    matched: List[str] = []
    text_lower = f" {text.lower()} "

    # Sort candidates by length descending to match compound skills first (e.g. "Django REST Framework" before "Django")
    sorted_candidates = sorted(candidate_skills, key=lambda x: len(x), reverse=True)

    matched_spans = []  # track matched character ranges to avoid sub-skill double counting
    for skill in sorted_candidates:
        s_clean = skill.strip()
        if not s_clean:
            continue

        # Regex pattern with flexible word boundaries that support C++, C#, .NET, Node.js
        escaped = re.escape(s_clean.lower())
        pattern = rf"(?<![a-zA-Z0-9_]){escaped}(?![a-zA-Z0-9_])"

        match = re.search(pattern, text_lower)
        if match:
            span = match.span()
            # Check overlap with existing spans
            overlaps = any(s <= span[0] < e or s < span[1] <= e for s, e in matched_spans)
            if not overlaps:
                matched.append(s_clean)
                matched_spans.append(span)

    # Sort alphabetically for deterministic ordering
    return sorted(list(set(matched)), key=lambda x: x.lower())
