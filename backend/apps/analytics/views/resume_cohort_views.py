from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from apps.analytics.services.resume_cohort_services import get_cohort_resume_readiness

class ResumeCohortAnalyticsAPIView(APIView):
    permission_classes = [IsAuthenticated] # Should restrict to Placement Cell
    
    def get(self, request):
        filters = {
            'placement_year': request.query_params.get('placement_year'),
            'department_id': request.query_params.get('department_id'),
            'batch_id': request.query_params.get('batch_id'),
            'threshold': request.query_params.get('threshold', 60),
        }
        
        data = get_cohort_resume_readiness(filters)
        
        response_data = {
            "data": data,
            "meta": {
                "filters": filters,
                "generated_at": timezone.now().isoformat()
            }
        }
        return Response(response_data)
