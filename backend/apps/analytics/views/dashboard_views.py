import hashlib
import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.core.cache import cache
from apps.analytics.services.dashboard_services import get_dashboard_analytics

class DashboardAssemblerAPIView(APIView):
    """
    Universal Dashboard Assembler API Gateway.
    Aggregates high-performance multi-section dashboard analytics.
    Features robust caching layer to eliminate redundant database computation.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        view = request.query_params.get('view')
        sections_param = request.query_params.get('sections')
        force_refresh = request.query_params.get('refresh') == 'true'
        
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
            'company_tier': request.query_params.get('company_tier'),
            'industry': request.query_params.get('industry'),
            'location': request.query_params.get('location'),
            'job_category': request.query_params.get('job_category'),
            'experience_min': request.query_params.get('experience_min'),
            'experience_max': request.query_params.get('experience_max'),
            'skill_id': request.query_params.get('skill_id'),
            'offer_type': request.query_params.get('offer_type'),
            'salary_band': request.query_params.get('salary_band'),
        }

        # Cache key calculation
        cache_dict = {
            "user_role": request.user.role,
            "user_id": request.user.id if view == 'student' else None,
            "view": view,
            "sections": requested_sections,
            "filters": {k: v for k, v in filters.items() if v is not None}
        }
        cache_key = f"dash_{hashlib.md5(json.dumps(cache_dict, sort_keys=True, default=str).encode('utf-8')).hexdigest()}"

        if not force_refresh:
            cached_data = cache.get(cache_key)
            if cached_data is not None:
                return Response(cached_data)

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

        # Cache response for 60 seconds
        cache.set(cache_key, response_data, timeout=60)

        return Response(response_data)
