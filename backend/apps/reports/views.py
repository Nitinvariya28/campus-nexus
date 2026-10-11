from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.exceptions import NotFound

from .models import Report
from .serializers import (
    CreateReportSerializer,
    ReportDetailSerializer,
    ResolveReportSerializer,
)
from apps.community.models import Post, Comment
from apps.notifications.models import Notification

class ReportPagination(LimitOffsetPagination):
    default_limit = 10
    max_limit = 50

class ReportCreateListView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreateReportSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            # Check if target_id not found error was raised
            if 'target_id' in serializer.errors and any("does not exist" in str(e) for e in serializer.errors['target_id']):
                return Response({"error": "Target item does not exist."}, status=status.HTTP_404_NOT_FOUND)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        report = serializer.save(reported_by=request.user)
        response_serializer = ReportDetailSerializer(report)
        return Response(
            {
                "message": "Report submitted successfully.",
                "report": response_serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )

    def get(self, request):
        if request.user.role not in ['ADMIN', 'PLACEMENT_CELL']:
            return Response(
                {"error": "Only Administrators and Placement Cell can access moderation reports."},
                status=status.HTTP_403_FORBIDDEN,
            )

        queryset = Report.objects.all().select_related('reported_by', 'reviewed_by')

        status_param = request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param.upper())

        target_type_param = request.query_params.get('target_type')
        if target_type_param:
            queryset = queryset.filter(target_type=target_type_param.upper())

        reason_param = request.query_params.get('reason')
        if reason_param:
            queryset = queryset.filter(reason=reason_param.upper())

        queryset = queryset.order_by('-created_at')

        paginator = ReportPagination()
        paginated_queryset = paginator.paginate_queryset(queryset, request, view=self)
        serializer = ReportDetailSerializer(paginated_queryset, many=True)

        return paginator.get_paginated_response(serializer.data)

class ReportDetailManageView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, report_id):
        if request.user.role not in ['ADMIN', 'PLACEMENT_CELL']:
            return Response(
                {"error": "Only Administrators and Placement Cell can access moderation reports."},
                status=status.HTTP_403_FORBIDDEN,
            )

        report = get_object_or_404(
            Report.objects.select_related('reported_by', 'reviewed_by'),
            id=report_id,
        )
        serializer = ReportDetailSerializer(report)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @transaction.atomic
    def patch(self, request, report_id):
        if request.user.role not in ['ADMIN', 'PLACEMENT_CELL']:
            return Response(
                {"error": "Only Administrators and Placement Cell can review reports."},
                status=status.HTTP_403_FORBIDDEN,
            )

        report = get_object_or_404(Report, id=report_id)
        serializer = ResolveReportSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        new_status = serializer.validated_data['status']
        action_taken = serializer.validated_data.get('action_taken', 'NONE')

        # Action: Optionally Delete Reported Target on Resolution
        if action_taken == 'DELETE_TARGET' and new_status == 'RESOLVED':
            if report.target_type == 'POST':
                Post.objects.filter(id=report.target_id).delete()
            elif report.target_type == 'COMMENT':
                Comment.objects.filter(id=report.target_id).delete()

        report.status = new_status
        report.reviewed_by = request.user
        report.reviewed_at = timezone.now()
        report.save()

        # In-App Notification Trigger to Reporter
        Notification.objects.create(
            recipient=report.reported_by,
            notification_type='REPORT_UPDATE',
            title='Report Status Updated',
            message=f"Your report regarding {report.target_type.lower()} #{report.target_id} has been marked as {new_status.lower()}.",
            reference_type='REPORT',
            reference_id=report.id,
        )

        response_serializer = ReportDetailSerializer(report)
        return Response(
            {
                "message": "Report successfully updated.",
                "report": response_serializer.data,
            },
            status=status.HTTP_200_OK,
        )