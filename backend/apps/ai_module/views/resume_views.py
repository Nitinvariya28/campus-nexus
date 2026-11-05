import io
import logging
import os
import uuid
from typing import Any, Dict, Optional

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.ai_module.resume_processing.extractor import (
    extract_skills_from_text,
    extract_text_from_file,
    segment_resume_sections,
)
from apps.ai_module.serializers.resume_serializers import (
    PrimaryResumeResponseSerializer,
    ResumeAnalyzeRequestSerializer,
    ResumeAnalyzeResponseSerializer,
)
from apps.ai_module.services.ats_service import calculate_ats_score
from apps.ai_module.services.suggestion_service import generate_resume_suggestions
from apps.resumes.models import Resume, ResumeAnalysis

logger = logging.getLogger(__name__)


def _build_file_url(request, file_path: str) -> str:
    """Builds absolute or relative accessible URL for a stored resume file."""
    if not file_path:
        return ""
    try:
        url = default_storage.url(file_path)
        return request.build_absolute_uri(url)
    except Exception:
        return f"/media/{file_path}"


class PrimaryResumeView(APIView):
    """
    Helper endpoint returning caller's active primary resume.
    GET /api/ai/resume/primary/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        primary_resume = (
            Resume.objects.filter(user=request.user, is_primary=True)
            .order_by("-updated_at")
            .first()
        )

        if not primary_resume:
            return Response(
                {"has_primary_resume": False, "resume": None},
                status=status.HTTP_200_OK,
            )

        data = {
            "has_primary_resume": True,
            "resume": {
                "id": primary_resume.id,
                "title": primary_resume.title,
                "file_url": _build_file_url(request, primary_resume.file),
                "file_type": primary_resume.file_type,
                "created_at": primary_resume.created_at,
            },
        }
        return Response(data, status=status.HTTP_200_OK)


class ResumeAnalyzeView(APIView):
    """
    Unified AI Resume Hub Endpoint (Phases 12, 13 & 14).
    Computes ATS Compatibility Score (AI-04) & Generates AI Improvement Suggestions (AI-05).
    Persists analysis record directly into Table 28 (ResumeAnalysis) for analytics integration.

    POST /api/ai/resume/analyze/
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        serializer = ResumeAnalyzeRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        job_description = serializer.validated_data["job_description"].strip()
        use_primary = serializer.validated_data.get("use_primary", False)
        resume_id = serializer.validated_data.get("resume_id")
        resume_file = serializer.validated_data.get("resume_file")
        save_to_profile = serializer.validated_data.get("save_to_profile", False)

        target_resume: Optional[Resume] = None
        file_bytes: Optional[bytes] = None
        file_type = "PDF"
        resume_title = "Uploaded Resume"
        is_primary = False

        # Resolution Strategy:
        # 1. Direct file upload
        if resume_file:
            _, ext = os.path.splitext(resume_file.name)
            file_type = "DOCX" if ext.lower() == ".docx" else "PDF"
            resume_title = resume_file.name
            file_bytes = resume_file.read()

            # If user checked save_to_profile or has no existing resumes, persist to Table 27
            has_existing = Resume.objects.filter(user=request.user).exists()
            if save_to_profile or not has_existing:
                clean_filename = f"{uuid.uuid4().hex[:8]}_{resume_file.name.replace(' ', '_')}"
                storage_rel_path = f"resumes/user_{request.user.id}/{clean_filename}"
                saved_path = default_storage.save(storage_rel_path, ContentFile(file_bytes))

                should_be_primary = save_to_profile and not has_existing

                with transaction.atomic():
                    if should_be_primary:
                        Resume.objects.filter(user=request.user, is_primary=True).update(is_primary=False)

                    target_resume = Resume.objects.create(
                        user=request.user,
                        title=resume_title,
                        file=saved_path,
                        file_type=file_type,
                        is_primary=should_be_primary,
                    )
                    is_primary = should_be_primary

        # 2. Existing resume by ID
        elif resume_id:
            target_resume = Resume.objects.filter(id=resume_id, user=request.user).first()
            if not target_resume:
                return Response(
                    {"error": f"Resume with ID {resume_id} not found in your profile."},
                    status=status.HTTP_404_NOT_FOUND,
                )
            resume_title = target_resume.title
            file_type = target_resume.file_type
            is_primary = target_resume.is_primary

            try:
                with default_storage.open(target_resume.file, "rb") as f:
                    file_bytes = f.read()
            except Exception as e:
                logger.error(f"[Resume View] Failed to read stored resume {target_resume.file}: {e}")
                return Response(
                    {"error": f"Could not read the stored resume file: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        # 3. Default to primary profile resume
        elif use_primary:
            target_resume = (
                Resume.objects.filter(user=request.user, is_primary=True)
                .order_by("-updated_at")
                .first()
            )
            if not target_resume:
                return Response(
                    {
                        "error": "No primary resume found on your profile. "
                        "Please upload a resume file or set a primary resume in your profile."
                    },
                    status=status.HTTP_404_NOT_FOUND,
                )
            resume_title = target_resume.title
            file_type = target_resume.file_type
            is_primary = target_resume.is_primary

            try:
                with default_storage.open(target_resume.file, "rb") as f:
                    file_bytes = f.read()
            except Exception as e:
                logger.error(f"[Resume View] Failed to read primary resume {target_resume.file}: {e}")
                return Response(
                    {"error": f"Could not read the stored resume file: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        if not file_bytes:
            return Response(
                {"error": "Please provide a resume file or select an existing resume."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 4. Extract text from resume bytes
        try:
            file_stream = io.BytesIO(file_bytes)
            file_stream.name = f"resume.{file_type.lower()}"
            extracted_info = extract_text_from_file(file_stream, file_type=file_type)
            resume_text = extracted_info.get("clean_text", "")
            page_count = extracted_info.get("page_count", 1)
        except Exception as e:
            logger.error(f"[Resume View] Text extraction failed: {e}")
            return Response(
                {"error": f"Failed to parse resume document: {str(e)}"},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        if not resume_text or len(resume_text.strip()) < 30:
            return Response(
                {
                    "error": "Unable to extract meaningful text from resume. "
                    "Please ensure the file is not empty, scanned image-only, or password-protected."
                },
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        # 5. Segment sections & extract candidate skills
        parsed_sections = segment_resume_sections(resume_text)
        candidate_skills = extract_skills_from_text(resume_text)

        # 6. Compute Quantitative ATS Compatibility Score (AI-04)
        ats_score_data = calculate_ats_score(
            resume_text=resume_text,
            job_description=job_description,
            parsed_sections=parsed_sections,
            extracted_skills=candidate_skills,
            page_count=page_count,
        )

        # 7. Generate Actionable AI Suggestions (AI-05)
        ai_suggestions_data = generate_resume_suggestions(
            resume_text=resume_text,
            job_description=job_description,
            parsed_sections=parsed_sections,
            matched_skills=ats_score_data["matched_skills"],
            missing_skills=ats_score_data["missing_skills"],
        )

        # 8. Persist to Table 28 (ResumeAnalysis) for immediate Part 2 Analytics synchronization
        analysis_id = None
        if target_resume:
            try:
                analysis = ResumeAnalysis.objects.create(
                    resume=target_resume,
                    analysis_version="v1.0-gemini",
                    extracted_text=resume_text[:20000],
                    extracted_skills=ats_score_data["matched_skills"],
                    experience_summary=parsed_sections.get("experience", "")[:2000],
                    education_summary=parsed_sections.get("education", "")[:1000],
                    strengths=ai_suggestions_data.get("strengths", []),
                    missing_skills=ats_score_data["missing_skills"],
                    suggestions=ai_suggestions_data,
                    score=ats_score_data["overall_score"],
                )
                analysis_id = analysis.id
                logger.info(f"[Resume View] Persisted ResumeAnalysis #{analysis_id} for Resume #{target_resume.id}")
            except Exception as e:
                logger.error(f"[Resume View] Error saving ResumeAnalysis: {e}")

        resume_info = {
            "resume_id": target_resume.id if target_resume else None,
            "title": resume_title,
            "is_primary": is_primary,
            "file_type": file_type,
        }

        response_payload = {
            "status": "SUCCESS",
            "resume_info": resume_info,
            "ats_score": ats_score_data,
            "ai_suggestions": ai_suggestions_data,
            "analysis_id": analysis_id,
        }

        return Response(response_payload, status=status.HTTP_200_OK)
