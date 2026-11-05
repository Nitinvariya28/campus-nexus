import logging
import math
from typing import Any, Dict, List, Optional
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.ai_module.indexing.profile_document_builder import is_profile_ready
from apps.ai_module.retrieval.profile_retriever import ProfileRetriever
from apps.ai_module.retrieval.result_aggregator import ResultAggregator
from apps.ai_module.retrieval.ranking_service import RankingService
from apps.ai_module.serializers import (
    ProfileRecommendationsResponseSerializer,
)

logger = logging.getLogger(__name__)
User = get_user_model()


class ProfileRecommendationsView(APIView):
    """
    AI-02: Profile Recommendations API with Dual-Column 'Load More' Pagination.
    Provides Top 5 Students (Left Column) and Top 5 Alumni (Right Column)
    based on 50/30/10/10 multi-signal hybrid ranking.
    """
    permission_classes = [IsAuthenticated]

    def __init__(self, **kwargs: Any):
        super().__init__(**kwargs)
        self._retriever = None
        self._ranking_service = None

    @property
    def retriever(self):
        if self._retriever is None:
            self._retriever = ProfileRetriever()
        return self._retriever

    @retriever.setter
    def retriever(self, value):
        self._retriever = value

    @property
    def ranking_service(self):
        if self._ranking_service is None:
            self._ranking_service = RankingService()
        return self._ranking_service

    @ranking_service.setter
    def ranking_service(self, value):
        self._ranking_service = value

    def _build_candidate_card(
        self,
        candidate_user: User,
        ranked_meta: Dict[str, Any],
        caller: User,
        request: Any,
    ) -> Dict[str, Any]:
        """
        Builds a lightweight profile card for the candidate.
        """
        # 1. Full name
        full_name = candidate_user.get_full_name().strip()
        if not full_name:
            full_name = f"{candidate_user.first_name} {candidate_user.last_name}".strip()
        if not full_name:
            full_name = candidate_user.email.split("@")[0]

        # 2. Profile photo
        photo_url = ""
        if getattr(candidate_user, "profile_photo", None):
            val = str(candidate_user.profile_photo).strip()
            if val:
                if val.startswith("http://") or val.startswith("https://"):
                    photo_url = val
                else:
                    path = val if val.startswith("/media/") else f"/media/{val.lstrip('/')}"
                    try:
                        photo_url = request.build_absolute_uri(path)
                    except Exception:
                        photo_url = path

        # 3. Dynamic headline
        headline = ""
        role = str(getattr(candidate_user, "role", "STUDENT"))
        if role == "ALUMNI" and hasattr(candidate_user, "alumni_profile") and candidate_user.alumni_profile:
            ap = candidate_user.alumni_profile
            job = str(getattr(ap, "current_job_title", "") or "Alumni")
            comp = "Nirma University"
            if getattr(ap, "current_company", None):
                comp = str(getattr(ap.current_company, "name", "Nirma University") or "Nirma University")
            headline = f"{job} at {comp}"
        elif role == "STUDENT" and hasattr(candidate_user, "student_profile") and candidate_user.student_profile:
            sp = candidate_user.student_profile
            dept = "Engineering"
            if getattr(sp, "department", None):
                dept = str(getattr(sp.department, "name", "Engineering") or "Engineering")
            sem = getattr(sp, "semester", None)
            batch = ""
            if getattr(sp, "batch", None):
                batch = str(getattr(sp.batch, "name", "") or "")
            parts = [dept]
            if sem and isinstance(sem, (int, str)):
                parts.append(f"Semester {sem}")
            if batch:
                parts.append(f"Batch of {batch}")
            headline = " • ".join(str(p) for p in parts if p)
        else:
            headline = "University Community Member"

        # 4. Overlapping technical skills
        caller_skills = {}
        if hasattr(caller, "user_skills"):
            for us in caller.user_skills.all():
                if hasattr(us, "skill") and us.skill:
                    caller_skills[us.skill.name.strip().lower()] = us.skill.name.strip()

        cand_skills = {}
        if hasattr(candidate_user, "user_skills"):
            for us in candidate_user.user_skills.all():
                if hasattr(us, "skill") and us.skill:
                    cand_skills[us.skill.name.strip().lower()] = us.skill.name.strip()

        shared_skill_names = [
            caller_skills[k]
            for k in (set(caller_skills.keys()) & set(cand_skills.keys()))
        ]

        # 5. Department name
        dept_name = ranked_meta.get("department", "")

        return {
            "user_id": candidate_user.id,
            "full_name": full_name,
            "profile_photo": photo_url,
            "role": role,
            "headline": headline,
            "department": dept_name,
            "match_score": round(float(ranked_meta.get("final_score", 0.0)) * 100, 1),
            "match_reasons": ranked_meta.get("match_reasons", [])[:3],
            "shared_skills": shared_skill_names[:6],
            "profile_url": f"/profile/{candidate_user.id}/",
        }

    def _get_paginated_role_recommendations(
        self,
        caller: User,
        target_role: str,
        page: int,
        limit: int,
        request: Any,
    ) -> Dict[str, Any]:
        """
        Executes filtered vector retrieval, pooling, hydration, and ranking for a specific role,
        then slices the exact page window for 'Load More' pagination.
        """
        # Retrieve candidate chunks (fetch enough to cover target page window)
        top_k = max(60, page * limit * 5)
        raw_hits = self.retriever.retrieve_candidates(
            caller_user_id=caller.id,
            target_role=target_role,
            caller_user=caller,
            top_k=top_k,
        )

        if not raw_hits:
            return {
                "items": [],
                "page": page,
                "limit": limit,
                "total_count": 0,
                "total_pages": 0,
                "has_more": False,
            }

        # Max-similarity pooling & strict self-exclusion
        candidate_pool = ResultAggregator.pool_and_deduplicate(
            raw_hits=raw_hits,
            caller_user_id=caller.id,
        )

        if not candidate_pool:
            return {
                "items": [],
                "page": page,
                "limit": limit,
                "total_count": 0,
                "total_pages": 0,
                "has_more": False,
            }

        # Single-query MySQL hydration (Zero N+1)
        candidate_ids = list(candidate_pool.keys())
        hydrated_users = ResultAggregator.hydrate_candidate_users(candidate_ids)

        # Multi-signal hybrid ranking
        ranked_candidates = self.ranking_service.rank_and_explain(
            caller=caller,
            candidate_pool=candidate_pool,
            hydrated_users=hydrated_users,
            limit=len(candidate_ids),
        )

        total_count = len(ranked_candidates)
        total_pages = math.ceil(total_count / limit) if total_count > 0 else 0

        # Pagination slice
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        paged_items = ranked_candidates[start_idx:end_idx]
        has_more = end_idx < total_count

        # Build cards
        cards = []
        for meta in paged_items:
            uid = meta["user_id"]
            cand_user = hydrated_users.get(uid)
            if cand_user:
                cards.append(self._build_candidate_card(cand_user, meta, caller, request))

        return {
            "items": cards,
            "page": page,
            "limit": limit,
            "total_count": total_count,
            "total_pages": total_pages,
            "has_more": has_more,
        }

    def get(self, request: Any) -> Response:
        """
        Handles GET /api/ai/recommendations/profiles/
        """
        # 1. Parse & validate pagination parameters
        try:
            limit = int(request.query_params.get("limit", 5))
            limit = max(1, min(20, limit))
        except (ValueError, TypeError):
            limit = 5

        try:
            page = int(request.query_params.get("page", 1))
            page = max(1, page)
        except (ValueError, TypeError):
            page = 1

        try:
            student_page = int(request.query_params.get("student_page", page))
            student_page = max(1, student_page)
        except (ValueError, TypeError):
            student_page = page

        try:
            alumni_page = int(request.query_params.get("alumni_page", page))
            alumni_page = max(1, alumni_page)
        except (ValueError, TypeError):
            alumni_page = page

        target_role = request.query_params.get("target_role", "ALL").strip().upper()
        if target_role not in ("ALL", "STUDENT", "ALUMNI"):
            target_role = "ALL"

        # 2. Fetch authenticated caller with full prefetching
        try:
            caller = User.objects.select_related(
                "student_profile__department",
                "student_profile__batch",
                "alumni_profile__department",
                "alumni_profile__batch",
                "alumni_profile__current_company",
            ).prefetch_related(
                "user_skills__skill__category",
                "social_links",
            ).get(id=request.user.id)
        except User.DoesNotExist:
            return Response(
                {"status": "ERROR", "message": "Authenticated user profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        caller_name = caller.get_full_name().strip() or f"{caller.first_name} {caller.last_name}".strip() or caller.email.split("@")[0]
        caller_meta = {
            "user_id": caller.id,
            "role": getattr(caller, "role", "STUDENT"),
            "name": caller_name,
        }

        # 3. Cold Start & Profile Completeness Guard
        ready, reason = is_profile_ready(caller)
        if not ready:
            missing_fields = []
            has_skills = caller.user_skills.exists() if hasattr(caller, "user_skills") else False
            if not has_skills:
                missing_fields.append("skills")

            if caller.role == "STUDENT":
                sp = getattr(caller, "student_profile", None)
                if not sp:
                    missing_fields.extend(["student_profile", "department", "bio"])
                else:
                    if not sp.bio or len(sp.bio.strip()) < 15:
                        missing_fields.append("bio")
                    if not getattr(sp, "department_id", None):
                        missing_fields.append("department")
            elif caller.role == "ALUMNI":
                ap = getattr(caller, "alumni_profile", None)
                if not ap:
                    missing_fields.extend(["alumni_profile", "current_job_title", "bio"])
                else:
                    if not ap.bio or len(ap.bio.strip()) < 15:
                        missing_fields.append("bio")
                    if not getattr(ap, "current_job_title", None) and not getattr(ap, "current_company_id", None):
                        missing_fields.append("career_details")

            empty_list = {
                "items": [],
                "page": 1,
                "limit": limit,
                "total_count": 0,
                "total_pages": 0,
                "has_more": False,
            }

            return Response(
                {
                    "status": "PROFILE_INCOMPLETE",
                    "caller": caller_meta,
                    "target_role": target_role,
                    "message": "Your profile is missing essential information. Please add your skills and bio to unlock personalized recommendations.",
                    "missing_fields": missing_fields,
                    "profile_edit_url": "/profile/edit/",
                    "students": empty_list,
                    "alumni": empty_list,
                },
                status=status.HTTP_200_OK,
            )

        # 4. Execute Retrieval & Multi-Signal Ranking
        try:
            response_data = {
                "status": "SUCCESS",
                "caller": caller_meta,
                "target_role": target_role,
            }

            if target_role in ("ALL", "STUDENT"):
                response_data["students"] = self._get_paginated_role_recommendations(
                    caller=caller,
                    target_role="STUDENT",
                    page=student_page,
                    limit=limit,
                    request=request,
                )

            if target_role in ("ALL", "ALUMNI"):
                response_data["alumni"] = self._get_paginated_role_recommendations(
                    caller=caller,
                    target_role="ALUMNI",
                    page=alumni_page,
                    limit=limit,
                    request=request,
                )

            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"[AI-02 Profile Recommendations] Unexpected error: {e}", exc_info=True)
            return Response(
                {
                    "status": "ERROR",
                    "message": "An error occurred while generating profile recommendations. Please try again.",
                    "error": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
