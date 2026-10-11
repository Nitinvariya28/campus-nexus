from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from apps.analytics.services.platform_health_services import get_platform_health_analytics

class PlatformHealthAPIView(APIView):
    permission_classes = [IsAuthenticated] # Should restrict to Placement Cell
    
    def get(self, request):
        filters = {
            'date_from': request.query_params.get('date_from'),
            'date_to': request.query_params.get('date_to'),
            'role': request.query_params.get('role'),
            'report_status': request.query_params.get('report_status'),
        }
        
        data = get_platform_health_analytics(filters)
        
        response_data = {
            "data": data,
            "meta": {
                "filters": filters,
                "generated_at": timezone.now().isoformat()
            }
        }
        return Response(response_data)
