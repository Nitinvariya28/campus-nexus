import os
import uuid
from django.shortcuts import get_object_or_404
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import Resume
from .serializers import ResumeSerializer, UploadResumeSerializer

class ResumeListUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        resumes = Resume.objects.filter(user=request.user).order_by('-is_primary', '-created_at')
        serializer = ResumeSerializer(resumes, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = UploadResumeSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        uploaded_file = serializer.validated_data['file']
        title = serializer.validated_data.get('title')
        is_primary = serializer.validated_data.get('is_primary', False)

        # Generate default title if omitted
        base_name, ext = os.path.splitext(uploaded_file.name)
        if not title or not title.strip():
            title = base_name.strip() or "My Resume"

        file_type = "PDF" if ext.lower() == ".pdf" else "DOCX"

        # Unique file storage path: resumes/user_<id>/<uuid>_<clean_filename>
        clean_filename = f"{uuid.uuid4().hex[:8]}_{uploaded_file.name.replace(' ', '_')}"
        storage_rel_path = f"resumes/user_{request.user.id}/{clean_filename}"

        saved_path = default_storage.save(storage_rel_path, ContentFile(uploaded_file.read()))

        with transaction.atomic():
            # If user has no existing resumes, make this first one primary automatically
            user_has_resumes = Resume.objects.filter(user=request.user).exists()
            if not user_has_resumes:
                is_primary = True

            # If this resume is set as primary, unmark existing primary resumes
            if is_primary:
                Resume.objects.filter(user=request.user, is_primary=True).update(is_primary=False)

            resume = Resume.objects.create(
                user=request.user,
                title=title,
                file=saved_path,
                file_type=file_type,
                is_primary=is_primary,
            )

        response_serializer = ResumeSerializer(resume, context={'request': request})
        return Response(
            {
                "message": "Resume uploaded successfully.",
                "resume": response_serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )

class SetPrimaryResumeView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, resume_id):
        resume = get_object_or_404(Resume, id=resume_id)
        if resume.user != request.user:
            return Response(
                {"error": "You do not have permission to modify this resume."},
                status=status.HTTP_403_FORBIDDEN,
            )

        with transaction.atomic():
            Resume.objects.filter(user=request.user, is_primary=True).update(is_primary=False)
            resume.is_primary = True
            resume.save(update_fields=['is_primary'])

        serializer = ResumeSerializer(resume, context={'request': request})
        return Response(
            {
                "message": "Resume set as default primary.",
                "resume": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

class ResumeDetailDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, resume_id):
        resume = get_object_or_404(Resume, id=resume_id)
        if resume.user != request.user:
            return Response(
                {"error": "You do not have permission to view this resume."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = ResumeSerializer(resume, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, resume_id):
        resume = get_object_or_404(Resume, id=resume_id)
        if resume.user != request.user:
            return Response(
                {"error": "You do not have permission to delete this resume."},
                status=status.HTTP_403_FORBIDDEN,
            )

        was_primary = resume.is_primary

        # 1. Delete physical file from storage
        try:
            if default_storage.exists(resume.file):
                default_storage.delete(resume.file)
        except Exception:
            pass

        # 2. Delete database record
        with transaction.atomic():
            resume.delete()
            # If the deleted resume was primary, promote the most recently uploaded resume
            if was_primary:
                next_resume = Resume.objects.filter(user=request.user).order_by('-created_at').first()
                if next_resume:
                    next_resume.is_primary = True
                    next_resume.save(update_fields=['is_primary'])

        return Response({"message": "Resume successfully deleted."}, status=status.HTTP_200_OK)
