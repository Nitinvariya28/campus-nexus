import logging
import re
from typing import Any, Dict, List, Optional

from apps.ai_module.llm.client import generate_completion
from apps.ai_module.rag.guardrails import sanitize_output, screen_input_query
from apps.ai_module.rag.prompt_builder import ConversationalPromptBuilder
from apps.ai_module.rag.retriever import KnowledgeRetriever

logger = logging.getLogger(__name__)

CITATION_TAG_REGEX = re.compile(r"\[(\d+)\]")


class RAGResponseGenerator:
    """
    RAG Response Orchestrator (Steps 5 & 6).
    Enforces pre-retrieval safety guardrails, contextualizes queries across stateless turns,
    retrieves diverse MMR knowledge chunks, generates grounded answers with citations,
    and post-sanitizes outputs against PII leakage.
    """

    def __init__(
        self,
        retriever: Optional[KnowledgeRetriever] = None,
        prompt_builder: Optional[ConversationalPromptBuilder] = None,
    ):
        self.retriever = retriever or KnowledgeRetriever()
        self.prompt_builder = prompt_builder or ConversationalPromptBuilder()

    def generate_response(
        self,
        question: str,
        category: Optional[str] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        """
        Executes end-to-end RAG question answering pipeline with full guardrail enforcement.
        """
        # 1. Tier 1 Pre-Retrieval Screening (PII, Sensitive, Toxic, Out-of-Domain)
        screen_result = screen_input_query(question)
        if screen_result is not None:
            return screen_result

        # 2. Stateless Contextual Query Resolution (Pronouns -> Standalone Query)
        standalone_query = self.prompt_builder.contextualize_query(
            question=question,
            history=conversation_history,
        )

        # 3. Qdrant MMR Semantic Vector Search with Score Thresholding
        retrieval_res = self.retriever.search(
            query=standalone_query,
            category=category,
            top_k=4,
            score_threshold=0.45,
            use_mmr=True,
        )

        # 4. Out-of-Domain Gate (No chunks passed similarity threshold)
        if retrieval_res["status"] == "NO_MATCHES" or not retrieval_res["chunks"]:
            logger.info(f"[RAG Generator] Query '{standalone_query}' yielded no matching chunks above threshold.")
            return {
                "status": "OUT_OF_SCOPE",
                "answer": (
                    "I cannot answer this question as it is outside the scope of the AlumiBridge platform "
                    "(Campus Placements, Academic Regulations, Technical Interview Prep, and Software Technology)."
                ),
                "category": category or "OUT_OF_SCOPE",
                "retrieval_mode": "VECTOR_BELOW_THRESHOLD",
                "citations": [],
                "confidence_score": retrieval_res.get("max_score", 0.0),
                "suggested_followups": [
                    "What are the eligibility criteria for campus placement drives?",
                    "What are the core technical subjects asked in software interviews?",
                    "How does the university grading system and SGPA calculation work?",
                ],
            }

        chunks = retrieval_res["chunks"]

        # 5. Build Grounded Prompt with Primacy-Recency Ordered Chunks
        sys_prompt, user_prompt, citations_meta = self.prompt_builder.build_grounded_prompt(
            question=question,
            chunks=chunks,
            history=conversation_history,
        )

        # 6. Call Google Gemini 3 Flash Free Tier
        raw_answer = None
        try:
            raw_answer = generate_completion(
                prompt=user_prompt,
                system_instruction=sys_prompt,
                max_tokens=1500,
                temperature=0.1,
            )
        except Exception as e:
            logger.warning(f"[RAG Generator] LLM generation failed: {e}. Generating grounded extractive fallback.")

        # 7. Fallback generation if LLM is unavailable
        if not raw_answer or not raw_answer.strip():
            top_chunk = chunks[0]
            raw_answer = (
                f"Based on the official {top_chunk.get('title', 'University Policy')} [1]:\n\n"
                f"{top_chunk.get('text', '').splitlines()[-1]}"
            )

        # 8. Tier 2 Post-Generation Gatekeeper: Sanitize PII
        clean_answer = sanitize_output(raw_answer.strip())

        # 9. Extract and match citations referenced in answer
        referenced_tag_indices = set(int(m) for m in CITATION_TAG_REGEX.findall(clean_answer))
        active_citations = [
            c for c in citations_meta if c["source_number"] in referenced_tag_indices
        ]
        # If model did not cite tags explicitly, include top retrieved sources by default
        if not active_citations:
            active_citations = citations_meta[:2]

        # Calculate confidence score from top retrieved chunk scores
        scores = [c["relevance_score"] for c in chunks]
        confidence = round(float(sum(scores[:2]) / max(1, len(scores[:2]))), 2)

        # Generate contextual follow-up questions
        suggested_followups = self._generate_followups(chunks, category)

        return {
            "status": "SUCCESS",
            "answer": clean_answer,
            "category": category or chunks[0].get("category", "ALL"),
            "retrieval_mode": "MMR_VECTOR",
            "citations": active_citations,
            "confidence_score": confidence,
            "suggested_followups": suggested_followups,
        }

    def _generate_followups(self, chunks: List[Dict[str, Any]], category: Optional[str]) -> List[str]:
        """Generates dynamic follow-up suggestions from retrieved document sections."""
        followups = []
        for c in chunks[:3]:
            title = c.get("title", "")
            sec = c.get("section", "")
            if "Placement" in title or category == "PLACEMENT_CELL":
                followups.append("What are the rules regarding Dream and Super Dream placement offers?")
                followups.append("How does the Placement Cell handle Pre-Placement Offers (PPOs)?")
                break
            elif "Academic" in title or "Grading" in title or category == "NSU":
                followups.append("What are the attendance condonation requirements?")
                followups.append("How are SGPA and CGPA calculated for semester exams?")
                break
            elif "Interview" in title or category == "INTERVIEW_PREP":
                followups.append("What are the most common system design questions for freshers?")
                followups.append("How do I structure behavioral answers using the STAR method?")
                break
            elif "Technology" in title or category == "INDUSTRY_TECH":
                followups.append("What are the best practices for REST API architecture?")
                followups.append("What is the difference between containerization and virtualization?")
                break

        if not followups:
            followups = [
                "What are the campus placement eligibility rules?",
                "What technical topics should I prepare for interviews?",
                "What is the university academic calendar schedule?",
            ]

        # Deduplicate preserving order
        seen = set()
        deduped = []
        for f in followups:
            if f not in seen:
                seen.add(f)
                deduped.append(f)
        return deduped[:3]
