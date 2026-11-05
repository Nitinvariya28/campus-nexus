import json
import logging
import re
from typing import Any, Dict, List, Optional

from apps.ai_module.llm.client import generate_completion

logger = logging.getLogger(__name__)

SUGGESTION_SYSTEM_PROMPT = """You are an elite Career & ATS Technical Resume Coach.
Your task is to analyze a candidate's resume against a target Job Description (JD) and provide high-impact, actionable recommendations to maximize interview callbacks.

Rules:
1. Strict Anti-Hallucination: Do NOT invent fake previous employers, fake degrees, or unverifiable claims. Only enhance and quantify existing candidate experience and projects.
2. XYZ Formula: When rewriting bullets, strictly follow Google's XYZ formula: "Accomplished [X] as measured by [Y], by doing [Z]".
3. Output Format: You MUST reply ONLY with valid JSON matching the exact schema specified, with no extra conversational text or markdown explanation outside the JSON.
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
) -> Dict[str, Any]:
    """
    Deterministic fallback when LLM is unavailable, rate-limited, or responds with invalid JSON.
    Guarantees that the API always returns high-quality, actionable advice.
    """
    # 1. Summary recommendation
    top_matches = ", ".join(matched_skills[:3]) if matched_skills else "core competencies"
    summary_rec = (
        f"Align your professional headline and summary directly to the target role. "
        f"Prominently highlight your expertise in {top_matches} in the top 20% of your resume."
    )

    # 2. Missing keywords priority
    high_priority = missing_skills[:4]
    med_priority = missing_skills[4:10]

    # 3. Actionable bullet point rewrites
    rewrites = []
    exp_or_proj = parsed_sections.get("experience", "") + "\n" + parsed_sections.get("projects", "")
    lines = [line.strip("- ").strip() for line in exp_or_proj.split("\n") if len(line.strip()) > 20]

    weak_verbs = ["worked on", "handled", "responsible for", "helped", "made", "created", "built", "did"]

    candidate_line = None
    for line in lines:
        lower_line = line.lower()
        if any(v in lower_line for v in weak_verbs) and not any(c.isdigit() for c in line):
            candidate_line = line
            break

    if not candidate_line and lines:
        candidate_line = lines[0]

    if candidate_line:
        improved_sample = (
            f"Architected and deployed {candidate_line.rstrip('.')}, resulting in a 25% efficiency "
            f"gain and robust test coverage across all deliverables."
        )
        rewrites.append({
            "section": "Projects / Experience",
            "original": candidate_line,
            "improved": improved_sample,
            "reason": "Applies Google's XYZ formula with quantifiable scale and active engineering ownership.",
        })
    else:
        rewrites.append({
            "section": "Experience",
            "original": "Worked on backend development and database queries.",
            "improved": "Engineered scalable REST endpoints and optimized database queries, reducing average API response latency by 35%.",
            "reason": "Quantifies performance improvements and specifies technical responsibility.",
        })

    # 4. Strengths
    strengths = []
    if matched_skills:
        strengths.append(f"Strong match for core technical stack: {', '.join(matched_skills[:4])}.")
    if parsed_sections.get("projects"):
        strengths.append("Dedicated projects section demonstrating practical software implementation.")
    if parsed_sections.get("education"):
        strengths.append("Clear academic qualifications and educational background.")
    if not strengths:
        strengths.append("Clean chronological formatting suitable for automated parsing.")

    return {
        "summary_recommendation": summary_rec,
        "missing_keywords_priority": {
            "high": high_priority,
            "medium": med_priority,
        },
        "bullet_point_improvements": rewrites,
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
    Generates tailored, prioritized resume improvement suggestions.
    Uses Google Gemini free tier with automatic multi-model failover,
    falling back seamlessly to rule-based analysis on error.
    """
    sections = parsed_sections or {}
    m_skills = matched_skills or []
    miss_skills = missing_skills or []

    prompt = f"""
TARGET JOB DESCRIPTION:
{job_description[:2000]}

CANDIDATE RESUME SUMMARY:
- Matched Skills: {', '.join(m_skills[:15])}
- Missing Skills: {', '.join(miss_skills[:15])}
- Experience Text: {sections.get('experience', '')[:1000]}
- Projects Text: {sections.get('projects', '')[:1000]}
- Education Text: {sections.get('education', '')[:500]}

Generate actionable feedback in this EXACT JSON structure:
{{
  "summary_recommendation": "1-2 sentence recommendation for candidate's top summary/headline",
  "missing_keywords_priority": {{
    "high": ["Top 3-4 most critical missing technical skills"],
    "medium": ["2-4 nice-to-have or secondary missing skills"]
  }},
  "bullet_point_improvements": [
    {{
      "section": "Projects or Experience",
      "original": "Weak bullet point found in resume",
      "improved": "High-impact rewrite following Google XYZ formula: Accomplished [X] as measured by [Y], by doing [Z]",
      "reason": "Specific rationale connecting to the Job Description"
    }}
  ],
  "strengths": [
    "Strength 1",
    "Strength 2",
    "Strength 3"
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

        # Validate required keys
        if (
            "summary_recommendation" in parsed
            and "missing_keywords_priority" in parsed
            and "bullet_point_improvements" in parsed
            and "strengths" in parsed
        ):
            return parsed
        logger.warning("[Suggestion Service] LLM response missing required JSON keys, falling back.")
    except Exception as e:
        logger.warning(f"[Suggestion Service] LLM generation failed: {e}. Using deterministic fallback.")

    return _build_rule_based_suggestions(sections, m_skills, miss_skills)
