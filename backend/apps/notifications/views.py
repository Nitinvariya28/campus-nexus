from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import LimitOffsetPagination

from .models import Notification
from .serializers import NotificationSerializer

class NotificationPagination(LimitOffsetPagination):
    default_limit = 10
    max_limit = 50

    def get_paginated_response(self, data, unread_count=0):
        return Response({
            'count': self.count,
            'unread_count': unread_count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'results': data
        })

class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        queryset = Notification.objects.filter(recipient=user)

        # Optional Filter by Read Status
        is_read_param = request.query_params.get('is_read')
        if is_read_param is not None:
            if is_read_param.lower() in ['true', '1']:
                queryset = queryset.filter(is_read=True)
            elif is_read_param.lower() in ['false', '0']:
                queryset = queryset.filter(is_read=False)

        # Optional Filter by Notification Type
        notif_type = request.query_params.get('notification_type')
        if notif_type:
            queryset = queryset.filter(notification_type=notif_type)

        queryset = queryset.order_by('-created_at')

        unread_count = Notification.objects.filter(recipient=user, is_read=False).count()

        paginator = NotificationPagination()
        paginated_queryset = paginator.paginate_queryset(queryset, request, view=self)
        serializer = NotificationSerializer(paginated_queryset, many=True)

        return paginator.get_paginated_response(serializer.data, unread_count=unread_count)

class MarkNotificationReadView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, notification_id):
        notification = get_object_or_404(Notification, id=notification_id)
        if notification.recipient != request.user:
            return Response(
                {"error": "You do not have permission to modify this notification."},
                status=status.HTTP_403_FORBIDDEN
            )

        if not notification.is_read:
            notification.is_read = True
            notification.read_at = timezone.now()
            notification.save(update_fields=['is_read', 'read_at'])

        serializer = NotificationSerializer(notification)
        return Response({
            "message": "Notification marked as read.",
            "notification": serializer.data
        }, status=status.HTTP_200_OK)

class MarkAllNotificationsReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        now = timezone.now()
        updated_count = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).update(is_read=True, read_at=now)

        return Response({
            "message": f"{updated_count} notification(s) marked as read.",
            "updated_count": updated_count
        }, status=status.HTTP_200_OK)
