from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from apps.analytics.services.learning_ai_services import get_learning_ai_analytics

class LearningAIAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        filters = {
            'role': request.query_params.get('role'),
            'department_id': request.query_params.get('department_id'),
            'batch_id': request.query_params.get('batch_id'),
            'semester': request.query_params.get('semester'),
            'experience_min': request.query_params.get('experience_min'),
            'experience_max': request.query_params.get('experience_max'),
            'platform_id': request.query_params.get('platform_id'),
            'ai_tool': request.query_params.get('ai_tool'),
            'primary_purpose': request.query_params.get('primary_purpose'),
            'placed_status': request.query_params.get('placed_status'),
        }
        
        data = get_learning_ai_analytics(filters)
        
        response_data = {
            "data": data,
            "meta": {
                "filters": filters,
                "generated_at": timezone.now().isoformat()
            }
        }
        return Response(response_data)
