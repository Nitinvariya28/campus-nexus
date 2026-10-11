from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from apps.analytics.services.alumni_career_services import get_alumni_career_analytics

class AlumniCareerAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        filters = {
            'department_id': request.query_params.get('department_id'),
            'batch_id': request.query_params.get('batch_id'),
            'company_id': request.query_params.get('company_id'),
            'company_tier': request.query_params.get('company_tier'),
            'industry': request.query_params.get('industry'),
            'location': request.query_params.get('location'),
            'experience_min': request.query_params.get('experience_min'),
            'experience_max': request.query_params.get('experience_max'),
            'job_category': request.query_params.get('job_category'),
            'skill_id': request.query_params.get('skill_id'),
        }
        
        data = get_alumni_career_analytics(filters)
        
        response_data = {
            "data": data,
            "meta": {
                "filters": filters,
                "generated_at": timezone.now().isoformat()
            }
        }
        return Response(response_data)
