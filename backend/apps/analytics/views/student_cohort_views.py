from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from apps.analytics.services.student_cohort_services import get_student_cohort_analytics

class StudentCohortsAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        filters = {
            'department_id': request.query_params.get('department_id'),
            'batch_id': request.query_params.get('batch_id'),
            'semester': request.query_params.get('semester'),
            'placement_year': request.query_params.get('placement_year'),
            'company_tier': request.query_params.get('company_tier'),
            'industry': request.query_params.get('industry'),
        }
        
        data = get_student_cohort_analytics(filters)
        
        response_data = {
            "data": data,
            "meta": {
                "filters": filters,
                "generated_at": timezone.now().isoformat()
            }
        }
        return Response(response_data)
