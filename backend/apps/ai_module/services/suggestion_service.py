import json
import logging
import re
from typing import Any, Dict, List, Optional

from apps.ai_module.llm.client import generate_completion

logger = logging.getLogger(__name__)

SUGGESTION_SYSTEM_PROMPT = """You are an elite Silicon Valley Technical Career Coach and ATS Expert.
Your mission is to analyze a candidate's real resume against a target Job Description (JD) and provide realistic, high-impact, actionable recommendations to maximize interview invitations.

GUIDELINES:
1. HIGH REALISM & SPECIFICITY: Avoid generic clichés (e.g. "Worked on various tasks"). Ground every rewrite and tip in the candidate's actual projects, technologies, and target job domain.
2. GOOGLE XYZ REWRITES: Transform weak/passive bullet points into compelling engineering achievements following the formula: "Accomplished [X] as measured by [Y], by doing [Z]". Include realistic technical metrics (latency reduction, query optimization, user scale, test coverage, throughput, or accuracy).
3. KEYWORD PLACEMENT: Tell the candidate exactly WHERE to incorporate missing keywords (e.g. in the Skills taxonomy, specific project bullet, or professional summary).
4. ACTIONABLE FORMATTING: Provide practical layout, bullet density, and technical hierarchy tips for ATS parser compatibility.
5. PURE JSON OUTPUT: Return ONLY valid JSON matching the exact schema requested, with no conversational filler.
"""


def _clean_json_response(raw_text: str) -> str:
    """Strips Markdown backticks and whitespace from LLM response."""
    cleaned = raw_text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    return cleaned.strip()


def _build_rule_based_suggestions(
    parsed_sections: Dict[str, str],
    matched_skills: List[str],
    missing_skills: List[str],
    resume_text: str = "",
) -> Dict[str, Any]:
    """
    High-quality, realistic deterministic fallback when LLM is unavailable or times out.
    Generates genuine, realistic engineering advice tailored to candidate text and matched skills.
    """
    top_matches = ", ".join(matched_skills[:4]) if matched_skills else "core technical competencies"
    missing_preview = ", ".join(missing_skills[:3]) if missing_skills else "target stack requirements"

    summary_rec = (
        f"Position your technical summary directly for the target role by highlighting your proven capabilities in {top_matches}. "
        f"Explicitly connect your hands-on project work with {missing_preview} in the opening section to pass automated ATS screening."
    )

    high_priority = missing_skills[:4]
    med_priority = missing_skills[4:9]

    # Keyword placement advice
    placement_advice = []
    for kw in high_priority[:3]:
        placement_advice.append({
            "keyword": kw,
            "recommended_section": "Skills & Featured Project",
            "action": f"Add '{kw}' to your core technical skills category and reference its practical application in your primary project implementation.",
        })
    for kw in med_priority[:2]:
        placement_advice.append({
            "keyword": kw,
            "recommended_section": "Developer Tools / Environment",
            "action": f"Incorporate '{kw}' under tools or workflow libraries to improve automated keyword match density.",
        })

    # Extract real candidate lines from experience or projects or raw text
    exp_or_proj = (parsed_sections.get("experience", "") + "\n" + parsed_sections.get("projects", "")).strip()
    if not exp_or_proj:
        exp_or_proj = resume_text

    raw_lines = [
        re.sub(r"^[\*\-•▪◦\d\.]+\s*", "", l).strip()
        for l in exp_or_proj.splitlines()
        if len(l.strip()) > 25 and not l.strip().isupper()
    ]

    weak_verbs = ["worked on", "handled", "responsible for", "helped", "made", "created", "built", "did", "used", "developed a", "assisted"]
    candidate_lines = []
    for l in raw_lines:
        lower_l = l.lower()
        if any(v in lower_l for v in weak_verbs) and not any(c.isdigit() for c in l):
            candidate_lines.append(l)
        if len(candidate_lines) >= 3:
            break

    if not candidate_lines and raw_lines:
        candidate_lines = raw_lines[:2]

    # Build realistic Google XYZ rewrites
    rewrites = []
    sample_metrics = [
        ("35% reduction in API response latency", "optimized database queries and Redis caching"),
        ("99.4% uptime and zero-downtime deployments", "modular Docker containerization and CI/CD pipelines"),
        ("serving 800+ concurrent user requests", "scalable RESTful microservice architecture"),
    ]

    for idx, orig in enumerate(candidate_lines[:2]):
        metric_str, action_str = sample_metrics[idx % len(sample_metrics)]
        clean_orig = orig.rstrip(".")
        improved = f"Architected and deployed {clean_orig}, achieving {metric_str} through {action_str}."
        rewrites.append({
            "section": "Projects / Technical Experience",
            "original": orig,
            "improved": improved,
            "metric": metric_str,
            "reason": "Applies Google's XYZ formula by clearly quantifying performance impact, technical responsibility, and engineering scale.",
        })

    if not rewrites:
        rewrites.append({
            "section": "Technical Experience",
            "original": "Worked on backend development and database integration for the application.",
            "improved": "Engineered RESTful backend microservices in Django and PostgreSQL, reducing average query response times by 38% and supporting 1,000+ active user sessions.",
            "metric": "38% query latency reduction",
            "reason": "Replaces vague duty descriptions with measurable technical outcomes and active ownership verbs.",
        })

    # Actionable structural suggestions
    structural_suggestions = [
        {
            "category": "Section Organization",
            "suggestion": "Organize technical competencies into clear sub-categories (Languages, Frameworks, Developer Tools, Databases/Cloud) rather than a single comma-separated block to maximize ATS parser accuracy.",
        },
        {
            "category": "Quantifiable Achievements",
            "suggestion": "Ensure at least 70% of project bullet points contain concrete metrics (e.g. latency, user volume, test coverage, processing speed) rather than only listing assigned tasks.",
        },
        {
            "category": "Active Action Verbs",
            "suggestion": "Begin every bullet point with strong technical action verbs (Engineered, Architected, Refactored, Containerized) instead of passive phrasing like 'Responsible for' or 'Assisted with'.",
        },
    ]

    # Strengths
    strengths = []
    if matched_skills:
        strengths.append(f"Demonstrates solid foundation in core technical stack: {', '.join(matched_skills[:4])}.")
    if parsed_sections.get("projects"):
        strengths.append("Dedicated project section highlighting practical, hands-on software development experience.")
    if parsed_sections.get("education"):
        strengths.append("Clear educational background with degree and specialization visibly positioned.")
    if not strengths:
        strengths.append("Clean, chronological layout suitable for standard automated ATS parsers.")

    return {
        "summary_recommendation": summary_rec,
        "missing_keywords_priority": {
            "high": high_priority,
            "medium": med_priority,
        },
        "keyword_placement_advice": placement_advice,
        "bullet_point_improvements": rewrites,
        "structural_suggestions": structural_suggestions,
        "strengths": strengths,
    }


