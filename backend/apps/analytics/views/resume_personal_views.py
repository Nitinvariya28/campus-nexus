from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from apps.analytics.services.resume_personal_services import get_personal_resume_analytics

class ResumePersonalAnalyticsAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        filters = {
            'resume_id': request.query_params.get('resume_id')
        }
        
        data = get_personal_resume_analytics(request.user, filters['resume_id'])
        
        response_data = {
            "data": data,
            "meta": {
                "filters": filters,
                "generated_at": timezone.now().isoformat()
            }
        }
        return Response(response_data)
