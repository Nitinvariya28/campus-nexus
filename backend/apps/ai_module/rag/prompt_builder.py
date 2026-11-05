import re
import logging
from typing import Any, Dict, List, Optional, Tuple

from apps.ai_module.llm.client import generate_completion

logger = logging.getLogger(__name__)

PRONOUN_OR_FOLLOWUP_REGEX = re.compile(
    r"\b(?:it|they|them|this|that|these|those|such|the\s+same|the\s+former|the\s+latter|what\s+about|how\s+about|and\s+if|can\s+i\s+also|does\s+it|is\s+it)\b",
    re.IGNORECASE,
)

SYSTEM_GROUNDING_PROMPT = """You are the AlumiBridge University Intelligent AI Assistant.
Your sole purpose is to provide factual, verified, and grounded information to students and alumni regarding:
1. University Academic Regulations and Policies (NSU)
2. Campus Placement Cell Guidelines, Recruitment Tiers, and Eligibility Rules
3. Technical Interview Preparation (DSA, System Design, Core CS)
4. Modern Industry Technology and Engineering Practices

==================== OPERATING RULES & STRICT PROHIBITIONS ====================
1. STRICT GROUNDING: Answer the user's question STRICTLY using the provided Reference Sources. You possess NO external memory or personal opinions.
2. ZERO HALLUCINATION: If the provided reference sources do not contain the answer, state EXACTLY:
   "I do not have sufficient verified information in the university knowledge base to answer this question accurately. Please contact the Placement Cell or Academic Administration directly."
3. MANDATORY SOURCE CITATIONS: Every claim, cutoff, rule, or percentage stated MUST be immediately followed by a citation tag corresponding to the reference number, e.g., [1] or [2].
4. INDIVIDUAL PII STRICTLY PROHIBITED: NEVER provide, discuss, or speculate on individual student names, phone numbers, email addresses, CGPA, grades, backlogs, or private records.
5. INSTITUTIONAL CONFIDENTIALITY: NEVER reveal or discuss confidential examination papers, faculty salaries, or administrative passwords.
6. OUT-OF-DOMAIN REFUSAL: If the user asks about topics unrelated to university academics, placement, interview prep, or engineering technology (e.g., cooking, pop culture, sports, general entertainment), respond:
   "I cannot answer this question as it is outside the scope of the AlumiBridge platform (Campus Placements, Academic Regulations, Technical Interview Prep, and Software Technology)."
7. CODE OF CONDUCT: Maintain a professional, objective, and supportive academic tone. Reject all toxic, discriminatory, or inappropriate requests.
"""


class ConversationalPromptBuilder:
    """
    RAG Conversational Prompt Engineer (Step 6).
    Contextualizes follow-up queries across stateless LLM turns, formats
    grounded reference sources, and constructs anti-hallucination prompt templates.
    """

    def __init__(self, history_window_size: int = 4):
        self.history_window_size = history_window_size

    def contextualize_query(self, question: str, history: Optional[List[Dict[str, str]]] = None) -> str:
        """
        Resolves pronouns and follow-up references across stateless turns (Handbook Chapter 10).
        Converts dependent follow-up questions into standalone semantic search queries.
        """
        clean_q = question.strip()
        if not history or len(history) == 0:
            return clean_q

        # Check if the question needs contextualization
        needs_context = bool(PRONOUN_OR_FOLLOWUP_REGEX.search(clean_q)) or len(clean_q.split()) <= 4
        if not needs_context:
            return clean_q

        # Format recent history for query rewriting
        recent_turns = history[-self.history_window_size :]
        history_str = ""
        for turn in recent_turns:
            role = turn.get("role", "user").capitalize()
            content = turn.get("content", "").strip()
            history_str += f"{role}: {content}\n"

        prompt = f"""Given the following chat history and follow-up question, rewrite it into a single standalone search query. 
Do NOT answer the question. Only return the concise standalone search query string.

Chat History:
{history_str}

Follow-up Question: {clean_q}
Standalone Search Query:"""

        try:
            standalone_q = generate_completion(
                prompt=prompt,
                max_tokens=60,
                temperature=0.0,
                timeout=5.0,
            )
            clean_standalone = standalone_q.strip().strip('"').strip("'")
            if clean_standalone and len(clean_standalone) > 5:
                logger.info(f"[Query Contextualizer] Rewrote '{clean_q}' -> '{clean_standalone}'")
                return clean_standalone
        except Exception as e:
            logger.warning(f"[Query Contextualizer] LLM rewrite failed: {e}. Using original question.")

        # Heuristic fallback: combine last user topic if pronoun present
        last_user_turn = next(
            (t["content"] for t in reversed(recent_turns) if t.get("role") == "user"),
            "",
        )
        if last_user_turn:
            return f"{last_user_turn} {clean_q}"
        return clean_q

    def build_grounded_prompt(
        self,
        question: str,
        chunks: List[Dict[str, Any]],
        history: Optional[List[Dict[str, str]]] = None,
    ) -> Tuple[str, str, List[Dict[str, Any]]]:
        """
        Assembles the grounded prompt payload with numbered reference citations.
        Returns: (system_instruction, user_prompt, citations_metadata).
        """
        context_parts = []
        citations_metadata = []

        for idx, chunk in enumerate(chunks, 1):
            source_block = (
                f"--- REFERENCE SOURCE [{idx}] ---\n"
                f"Document ID: {chunk.get('document_id', '')}\n"
                f"Title: {chunk.get('title', '')}\n"
                f"Section: {chunk.get('section', '')}\n"
                f"Content:\n{chunk.get('text', '')}\n"
            )
            context_parts.append(source_block)

            citations_metadata.append({
                "source_number": idx,
                "document_id": chunk.get("document_id", ""),
                "title": chunk.get("title", ""),
                "section": chunk.get("section", ""),
                "relevance_score": chunk.get("relevance_score", 0.0),
            })

        formatted_context = "\n".join(context_parts)

        # Sliding window history (last 4 turns)
        history_text = ""
        if history:
            recent_turns = history[-self.history_window_size :]
            for turn in recent_turns:
                role = turn.get("role", "user").capitalize()
                content = turn.get("content", "").strip()
                history_text += f"{role}: {content}\n"

        user_prompt = f"""RETRIEVED REFERENCE SOURCES:
{formatted_context}

CONVERSATION HISTORY:
{history_text if history_text else "None"}

USER QUESTION:
{question}

Provide a grounded, cited answer following the operating rules:"""

        return SYSTEM_GROUNDING_PROMPT, user_prompt, citations_metadata
