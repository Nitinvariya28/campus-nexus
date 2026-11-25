import re
import logging
from typing import Any, Dict, Optional, Tuple

logger = logging.getLogger(__name__)

# Pattern 1: Requests for individual student / alumni personal records (PII)
PII_INQUIRY_PATTERNS = [
    re.compile(
        r"\b(?:phone|mobile|cell|contact|email|address|cgpa|gpa|marks|grades?|backlogs?|salary)\b.*\b(?:of|for)\s+(?:student|alumni|user|candidate)\s+([a-zA-Z]+)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:student|alumni|candidate|user)\s+([a-zA-Z]+)(?:'s|\s+has)\s+.*(?:phone|mobile|cell|email|contact|cgpa|gpa|marks|grades?|backlogs?|password|salary)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b([a-zA-Z]+)'s\s+(?:.*?\s+)?(?:phone|mobile|cell|email|contact|cgpa|gpa|marks|grades?|backlogs?|password|salary)\b",
        re.IGNORECASE,
    ),
    re.compile(r"\b(?:how\s+many\s+backlogs\s+does)\s+([a-zA-Z]+)\b", re.IGNORECASE),
    re.compile(r"\b(?:personal\s+number|private\s+email|home\s+address|residential\s+address)\b", re.IGNORECASE),
]

# Pattern 2: University sensitive or confidential administration data
UNIVERSITY_SENSITIVE_PATTERNS = [
    re.compile(r"\b(?:leaked|leak|paper|exam\s+paper|question\s+paper|answers?|keys?)\s+(?:for|of|upcoming|final|mid\s*sem)\b", re.IGNORECASE),
    re.compile(r"\b(?:upcoming|final|mid\s*sem)\s+(?:exam\s+paper|question\s+paper|leak|leaked)\b", re.IGNORECASE),
    re.compile(r"\b(?:faculty|professor|dean|director|staff)\s+(?:salary|salaries|compensation|pay\s*slip|personal\s*account)\b", re.IGNORECASE),
    re.compile(r"\b(?:admin|root|superuser|database|server|mysql|ssh)\s+(?:password|credentials?|secret\s*key|api\s*key|token|backdoor)\b", re.IGNORECASE),
]

# Pattern 3: Toxic, sexual, harassment, abuse, or copyright violations
TOXIC_CONTENT_PATTERNS = [
    re.compile(r"\b(?:sex|sexual|porn|nude|naked|erotic|nsfw|dating|hookup|kiss|rape)\b", re.IGNORECASE),
    re.compile(r"\b(?:fuck|bitch|bastard|asshole|idiot|stupid|kill\s+yourself|hate\s+you)\b", re.IGNORECASE),
    re.compile(r"\b(?:pirated|crack|torrent|hack\s+into|bypass\s+security|ddos)\b", re.IGNORECASE),
]

# Pattern 4: Obvious out-of-domain inquiries (cooking, pop culture, movies, sports, celebrity gossip)
OUT_OF_DOMAIN_PATTERNS = [
    re.compile(r"\b(?:recipe|cook|bake|cake|cookies?|biryani|pizza|burger|pasta|ingredients?)\b", re.IGNORECASE),
    re.compile(r"\b(?:movie|film|cinema|actor|actress|hollywood|bollywood|celebrity|box\s*office)\b", re.IGNORECASE),
    re.compile(r"\b(?:ipl|cricket\s+score|football\s+match|world\s+cup|fifa|tennis|nba)\b", re.IGNORECASE),
    re.compile(r"\b(?:horoscope|astrology|zodiac|fortune\s+telling)\b", re.IGNORECASE),
    re.compile(r"\b(?:tell\s+me\s+a\s+joke|write\s+a\s+song|poem\s+about\s+love)\b", re.IGNORECASE),
]

# Regex patterns for post-generation PII sanitization
EMAIL_SANITIZER_REGEX = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b")
PHONE_SANITIZER_REGEX = re.compile(r"\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b")


