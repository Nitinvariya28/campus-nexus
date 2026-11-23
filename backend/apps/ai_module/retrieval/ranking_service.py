import logging
from typing import Any, Dict, List, Optional, Tuple
from django.contrib.auth import get_user_model

from apps.ai_module.retrieval.profile_retriever import ProfileRetriever
from apps.ai_module.retrieval.result_aggregator import ResultAggregator

logger = logging.getLogger(__name__)
User = get_user_model()


class RankingService:
    """
    Multi-Signal Hybrid Ranking & Evidence Formulation Service.
    Combines:
    - Semantic Vector Cosine Similarity (50%)
    - Exact & Proficiency-Weighted Skill Jaccard Overlap (30%)
    - Academic Compatibility & Department Proximity (10%)
    - Career Alignment & Experience Seniority (10%)
    """

    WEIGHT_SEMANTIC = 0.50
    WEIGHT_SKILL = 0.30
    WEIGHT_ACADEMIC = 0.10
    WEIGHT_CAREER = 0.10

    def compute_skill_overlap(
        self,
        caller: User,
        candidate: User,
        caller_skills_map: Optional[Dict[str, Tuple[str, str]]] = None,
    ) -> Tuple[float, List[str]]:
        """
        Calculates Jaccard skill overlap with proficiency alignment bonus.
        Returns (score, shared_skill_names).
        """
        if caller_skills_map is not None:
            caller_skills = caller_skills_map
        else:
            caller_skills = {}
            if hasattr(caller, "user_skills"):
                for us in caller.user_skills.all():
                    if hasattr(us, "skill") and us.skill:
                        caller_skills[us.skill.name.strip().lower()] = (us.proficiency, us.skill.name.strip())

        candidate_skills = {}
        if hasattr(candidate, "user_skills"):
            for us in candidate.user_skills.all():
                if hasattr(us, "skill") and us.skill:
                    candidate_skills[us.skill.name.strip().lower()] = (us.proficiency, us.skill.name.strip())

        if not caller_skills or not candidate_skills:
            return 0.0, []

        caller_set = set(caller_skills.keys())
        candidate_set = set(candidate_skills.keys())

        intersection = caller_set & candidate_set
        union = caller_set | candidate_set

        if not union:
            return 0.0, []

        jaccard = len(intersection) / len(union)

        # Proficiency bonus: +0.05 if both share ADVANCED proficiency on a skill
        shared_advanced_count = 0
        shared_names = []
        for s in intersection:
            c_prof, c_name = caller_skills[s]
            cand_prof, _ = candidate_skills[s]
            shared_names.append(c_name)
            if c_prof == "ADVANCED" and cand_prof == "ADVANCED":
                shared_advanced_count += 1

        score = min(1.0, jaccard + (shared_advanced_count * 0.05))
        return round(score, 4), shared_names

    def compute_academic_compatibility(self, caller: User, candidate: User) -> Tuple[float, List[str]]:
        """
        Evaluates departmental identity and graduation batch proximity.
        Returns (score, match_reasons).
        """
        reasons = []
        score = 0.0

        caller_dept_id = None
        caller_dept_name = ""
        caller_batch_id = None

        caller_role = getattr(caller, "role", "STUDENT")
        if caller_role == "STUDENT" and hasattr(caller, "student_profile") and caller.student_profile:
            caller_dept_id = getattr(caller.student_profile, "department_id", None)
            caller_dept_name = getattr(caller.student_profile.department, "name", "")
            caller_batch_id = getattr(caller.student_profile, "batch_id", None)
        elif caller_role == "ALUMNI" and hasattr(caller, "alumni_profile") and caller.alumni_profile:
            caller_dept_id = getattr(caller.alumni_profile, "department_id", None)
            caller_dept_name = getattr(caller.alumni_profile.department, "name", "")
            caller_batch_id = getattr(caller.alumni_profile, "batch_id", None)

        cand_dept_id = None
        cand_dept_name = ""
        cand_batch_id = None

        cand_role = getattr(candidate, "role", "STUDENT")
        if cand_role == "STUDENT" and hasattr(candidate, "student_profile") and candidate.student_profile:
            cand_dept_id = getattr(candidate.student_profile, "department_id", None)
            cand_dept_name = getattr(candidate.student_profile.department, "name", "")
            cand_batch_id = getattr(candidate.student_profile, "batch_id", None)
        elif cand_role == "ALUMNI" and hasattr(candidate, "alumni_profile") and candidate.alumni_profile:
            cand_dept_id = getattr(candidate.alumni_profile, "department_id", None)
            cand_dept_name = getattr(candidate.alumni_profile.department, "name", "")
            cand_batch_id = getattr(candidate.alumni_profile, "batch_id", None)

        # 1. Department match (+0.60)
        if caller_dept_id and cand_dept_id and caller_dept_id == cand_dept_id:
            score += 0.60
            if caller_dept_name:
                reasons.append(f"Department of {caller_dept_name}")

        # 2. Batch affinity (+0.40)
        if (
            isinstance(caller_batch_id, (int, float))
            and isinstance(cand_batch_id, (int, float))
        ):
            if caller_batch_id == cand_batch_id:
                score += 0.40
                reasons.append("Same academic batch cohort")
            elif abs(caller_batch_id - cand_batch_id) <= 2:
                score += 0.25
                reasons.append("Adjacent graduation batch cohort")
            elif cand_role == "ALUMNI" and caller_role == "STUDENT":
                # Senior alumnus mentorship affinity
                score += 0.40
                reasons.append("Senior alumnus mentor affinity")

        return min(1.0, round(score, 4)), reasons

    def compute_career_relevance(self, caller: User, candidate: User) -> Tuple[float, List[str]]:
        """
        Evaluates company employment, job category, and experience depth for alumni candidates.
        Returns (score, match_reasons).
        """
        reasons = []
        score = 0.0

        cand_role = getattr(candidate, "role", None)
        if cand_role == "ALUMNI" or (cand_role is None and hasattr(candidate, "alumni_profile") and candidate.alumni_profile):
            ap = getattr(candidate, "alumni_profile", None)
            if ap:
                # 1. Verified Current Company (+0.40)
                if getattr(ap, "current_company", None):
                    score += 0.40
                    comp_name = getattr(ap.current_company, "name", "an established company")
                    reasons.append(f"Currently at {comp_name}")

                # 2. Current Job Title / Role (+0.30)
                if getattr(ap, "current_job_title", None):
                    score += 0.30
                    reasons.append(f"Role: {ap.current_job_title}")

                # 3. Years of Experience (+0.30 scaled by experience)
                exp = getattr(ap, "years_of_experience", 0) or 0
                if isinstance(exp, (int, float)) and exp > 0:
                    exp_score = min(0.30, exp * 0.06)
                    score += exp_score
                    reasons.append(f"{exp}+ years industry experience")

        elif cand_role == "STUDENT" or (cand_role is None and hasattr(candidate, "student_profile") and candidate.student_profile):
            sp = getattr(candidate, "student_profile", None)
            if sp:
                sem = getattr(sp, "semester", None)
                if isinstance(sem, (int, float)) and sem > 0:
                    score += 0.50
                    reasons.append(f"Semester {sem} student")
                social_links = getattr(candidate, "social_links", None)
                if social_links and hasattr(social_links, "exists") and callable(social_links.exists):
                    try:
                        if social_links.exists():
                            score += 0.50
                            reasons.append("Active technical portfolio")
                    except Exception:
                        pass

        return min(1.0, round(score, 4)), reasons

    def compute_composite_score(
        self,
        semantic_score: float,
        skill_score: float,
        academic_score: float,
        career_score: float,
    ) -> float:
        """Computes deterministic 50/30/10/10 weighted score."""
        composite = (
            (self.WEIGHT_SEMANTIC * semantic_score)
            + (self.WEIGHT_SKILL * skill_score)
            + (self.WEIGHT_ACADEMIC * academic_score)
            + (self.WEIGHT_CAREER * career_score)
        )
        return round(composite, 4)

    def rank_and_explain(
        self,
        caller: User,
        candidate_pool: Dict[int, Dict[str, Any]],
        hydrated_users: Dict[int, User],
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """
        Ranks hydrated candidates using the multi-signal formula and formats explainable evidence.
        """
        ranked_candidates = []

        # Precompute caller skills map once to avoid redundant N queries inside candidate loop
        caller_skills_map: Dict[str, Tuple[str, str]] = {}
        if hasattr(caller, "user_skills"):
            for us in caller.user_skills.all():
                if hasattr(us, "skill") and us.skill:
                    caller_skills_map[us.skill.name.strip().lower()] = (us.proficiency, us.skill.name.strip())

        for uid, pool_meta in candidate_pool.items():
            candidate = hydrated_users.get(uid)
            if not candidate or not candidate.is_active:
                continue

            semantic_score = pool_meta.get("best_score", 0.0)
            skill_score, shared_skills = self.compute_skill_overlap(
                caller, candidate, caller_skills_map=caller_skills_map
            )
            academic_score, academic_reasons = self.compute_academic_compatibility(caller, candidate)
            career_score, career_reasons = self.compute_career_relevance(caller, candidate)

            final_score = self.compute_composite_score(
                semantic_score=semantic_score,
                skill_score=skill_score,
                academic_score=academic_score,
                career_score=career_score,
            )

            # Assemble clean, non-PII match reasons
            reasons = []
            if shared_skills:
                preview = ", ".join(shared_skills[:4])
                reasons.append(f"Shares {len(shared_skills)} technical skill(s): {preview}")
            reasons.extend(academic_reasons)
            reasons.extend(career_reasons)
            if semantic_score >= 0.50:
                pct = int(semantic_score * 100)
                reasons.append(f"High semantic profile affinity ({pct}% match)")

            # Extract public profile details without PII
            dept_name = ""
            batch_name = ""
            job_title = ""
            company_name = ""

            cand_role = getattr(candidate, "role", "STUDENT")
            if cand_role == "STUDENT" and hasattr(candidate, "student_profile") and candidate.student_profile:
                dept_name = getattr(candidate.student_profile.department, "name", "")
                batch_name = getattr(candidate.student_profile.batch, "name", "")
            elif cand_role == "ALUMNI" and hasattr(candidate, "alumni_profile") and candidate.alumni_profile:
                dept_name = getattr(candidate.alumni_profile.department, "name", "")
                batch_name = getattr(candidate.alumni_profile.batch, "name", "")
                job_title = getattr(candidate.alumni_profile, "current_job_title", "") or ""
                company_name = getattr(candidate.alumni_profile.current_company, "name", "") if getattr(candidate.alumni_profile, "current_company", None) else ""

            candidate_skills = []
            if hasattr(candidate, "user_skills"):
                candidate_skills = [
                    us.skill.name for us in candidate.user_skills.all() if hasattr(us, "skill") and us.skill
                ][:8]

            ranked_candidates.append({
                "user_id": candidate.id,
                "role": candidate.role,
                "department": dept_name,
                "batch": batch_name,
                "current_job_title": job_title,
                "company_name": company_name,
                "skills": candidate_skills,
                "final_score": final_score,
                "score_breakdown": {
                    "semantic_score": semantic_score,
                    "skill_score": skill_score,
                    "academic_score": academic_score,
                    "career_score": career_score,
                },
                "matched_chunks": pool_meta.get("chunk_types", []),
                "match_reasons": reasons,
            })

        # Sort descending by final composite score
        ranked_candidates.sort(key=lambda x: x["final_score"], reverse=True)
        return ranked_candidates[:limit]


def get_profile_recommendations(
    caller_user_id: int,
    target_role: str = "ALL",
    query_text: Optional[str] = None,
    limit: int = 10,
    filters: Optional[Dict[str, Any]] = None,
    retriever: Optional[ProfileRetriever] = None,
    ranking_service: Optional[RankingService] = None,
) -> List[Dict[str, Any]]:
    """
    High-level orchestrator for AI Profile Recommendations (AI-02).
    Executes the 3-stage pipeline:
    1. Filtered vector retrieval from Qdrant
    2. Max-similarity pooling & single-query MySQL hydration
    3. Multi-signal ranking & explainable match reason synthesis
    """
    # 1. Fetch caller user
    try:
        caller = User.objects.select_related(
            "student_profile__department",
            "student_profile__batch",
            "alumni_profile__department",
            "alumni_profile__batch",
            "alumni_profile__current_company",
        ).prefetch_related("user_skills__skill").get(id=caller_user_id)
    except User.DoesNotExist:
        logger.warning(f"Caller User #{caller_user_id} does not exist.")
        return []

    retriever = retriever or ProfileRetriever()
    ranking_service = ranking_service or RankingService()

    # 2. Stage 1: Vector Retrieval from Qdrant
    raw_hits = retriever.retrieve_candidates(
        caller_user_id=caller_user_id,
        target_role=target_role,
        query_text=query_text,
        caller_user=caller,
        top_k=max(50, limit * 3),
        filters=filters,
    )

    if not raw_hits:
        return []

    # 3. Stage 2: Max-Similarity Pooling & Deduplication
    candidate_pool = ResultAggregator.pool_and_deduplicate(
        raw_hits=raw_hits,
        caller_user_id=caller_user_id,
    )

    if not candidate_pool:
        return []

    # 4. Single-Query Batch Hydration (Zero N+1)
    candidate_ids = list(candidate_pool.keys())
    hydrated_users = ResultAggregator.hydrate_candidate_users(candidate_ids)

    # 5. Stage 3: Multi-Signal Composite Ranking & Evidence Synthesis
    return ranking_service.rank_and_explain(
        caller=caller,
        candidate_pool=candidate_pool,
        hydrated_users=hydrated_users,
        limit=limit,
    )
