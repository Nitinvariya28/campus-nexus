from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from apps.analytics.services.company_performance_services import get_company_performance_analytics

class CompanyPerformanceAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        filters = {
            'placement_year': request.query_params.get('placement_year'),
            'company_id': request.query_params.get('company_id'),
            'company_tier': request.query_params.get('company_tier'),
            'industry': request.query_params.get('industry'),
            'department_id': request.query_params.get('department_id'),
            'batch_id': request.query_params.get('batch_id'),
            'hiring_mode': request.query_params.get('hiring_mode'),
            'offer_type': request.query_params.get('offer_type'),
        }
        
        data = get_company_performance_analytics(filters)
        
        response_data = {
            "data": data,
            "meta": {
                "filters": filters,
                "generated_at": timezone.now().isoformat()
            }
        }
        return Response(response_data)