def screen_input_query(query: str) -> Optional[Dict[str, Any]]:
    """
    Tier 1 Pre-Retrieval Gatekeeper.
    Evaluates incoming query for prohibited content (PII, sensitive university data,
    toxic/sexual content, or blatant out-of-domain topics) before vector search or LLM invocation.
    Returns refusal dictionary if violation detected, or None if query passes cleanly.
    """
    if not query or not query.strip():
        return {
            "status": "INVALID_QUERY",
            "answer": "Please provide a valid question related to university academics, placements, or technical preparation.",
            "category": "INVALID",
            "retrieval_mode": "GUARDRAIL_BLOCKED",
            "citations": [],
            "confidence_score": 0.0,
            "suggested_followups": [
                "What are the eligibility criteria for campus placement drives?",
                "What are the core technical subjects asked in software interviews?",
            ],
        }

    q_clean = query.strip()

    # 1. Check Toxic, Sexual, or Harassment content (Priority 1)
    for pat in TOXIC_CONTENT_PATTERNS:
        if pat.search(q_clean):
            logger.warning(f"[Guardrails] Blocked toxic/sexual inquiry: {q_clean[:60]}")
            return {
                "status": "PROHIBITED_CONTENT",
                "answer": "This query violates platform safety and code of conduct policies. Inappropriate or abusive language is strictly prohibited.",
                "category": "PROHIBITED",
                "retrieval_mode": "GUARDRAIL_BLOCKED",
                "citations": [],
                "confidence_score": 1.0,
                "suggested_followups": [
                    "What are the campus placement eligibility rules?",
                    "What is the official university academic code of conduct?",
                ],
            }

    # 2. Check Student & Alumni Personal PII (Priority 2)
    GENERIC_ROLE_NOUNS = {
        "student", "students", "fresher", "freshers", "engineer", "engineers",
        "graduate", "graduates", "intern", "interns", "employee", "employees",
        "candidate", "candidates", "applicant", "applicants", "alumni", "user", "users",
        "average", "minimum", "maximum", "expected", "typical", "starting", "someone", "anyone"
    }
    for pat in PII_INQUIRY_PATTERNS:
        m = pat.search(q_clean)
        if m:
            # If regex captured a target group, check if it's a generic role noun rather than a person's name
            captured_name = (m.group(1).lower() if m.groups() and m.group(1) else "").strip()
            if captured_name in GENERIC_ROLE_NOUNS:
                continue

            logger.warning(f"[Guardrails] Blocked student/alumni PII inquiry: {q_clean[:60]}")
            return {
                "status": "PROHIBITED_PII",
                "answer": "Student and alumni personal information, contact details, and academic transcripts are strictly confidential. I cannot provide individual user records.",
                "category": "PROHIBITED",
                "retrieval_mode": "GUARDRAIL_BLOCKED",
                "citations": [],
                "confidence_score": 1.0,
                "suggested_followups": [
                    "How do I update my own profile visibility settings?",
                    "What are the university academic performance standards?",
                ],
            }

    # 3. Check University Sensitive / Confidential Administration Data (Priority 3)
    for pat in UNIVERSITY_SENSITIVE_PATTERNS:
        if pat.search(q_clean):
            logger.warning(f"[Guardrails] Blocked university confidential inquiry: {q_clean[:60]}")
            return {
                "status": "PROHIBITED_SECURITY",
                "answer": "This inquiry pertains to confidential institutional administration or security data and cannot be disclosed by the AI assistant.",
                "category": "PROHIBITED",
                "retrieval_mode": "GUARDRAIL_BLOCKED",
                "citations": [],
                "confidence_score": 1.0,
                "suggested_followups": [
                    "What is the official continuous evaluation and examination procedure?",
                    "What are the technical topics covered in campus interview preparation?",
                ],
            }

    # 4. Check Blatant Out-of-Domain questions (Priority 4)
    IN_DOMAIN_KEYWORDS = re.compile(
        r"\b(?:nirma|nsu|university|campus|college|academic|placement|internship|intern|interview|resume|cv|job|drive|"
        r"faculty|syllabus|exam|grading|cgpa|sgpa|degree|student|alumni|course|semester|noc|attendance|"
        r"code|coding|software|python|java|react|sql|api|system|data|algorithm|dsa|engineering|tech|study|rule|policy)\b",
        re.IGNORECASE,
    )
    if not IN_DOMAIN_KEYWORDS.search(q_clean):
        for pat in OUT_OF_DOMAIN_PATTERNS:
            if pat.search(q_clean):
                logger.info(f"[Guardrails] Blocked out-of-domain inquiry: {q_clean[:60]}")
                return {
                    "status": "OUT_OF_SCOPE",
                    "answer": "I cannot answer this question as it is outside the scope of the AlumiBridge platform (Campus Placements, Academic Regulations, Technical Interview Prep, and Software Technology).",
                    "category": "OUT_OF_SCOPE",
                    "retrieval_mode": "GUARDRAIL_BLOCKED",
                    "citations": [],
                    "confidence_score": 0.1,
                    "suggested_followups": [
                        "What are the tiered recruitment policy rules for placement drives?",
                        "What are the core operating systems topics for technical interviews?",
                    ],
                }

    return None


def sanitize_output(text: str) -> str:
    """
    Tier 2 Post-Generation Gatekeeper.
    Scrubs accidental leakage of personal emails, phone numbers, or credentials from generated text.
    Also strips raw internal document metadata, file:/// paths, and academic bracket citations [1], [2]
    so the assistant output reads naturally and realistically like ChatGPT.
    """
    if not text:
        return ""
    sanitized = EMAIL_SANITIZER_REGEX.sub("[CONFIDENTIAL EMAIL REDACTED]", text)
    sanitized = PHONE_SANITIZER_REGEX.sub("[CONFIDENTIAL CONTACT REDACTED]", sanitized)

    # 1. Remove raw internal document header tags: [Document: Title | Section: ... | Category: ...]
    sanitized = re.sub(r"\[Document:[^\]]+\]", "", sanitized)

    # 2. Clean markdown file:/// links: [Title](file:///path.md) -> Title, or bare file:/// links
    sanitized = re.sub(r"\[([^\]]+)\]\(file:///[^\)]+\)", r"\1", sanitized)
    sanitized = re.sub(r"\(file:///[^\)]+\)", "", sanitized)
    sanitized = re.sub(r"file:///\S+", "", sanitized)

    # 3. Remove raw document catalog IDs: [Nirma University-PLC-001] -> ""
    sanitized = re.sub(r"\[?[A-Za-z\s]+-(?:PLC|ACA|ADM|INT|TECH)-\d+\]?:?", "", sanitized)

    # 4. Remove bracket citations: [1], [2], [3], etc.
    sanitized = re.sub(r"\s*\[\d+\]", "", sanitized)

    # 5. Fix glued inline bullet points: "...will not be accepted. * Career Benchmark:..." -> separate lines
    sanitized = re.sub(r"([.!?])\s+\*\s+", r"\1\n* ", sanitized)

    # 6. Remove stray separator lines (***, ---) and empty markdown headings
    sanitized = re.sub(r"^\s*[\*\-_]{3,}\s*$", "", sanitized, flags=re.MULTILINE)
    sanitized = re.sub(r"^\s*##+\s*(?:Related Topics|Document References|References)?\s*$", "", sanitized, flags=re.MULTILINE)

    # 7. Normalize consecutive blank lines
    sanitized = re.sub(r"\n{3,}", "\n\n", sanitized)

    return sanitized.strip()
