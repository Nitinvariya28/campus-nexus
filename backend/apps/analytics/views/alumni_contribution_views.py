from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from apps.analytics.services.alumni_contribution_services import get_alumni_contribution_analytics

class AlumniContributionAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        filters = {
            'date_from': request.query_params.get('date_from'),
            'date_to': request.query_params.get('date_to'),
            'company_id': request.query_params.get('company_id'),
            'skill_id': request.query_params.get('skill_id'),
            'author_id': request.query_params.get('author_id'),
            'opportunity_id': request.query_params.get('opportunity_id'),
        }
        
        data = get_alumni_contribution_analytics(filters)
        
        response_data = {
            "data": data,
            "meta": {
                "filters": filters,
                "generated_at": timezone.now().isoformat()
            }
        }
        return Response(response_data)
