from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from apps.analytics.services.opportunities_services import get_opportunities_analytics

class OpportunitiesAnalyticsAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        filters = {
            'date_from': request.query_params.get('date_from'),
            'date_to': request.query_params.get('date_to'),
            'company_id': request.query_params.get('company_id'),
            'opportunity_type': request.query_params.get('opportunity_type'),
            'deadline_from': request.query_params.get('deadline_from'),
            'deadline_to': request.query_params.get('deadline_to'),
            'status': request.query_params.get('status'),
        }
        
        data = get_opportunities_analytics(filters)
        
        response_data = {
            "data": data,
            "meta": {
                "filters": filters,
                "generated_at": timezone.now().isoformat()
            }
        }
        return Response(response_data)
