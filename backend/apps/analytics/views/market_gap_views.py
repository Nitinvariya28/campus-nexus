from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from apps.analytics.services.market_gap_services import get_market_gap_analytics

class MarketGapAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        filters = {
            'placement_year': request.query_params.get('placement_year'),
            'department_id': request.query_params.get('department_id'),
            'batch_id': request.query_params.get('batch_id'),
            'semester': request.query_params.get('semester'),
            'skill_id': request.query_params.get('skill_id'),
            'company_id': request.query_params.get('company_id'),
            'company_tier': request.query_params.get('company_tier'),
            'industry': request.query_params.get('industry'),
            'employment_type': request.query_params.get('employment_type'),
        }
        
        data = get_market_gap_analytics(filters)
        
        response_data = {
            "data": data,
            "meta": {
                "filters": filters,
                "generated_at": timezone.now().isoformat()
            }
        }
        return Response(response_data)