def generate_resume_suggestions(
    resume_text: str,
    job_description: str,
    parsed_sections: Optional[Dict[str, str]] = None,
    matched_skills: Optional[List[str]] = None,
    missing_skills: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Generates tailored, prioritized, and realistic resume improvement suggestions.
    Uses Google Gemini with automatic failover, falling back to realistic rule-based analysis.
    """
    sections = parsed_sections or {}
    m_skills = matched_skills or []
    miss_skills = missing_skills or []

    # Ensure experience and project excerpts are populated even if sectioning is non-standard
    exp_text = sections.get("experience", "")
    proj_text = sections.get("projects", "")
    if not exp_text and not proj_text:
        lines = [l.strip() for l in resume_text.splitlines() if len(l.strip()) > 25]
        exp_text = "\n".join(lines[:10])
        proj_text = "\n".join(lines[10:20])

    prompt = f"""
TARGET JOB DESCRIPTION:
{job_description[:2000]}

CANDIDATE RESUME INFORMATION:
- Matched Skills: {', '.join(m_skills[:15]) if m_skills else 'None identified'}
- Missing Skills: {', '.join(miss_skills[:15]) if miss_skills else 'None identified'}
- Candidate Experience Excerpts:
{exp_text[:1200] if exp_text else 'General software engineering background'}

- Candidate Project Excerpts:
{proj_text[:1200] if proj_text else 'Software development project implementations'}

- Candidate Education:
{sections.get('education', '')[:400] if sections.get('education') else 'University Degree'}

TASK:
Provide realistic, professional, and actionable resume enhancement advice in this EXACT JSON format:
{{
  "summary_recommendation": "2-sentence tailored headline/summary recommendation aligned with the JD",
  "missing_keywords_priority": {{
    "high": ["Top 3-4 most critical missing technical skills"],
    "medium": ["2-4 secondary technical skills or tools"]
  }},
  "keyword_placement_advice": [
    {{
      "keyword": "Skill name",
      "recommended_section": "Skills / Projects / Experience",
      "action": "Specific instruction on how and where to naturally weave this skill into the resume"
    }}
  ],
  "bullet_point_improvements": [
    {{
      "section": "Projects or Experience",
      "original": "Actual bullet point from candidate resume needing improvement",
      "improved": "Accomplished [X] as measured by [Y], by doing [Z] following Google XYZ formula with realistic metrics",
      "metric": "Key measurable result (e.g. 35% latency drop, 1000+ users)",
      "reason": "Specific rationale connecting this rewrite to the Job Description"
    }}
  ],
  "structural_suggestions": [
    {{
      "category": "Formatting & Structure / Metrics & Impact / Technical Clarity",
      "suggestion": "Realistic, actionable advice to optimize resume readability and ATS machine score"
    }}
  ],
  "strengths": [
    "Identified candidate strength 1",
    "Identified candidate strength 2",
    "Identified candidate strength 3"
  ]
}}
"""

    try:
        raw_output = generate_completion(
            prompt=prompt,
            system_instruction=SUGGESTION_SYSTEM_PROMPT,
            max_tokens=2500,
            temperature=0.2,
        )
        cleaned_json = _clean_json_response(raw_output)
        parsed = json.loads(cleaned_json)

        # Ensure required keys exist
        if (
            "summary_recommendation" in parsed
            and "missing_keywords_priority" in parsed
            and "bullet_point_improvements" in parsed
            and "strengths" in parsed
        ):
            # Normalize missing keys
            if "keyword_placement_advice" not in parsed:
                parsed["keyword_placement_advice"] = []
            if "structural_suggestions" not in parsed:
                parsed["structural_suggestions"] = []
            return parsed
        logger.warning("[Suggestion Service] LLM response missing required JSON keys, falling back.")
    except Exception as e:
        logger.warning(f"[Suggestion Service] LLM generation failed: {e}. Using deterministic fallback.")

    return _build_rule_based_suggestions(sections, m_skills, miss_skills, resume_text=resume_text)
