from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.utils import timezone
from apps.analytics.services.admin_security_services import get_admin_security_analytics

class AdminSecurityAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser] # Admin Only
    
    def get(self, request):
        filters = {
            'date_from': request.query_params.get('date_from'),
            'date_to': request.query_params.get('date_to'),
            'threshold': request.query_params.get('threshold', 10),
        }
        
        data = get_admin_security_analytics(filters)
        
        response_data = {
            "data": data,
            "meta": {
                "filters": filters,
                "generated_at": timezone.now().isoformat()
            }
        }
        return Response(response_data)
