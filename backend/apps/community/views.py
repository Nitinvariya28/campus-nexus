from django.db.models import Value, CharField
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import LimitOffsetPagination
from .models import Post
from apps.opportunities.models import Opportunity
from apps.announcements.models import Announcement
from .serializers import PostFeedSerializer, OpportunityFeedSerializer, AnnouncementFeedSerializer

class UnifiedFeedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role_filter = request.query_params.get('role', None)
        author_id = request.query_params.get('author_id', None)

        # 1. Base Querysets with injected feed_type strings
        posts_qs = Post.objects.all()
        opps_qs = Opportunity.objects.filter(status='OPEN')
        anns_qs = Announcement.objects.filter(is_published=True)

        # Apply Filters dynamically if requested
        if role_filter:
            posts_qs = posts_qs.filter(author__role=role_filter)
            opps_qs = opps_qs.filter(posted_by__role=role_filter)
            anns_qs = anns_qs.filter(created_by__role=role_filter)
        if author_id:
            posts_qs = posts_qs.filter(author_id=author_id)
            opps_qs = opps_qs.filter(posted_by_id=author_id)
            anns_qs = anns_qs.filter(created_by_id=author_id)

        # 2. Extract ONLY 3 lightweight columns for the SQL UNION
        posts = posts_qs.annotate(feed_type=Value('POST', output_field=CharField())).values('id', 'created_at', 'feed_type')
        opps = opps_qs.annotate(feed_type=Value('OPPORTUNITY', output_field=CharField())).values('id', 'created_at', 'feed_type')
        anns = anns_qs.annotate(feed_type=Value('ANNOUNCEMENT', output_field=CharField())).values('id', 'created_at', 'feed_type')

        # 3. SQL UNION: Let the database merge and sort all tables instantly!
        feed_queryset = posts.union(opps, anns).order_by('-created_at')

        # 4. Paginate only the lightweight IDs
        paginator = LimitOffsetPagination()
        paginated_feed = paginator.paginate_queryset(feed_queryset, request, view=self)

        # 5. Extract the specific IDs for the current page
        post_ids = [item['id'] for item in paginated_feed if item['feed_type'] == 'POST']
        opp_ids = [item['id'] for item in paginated_feed if item['feed_type'] == 'OPPORTUNITY']
        ann_ids = [item['id'] for item in paginated_feed if item['feed_type'] == 'ANNOUNCEMENT']

        # 6. Fetch Full Objects using Highly Optimized N+1 Query Destroyers
        full_posts = Post.objects.filter(id__in=post_ids).select_related(
            'author', 'author__student_profile__department', 'author__student_profile__batch',
            'author__alumni_profile__current_company', 'company'
        ).prefetch_related('media', 'post_tags__tag', 'likes', 'comments')

        full_opps = Opportunity.objects.filter(id__in=opp_ids).select_related('posted_by', 'company').prefetch_related('opportunity_skills__skill')
        full_anns = Announcement.objects.filter(id__in=ann_ids).select_related('created_by')

        # Map them into O(1) lookup dictionaries
        post_dict = {p.id: p for p in full_posts}
        opp_dict = {o.id: o for o in full_opps}
        ann_dict = {a.id: a for a in full_anns}

        # 7. Serialize in exact sorted order
        results = []
        for item in paginated_feed:
            if item['feed_type'] == 'POST' and item['id'] in post_dict:
                results.append(PostFeedSerializer(post_dict[item['id']], context={'request': request}).data)
            elif item['feed_type'] == 'OPPORTUNITY' and item['id'] in opp_dict:
                results.append(OpportunityFeedSerializer(opp_dict[item['id']], context={'request': request}).data)
            elif item['feed_type'] == 'ANNOUNCEMENT' and item['id'] in ann_dict:
                results.append(AnnouncementFeedSerializer(ann_dict[item['id']], context={'request': request}).data)

        return paginator.get_paginated_response(results)
