from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from apps.analytics.services.resources_services import get_resources_announcements_analytics

class ResourcesAnnouncementsAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        filters = {
            'date_from': request.query_params.get('date_from'),
            'date_to': request.query_params.get('date_to'),
            'category_id': request.query_params.get('category_id'),
            'author_role': request.query_params.get('author_role'),
            'company_id': request.query_params.get('company_id'),
        }
        
        data = get_resources_announcements_analytics(filters)
        
        response_data = {
            "data": data,
            "meta": {
                "filters": filters,
                "generated_at": timezone.now().isoformat()
            }
        }
        return Response(response_data)
