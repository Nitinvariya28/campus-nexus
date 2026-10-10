from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from apps.analytics.services.skill_distribution_services import get_skill_distribution_analytics

class SkillDistributionAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        filters = {
            'role': request.query_params.get('role'),
            'department_id': request.query_params.get('department_id'),
            'batch_id': request.query_params.get('batch_id'),
            'company_id': request.query_params.get('company_id'),
            'job_category': request.query_params.get('job_category'),
            'skill_id': request.query_params.get('skill_id'),
            'proficiency': request.query_params.get('proficiency'),
        }
        
        data = get_skill_distribution_analytics(filters)
        
        response_data = {
            "data": data,
            "meta": {
                "filters": filters,
                "generated_at": timezone.now().isoformat()
            }
        }
        return Response(response_data)
