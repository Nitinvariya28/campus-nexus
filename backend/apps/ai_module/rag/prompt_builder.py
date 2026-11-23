import re
import logging
from typing import Any, Dict, List, Optional, Tuple

from apps.ai_module.llm.client import generate_completion

logger = logging.getLogger(__name__)

PRONOUN_OR_FOLLOWUP_REGEX = re.compile(
    r"\b(?:it|they|them|this|that|these|those|such|the\s+same|the\s+former|the\s+latter|what\s+about|how\s+about|and\s+if|can\s+i\s+also|does\s+it|is\s+it)\b",
    re.IGNORECASE,
)

SYSTEM_GROUNDING_PROMPT = """You are the official AlumiBridge AI Assistant for Nirma University students, alumni, and faculty.
Your mission is to provide helpful, comprehensive, accurate, well-structured, and supportive answers to help students and alumni navigate:
1. University Academic Regulations, Degree Frameworks, Attendance Criteria, and Examination & Grading Policies (Nirma University).
2. Campus Placement Cell Guidelines, Recruitment Tiers (Super Dream, Dream, Regular), PPO Conversion, and Drive Registration.
3. Career Development, Professional Resume Writing, ATS Optimization, and Portfolio Building.
4. Technical Interview Preparation (Data Structures & Algorithms, System Design, Full-Stack Engineering, Core CS).
5. AlumiBridge Platform Features (Alumni-Student Mentorship, Recommendation Engine, Smart ATS Resume Analyzer, Community Discussions).

==================== GUIDELINES FOR ANSWERING ====================
1. PRIMARY KNOWLEDGE BASE: Whenever Reference Sources are provided below, prioritize them as official ground-truth facts. Include citation tags like [1] or [2] when referencing specific policies, percentages, cutoffs, or rules from those sources.
2. CONSTRUCTIVE & HELPFUL ADVICE: If a question is about academic topics, placements, career guidance, resume building, technical interviews, software engineering, or the university, provide a thorough, structured, and practical response. Synthesize the provided reference sources, and supplement with sound academic/industry best practices where needed to fully assist the student.
3. CLEAR FORMATTING: Use structured formatting (bullet points, bold highlights, numbered steps) so answers are easy for students to read.
4. INDIVIDUAL PII STRICTLY PROHIBITED: NEVER disclose, guess, or speculate on individual student personal records (such as private phone numbers, individual student CGPA or backlogs, or private email addresses).
5. INSTITUTIONAL CONFIDENTIALITY: Do not discuss leaked exam questions, faculty personal salaries, or administrative server passwords.
6. GENUINE OUT-OF-DOMAIN QUESTIONS: Only if a user asks about completely unrelated topics (such as cooking recipes, pop movies, video games, or celebrity gossip), politely guide them back:
   "I am focused on campus placements, academic guidelines, technical interview prep, and career development. How can I help you with your university journey or career preparation today?"
7. CODE OF CONDUCT: Always maintain a supportive, polite, and professional academic tone.
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
