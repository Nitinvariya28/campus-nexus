from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from apps.accounts.models import User
from apps.companies.models import Company
from apps.community.models import Post
from apps.analytics.services.common_services import get_platform_overview

class PlatformOverviewAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        filters = {
            'department_id': request.query_params.get('department_id'),
            'batch_id': request.query_params.get('batch_id'),
            'date_from': request.query_params.get('date_from'),
            'date_to': request.query_params.get('date_to'),
            'role': request.query_params.get('role'),
        }
        
        data = get_platform_overview(filters)
        
        response_data = {
            "data": data,
            "meta": {
                "filters": filters,
                "generated_at": timezone.now().isoformat()
            }
        }
        return Response(response_data)

class LandingStatsAPIView(APIView):
    """
    Public statistics endpoint for landing/homepage display.
    Provides verified real-time platform metrics without requiring prior authentication.
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        students_count = User.objects.filter(role='STUDENT').count()
        alumni_count = User.objects.filter(role='ALUMNI').count()
        companies_count = Company.objects.count()
        posts_count = Post.objects.count()
        
        return Response({
            "status": "success",
            "data": {
                "students_count": students_count,
                "alumni_count": alumni_count,
                "companies_count": companies_count,
                "posts_count": posts_count,
            }
        })
