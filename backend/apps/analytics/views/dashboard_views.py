from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from apps.analytics.services.dashboard_services import get_dashboard_analytics

class DashboardAssemblerAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        view = request.query_params.get('view')
        sections_param = request.query_params.get('sections')
        
        requested_sections = None
        if sections_param:
            requested_sections = [s.strip() for s in sections_param.split(',') if s.strip()]

        filters = {
            'date_from': request.query_params.get('date_from'),
            'date_to': request.query_params.get('date_to'),
            'department_id': request.query_params.get('department_id'),
            'batch_id': request.query_params.get('batch_id'),
            'company_id': request.query_params.get('company_id'),
            'placement_year': request.query_params.get('placement_year'),
            'resume_id': request.query_params.get('resume_id'),
        }

        data = get_dashboard_analytics(
            user=request.user,
            view=view,
            requested_sections=requested_sections,
            filters=filters
        )

        response_data = {
            "data": data,
            "meta": {
                "view": view,
                "sections": requested_sections,
                "filters": {k: v for k, v in filters.items() if v is not None},
                "generated_at": timezone.now().isoformat()
            }
        }
        return Response(response_data)
