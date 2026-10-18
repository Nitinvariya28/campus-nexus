from django.db.models import Value, CharField, Q
from django.shortcuts import get_object_or_404
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.exceptions import PermissionDenied

# Core Models
from .models import Post, Tag, PostTag, PostMedia, Comment, PostLike, SavedPost
from apps.opportunities.models import Opportunity, OpportunitySkill
from apps.announcements.models import Announcement
from apps.interviews.models import InterviewExperience, InterviewRound
from apps.companies.models import Company
from apps.university.models import Department, Batch
from apps.skills.models import Skill

# Serializers
from .serializers import (
    PostFeedSerializer, OpportunityFeedSerializer, AnnouncementFeedSerializer,
    InterviewExperienceFeedSerializer, OpportunityDetailSerializer,
    AnnouncementDetailSerializer, InterviewExperienceDetailSerializer,
    StandardPostSerializer, UpdatePostSerializer, PostDetailSerializer,
    CreateCommentSerializer, CommentSerializer
)
from apps.opportunities.serializers import OpportunityCreateSerializer
from apps.announcements.serializers import AnnouncementCreateSerializer
from apps.interviews.serializers import InterviewExperienceCreateSerializer

class BaseFeedView(APIView):
    permission_classes = [IsAuthenticated]

    def get_feed_response(self, request, posts_qs, opps_qs, anns_qs, interviews_qs=None):
        posts = posts_qs.annotate(feed_type=Value('POST', output_field=CharField())).values('id', 'created_at', 'feed_type')
        opps = opps_qs.annotate(feed_type=Value('OPPORTUNITY', output_field=CharField())).values('id', 'created_at', 'feed_type')
        anns = anns_qs.annotate(feed_type=Value('ANNOUNCEMENT', output_field=CharField())).values('id', 'created_at', 'feed_type')

        if interviews_qs is not None:
            interviews = interviews_qs.annotate(feed_type=Value('INTERVIEW_EXPERIENCE', output_field=CharField())).values('id', 'created_at', 'feed_type')
            feed_queryset = posts.union(opps, anns, interviews).order_by('-created_at')
        else:
            feed_queryset = posts.union(opps, anns).order_by('-created_at')

        paginator = LimitOffsetPagination()
        paginated_feed = paginator.paginate_queryset(feed_queryset, request, view=self)

        post_ids = [item['id'] for item in paginated_feed if item['feed_type'] == 'POST']
        opp_ids = [item['id'] for item in paginated_feed if item['feed_type'] == 'OPPORTUNITY']
        ann_ids = [item['id'] for item in paginated_feed if item['feed_type'] == 'ANNOUNCEMENT']
        interview_ids = [item['id'] for item in paginated_feed if item['feed_type'] == 'INTERVIEW_EXPERIENCE']

        posts_data = Post.objects.filter(id__in=post_ids).select_related(
            'author', 'author__student_profile__department', 'author__student_profile__batch',
            'author__alumni_profile__current_company', 'company'
        ).prefetch_related('media', 'post_tags__tag', 'likes')
        
        opps_data = Opportunity.objects.filter(id__in=opp_ids).select_related(
            'company', 'role', 'posted_by'
        ).prefetch_related('opportunity_skills__skill', 'eligible_departments', 'eligible_batches')
        
        anns_data = Announcement.objects.filter(id__in=ann_ids).select_related(
            'created_by'
        )

        interviews_data = InterviewExperience.objects.filter(id__in=interview_ids).select_related(
            'author', 'author__student_profile__department', 'author__student_profile__batch',
            'author__alumni_profile__current_company', 'company', 'role'
        ).prefetch_related('rounds')

        post_serializer = PostFeedSerializer(posts_data, many=True, context={'request': request})
        opp_serializer = OpportunityFeedSerializer(opps_data, many=True, context={'request': request})
        ann_serializer = AnnouncementFeedSerializer(anns_data, many=True, context={'request': request})
        interview_serializer = InterviewExperienceFeedSerializer(interviews_data, many=True, context={'request': request})

        combined_data = {
            'POST': {item['id']: item for item in post_serializer.data},
            'OPPORTUNITY': {item['id']: item for item in opp_serializer.data},
            'ANNOUNCEMENT': {item['id']: item for item in ann_serializer.data},
            'INTERVIEW_EXPERIENCE': {item['id']: item for item in interview_serializer.data},
        }

        final_feed = []
        for item in paginated_feed:
            feed_type = item['feed_type']
            item_id = item['id']
            if item_id in combined_data.get(feed_type, {}):
                feed_item = combined_data[feed_type][item_id]
                feed_item['feed_type'] = feed_type
                final_feed.append(feed_item)

        return paginator.get_paginated_response(final_feed)

class UnifiedFeedView(BaseFeedView):
    def get(self, request):
        # Support both repeated query params (?role=STUDENT&role=ALUMNI)
        # and comma-separated query params (?role=STUDENT,ALUMNI)
        roles = request.query_params.getlist('role')
        if not roles and 'role' in request.query_params:
            roles = [r.strip() for r in request.query_params.get('role', '').split(',') if r.strip()]
        elif len(roles) == 1 and ',' in roles[0]:
            roles = [r.strip() for r in roles[0].split(',') if r.strip()]

        author_id = request.query_params.get('author_id', None)

        posts_qs = Post.objects.all()
        opps_qs = Opportunity.objects.filter(status='OPEN')
        anns_qs = Announcement.objects.filter(is_published=True)
        interviews_qs = InterviewExperience.objects.all()

        if roles:
            posts_qs = posts_qs.filter(author__role__in=roles)
            opps_qs = opps_qs.filter(posted_by__role__in=roles)
            anns_qs = anns_qs.filter(created_by__role__in=roles)
            interviews_qs = interviews_qs.filter(author__role__in=roles)

        if author_id:
            if str(author_id).lower() == 'me':
                author_id = request.user.id
            posts_qs = posts_qs.filter(author_id=author_id)
            opps_qs = opps_qs.filter(posted_by_id=author_id)
            anns_qs = anns_qs.filter(created_by_id=author_id)
            interviews_qs = interviews_qs.filter(author_id=author_id)

        return self.get_feed_response(request, posts_qs, opps_qs, anns_qs, interviews_qs)

class FeedSearchView(BaseFeedView):
    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if not query:
            return Response({"error": "Search query 'q' is required."}, status=status.HTTP_400_BAD_REQUEST)

        roles = request.query_params.getlist('role')
        if not roles and 'role' in request.query_params:
            roles = [r.strip() for r in request.query_params.get('role', '').split(',') if r.strip()]
        elif len(roles) == 1 and ',' in roles[0]:
            roles = [r.strip() for r in roles[0].split(',') if r.strip()]

        posts_qs = Post.objects.filter(
            Q(title__icontains=query) |
            Q(content__icontains=query) |
            Q(company__name__icontains=query) |
            Q(post_tags__tag__name__icontains=query)
        ).distinct()

        opps_qs = Opportunity.objects.filter(
            Q(title__icontains=query) |
            Q(description__icontains=query) |
            Q(company__name__icontains=query) |
            Q(opportunity_skills__skill__name__icontains=query)
        ).filter(status='OPEN').distinct()

        anns_qs = Announcement.objects.filter(
            Q(title__icontains=query) |
            Q(content__icontains=query)
        ).filter(is_published=True)

        interviews_qs = InterviewExperience.objects.filter(
            Q(company__name__icontains=query) |
            Q(role__role_name__icontains=query) |
            Q(experience__icontains=query) |
            Q(preparation__icontains=query)
        ).distinct()

        if roles:
            posts_qs = posts_qs.filter(author__role__in=roles)
            opps_qs = opps_qs.filter(posted_by__role__in=roles)
            anns_qs = anns_qs.filter(created_by__role__in=roles)
            interviews_qs = interviews_qs.filter(author__role__in=roles)

        return self.get_feed_response(request, posts_qs, opps_qs, anns_qs, interviews_qs)

    def post(self, request):
        search_terms = request.data.get('search_terms', [])
        tags = request.data.get('tags', [])
        author_id = request.data.get('author_id', None)

        if isinstance(search_terms, str):
            search_terms = [search_terms]

        posts_qs = Post.objects.all()
        opps_qs = Opportunity.objects.filter(status='OPEN')
        anns_qs = Announcement.objects.filter(is_published=True)
        interviews_qs = InterviewExperience.objects.all()

        for term in search_terms:
            term = str(term).strip()
            if term:
                posts_qs = posts_qs.filter(
                    Q(title__icontains=term) |
                    Q(content__icontains=term) |
                    Q(company__name__icontains=term) |
                    Q(post_tags__tag__name__icontains=term)
                )
                opps_qs = opps_qs.filter(
                    Q(title__icontains=term) |
                    Q(description__icontains=term) |
                    Q(company__name__icontains=term) |
                    Q(opportunity_skills__skill__name__icontains=term)
                )
                anns_qs = anns_qs.filter(
                    Q(title__icontains=term) |
                    Q(content__icontains=term)
                )
                interviews_qs = interviews_qs.filter(
                    Q(company__name__icontains=term) |
                    Q(role__role_name__icontains=term) |
                    Q(experience__icontains=term) |
                    Q(preparation__icontains=term)
                )

        if tags:
            posts_qs = posts_qs.filter(post_tags__tag__name__in=tags)
            opps_qs = opps_qs.filter(opportunity_skills__skill__name__in=tags)

        if author_id:
            if str(author_id).lower() == 'me':
                author_id = request.user.id
            posts_qs = posts_qs.filter(author_id=author_id)
            opps_qs = opps_qs.filter(posted_by_id=author_id)
            anns_qs = anns_qs.filter(created_by_id=author_id)
            interviews_qs = interviews_qs.filter(author_id=author_id)

        posts_qs = posts_qs.distinct()
        opps_qs = opps_qs.distinct()
        anns_qs = anns_qs.distinct()
        interviews_qs = interviews_qs.distinct()

        return self.get_feed_response(request, posts_qs, opps_qs, anns_qs, interviews_qs)

class PostOptionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        options = {}
        
        if user.role == 'STUDENT':
            options['allowed_entity_types'] = ['STANDARD_POST']
            options['post_types'] = [{"value": k, "label": dict(Post.POST_TYPE_CHOICES)[k]} for k in ['INTERNSHIP', 'INTERVIEW_EXPERIENCE', 'GENERAL', 'COMPANY_INFO']]
            
        elif user.role == 'ALUMNI':
            options['allowed_entity_types'] = ['STANDARD_POST', 'INTERVIEW_EXPERIENCE']
            options['post_types'] = [{"value": k, "label": dict(Post.POST_TYPE_CHOICES)[k]} for k in ['PLACEMENT_EXPERIENCE', 'INTERVIEW_EXPERIENCE', 'INTERNSHIP', 'CAREER_ADVICE', 'COMPANY_INFO', 'GENERAL']]
            options['experience_types'] = [{"value": k, "label": v} for k, v in InterviewExperience.EXPERIENCE_TYPE_CHOICES]
            options['interview_results'] = [{"value": k, "label": v} for k, v in InterviewExperience.RESULT_CHOICES]
            options['difficulty_levels'] = [{"value": k, "label": v} for k, v in InterviewExperience.DIFFICULTY_CHOICES]
            options['round_types'] = [{"value": k, "label": v} for k, v in InterviewRound.ROUND_TYPE_CHOICES]
            options['round_modes'] = [{"value": k, "label": v} for k, v in InterviewRound.MODE_CHOICES]

        elif user.role == 'PLACEMENT_CELL':
            options['allowed_entity_types'] = ['OPPORTUNITY', 'ANNOUNCEMENT']
            options['opportunity_types'] = [{"value": k, "label": v} for k, v in Opportunity.OPPORTUNITY_TYPE_CHOICES]
            options['work_modes'] = [{"value": k, "label": v} for k, v in Opportunity.WORK_MODE_CHOICES]
            options['employment_types'] = [{"value": k, "label": v} for k, v in Opportunity.EMPLOYMENT_TYPE_CHOICES]
            options['announcement_types'] = [{"value": k, "label": v} for k, v in Announcement.ANNOUNCEMENT_TYPE_CHOICES]
            options['target_audiences'] = [{"value": k, "label": v} for k, v in Announcement.AUDIENCE_CHOICES]
            
            # Fetch relational data for Placement Cell
            options['departments'] = list(Department.objects.values('id', 'name'))
            options['batches'] = list(Batch.objects.values('id', 'start_year', 'end_year'))
            options['skills'] = list(Skill.objects.values('id', 'name'))
            
        else:
            return Response({"error": "Role not recognized for posting."}, status=status.HTTP_403_FORBIDDEN)
            
        # Common data for everyone
        options['companies'] = list(Company.objects.filter(is_active=True).values('id', 'name'))
        options['tags'] = list(Tag.objects.filter(is_active=True).values('id', 'name'))
        
        return Response(options)

class CreatePostView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        user = request.user
        entity_type = request.data.get('entity_type') or 'STANDARD_POST'

        # Role Verification
        if entity_type == 'STANDARD_POST':
            if user.role not in ['STUDENT', 'ALUMNI']:
                return Response({"error": "Only Students and Alumni can create Standard Posts."}, status=status.HTTP_403_FORBIDDEN)
            post_type = request.data.get('post_type')
            if user.role == 'STUDENT' and post_type in ['PLACEMENT_EXPERIENCE', 'CAREER_ADVICE']:
                return Response({"error": "Security Block: Students cannot create placement experience or career advice posts."}, status=status.HTTP_403_FORBIDDEN)

        elif entity_type == 'INTERVIEW_EXPERIENCE':
            if user.role != 'ALUMNI':
                return Response({"error": "Only Alumni can create Interview Experiences."}, status=status.HTTP_403_FORBIDDEN)

        elif entity_type in ['OPPORTUNITY', 'ANNOUNCEMENT']:
            if user.role != 'PLACEMENT_CELL':
                return Response({"error": "Only Placement Cell can create Opportunities and Announcements."}, status=status.HTTP_403_FORBIDDEN)
        else:
            return Response({"error": "Invalid entity_type."}, status=status.HTTP_400_BAD_REQUEST)

        # Dynamic Routing
        if entity_type == 'STANDARD_POST':
            serializer = StandardPostSerializer(data=request.data)
            if serializer.is_valid():
                post = serializer.save(author=user)
                return Response({"message": "Standard Post created successfully.", "id": post.id}, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        elif entity_type == 'OPPORTUNITY':
            serializer = OpportunityCreateSerializer(data=request.data)
            if serializer.is_valid():
                opp = serializer.save(posted_by=user)
                return Response({"message": "Opportunity created successfully.", "id": opp.id}, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        elif entity_type == 'ANNOUNCEMENT':
            serializer = AnnouncementCreateSerializer(data=request.data)
            if serializer.is_valid():
                ann = serializer.save(created_by=user)
                return Response({"message": "Announcement created successfully.", "id": ann.id}, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        elif entity_type == 'INTERVIEW_EXPERIENCE':
            serializer = InterviewExperienceCreateSerializer(data=request.data)
            if serializer.is_valid():
                ie = serializer.save(author=user)
                return Response({"message": "Interview Experience created successfully.", "id": ie.id}, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({"error": "Invalid entity_type."}, status=status.HTTP_400_BAD_REQUEST)

class PostDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def patch(self, request, post_id):
        entity_type = request.query_params.get('type', 'STANDARD_POST')
        
        if entity_type == 'STANDARD_POST':
            post = get_object_or_404(Post, id=post_id)
            if request.user != post.author:
                return Response({"error": "You do not have permission to edit this post."}, status=status.HTTP_403_FORBIDDEN)
            serializer = UpdatePostSerializer(data=request.data)
            if serializer.is_valid():
                if 'title' in serializer.validated_data: post.title = serializer.validated_data['title']
                if 'content' in serializer.validated_data: post.content = serializer.validated_data['content']
                post.save()

                if 'tag_ids' in serializer.validated_data or 'new_tags' in serializer.validated_data:
                    PostTag.objects.filter(post=post).delete()
                    final_tags = []
                    tag_ids = serializer.validated_data.get('tag_ids', [])
                    if tag_ids:
                        final_tags.extend(list(Tag.objects.filter(id__in=tag_ids)))
                    new_tags = serializer.validated_data.get('new_tags', [])
                    for tag_name in new_tags:
                        tag_obj, _ = Tag.objects.get_or_create(name=tag_name)
                        final_tags.append(tag_obj)
                    if final_tags:
                        PostTag.objects.bulk_create([PostTag(post=post, tag=tag) for tag in final_tags], ignore_conflicts=True)

                if 'media_files' in serializer.validated_data:
                    PostMedia.objects.filter(post=post).delete()
                    media_files = serializer.validated_data['media_files']
                    if media_files:
                        PostMedia.objects.bulk_create([
                            PostMedia(post=post, media_type=m.get('media_type', 'IMAGE'), file=m.get('file')) for m in media_files
                        ])

                updated_post = Post.objects.select_related(
                    'author', 'author__student_profile__department', 'author__student_profile__batch',
                    'author__alumni_profile__current_company', 'company'
                ).prefetch_related('media', 'post_tags__tag', 'likes').get(id=post.id)
                post_data = PostFeedSerializer(updated_post, context={'request': request}).data

                return Response({
                    "message": "Post successfully updated.",
                    "post": post_data
                }, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        elif entity_type == 'OPPORTUNITY':
            opp = get_object_or_404(Opportunity, id=post_id)
            if request.user != opp.posted_by:
                return Response({"error": "You do not have permission to edit this opportunity."}, status=status.HTTP_403_FORBIDDEN)
            serializer = OpportunityCreateSerializer(opp, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({"message": "Opportunity successfully updated."}, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        elif entity_type == 'ANNOUNCEMENT':
            ann = get_object_or_404(Announcement, id=post_id)
            if request.user != ann.created_by:
                return Response({"error": "You do not have permission to edit this announcement."}, status=status.HTTP_403_FORBIDDEN)
            serializer = AnnouncementCreateSerializer(ann, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({"message": "Announcement successfully updated."}, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        elif entity_type == 'INTERVIEW_EXPERIENCE':
            ie = get_object_or_404(InterviewExperience, id=post_id)
            if request.user != ie.author:
                return Response({"error": "You do not have permission to edit this interview experience."}, status=status.HTTP_403_FORBIDDEN)
            serializer = InterviewExperienceCreateSerializer(ie, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({"message": "Interview Experience successfully updated."}, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        return Response({"error": "Invalid type."}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, post_id):
        entity_type = request.query_params.get('type', 'STANDARD_POST')
        
        if entity_type == 'STANDARD_POST':
            post = get_object_or_404(Post, id=post_id)
            if request.user != post.author:
                return Response({"error": "You do not have permission to delete this post."}, status=status.HTTP_403_FORBIDDEN)
            post.delete()
            
        elif entity_type == 'OPPORTUNITY':
            opp = get_object_or_404(Opportunity, id=post_id)
            if request.user != opp.posted_by:
                return Response({"error": "You do not have permission to delete this opportunity."}, status=status.HTTP_403_FORBIDDEN)
            opp.delete()
            
        elif entity_type == 'ANNOUNCEMENT':
            ann = get_object_or_404(Announcement, id=post_id)
            if request.user != ann.created_by:
                return Response({"error": "You do not have permission to delete this announcement."}, status=status.HTTP_403_FORBIDDEN)
            ann.delete()
            
        elif entity_type == 'INTERVIEW_EXPERIENCE':
            ie = get_object_or_404(InterviewExperience, id=post_id)
            if request.user != ie.author:
                return Response({"error": "You do not have permission to delete this interview experience."}, status=status.HTTP_403_FORBIDDEN)
            ie.delete()
            
        else:
            return Response({"error": "Invalid type."}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"message": "Post successfully deleted."}, status=status.HTTP_200_OK)

    def get(self, request, post_id):
        entity_type = request.query_params.get('type', 'STANDARD_POST')
        
        if entity_type == 'STANDARD_POST':
            post = get_object_or_404(
                Post.objects.select_related(
                    'author', 'author__student_profile__department', 'author__student_profile__batch',
                    'author__alumni_profile__current_company', 'company'
                ).prefetch_related(
                    'media', 'post_tags__tag', 'likes', 'comments'
                ),
                id=post_id
            )
            serializer = PostDetailSerializer(post, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)

        elif entity_type == 'OPPORTUNITY':
            opp = get_object_or_404(
                Opportunity.objects.select_related(
                    'company', 'role', 'posted_by'
                ).prefetch_related(
                    'opportunity_skills__skill', 'eligible_departments', 'eligible_batches'
                ),
                id=post_id
            )
            serializer = OpportunityDetailSerializer(opp, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)

        elif entity_type == 'ANNOUNCEMENT':
            ann = get_object_or_404(
                Announcement.objects.select_related(
                    'created_by'
                ),
                id=post_id
            )
            serializer = AnnouncementDetailSerializer(ann, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)

        elif entity_type == 'INTERVIEW_EXPERIENCE':
            ie = get_object_or_404(
                InterviewExperience.objects.select_related(
                    'author', 'company', 'role'
                ).prefetch_related(
                    'rounds'
                ),
                id=post_id
            )
            serializer = InterviewExperienceDetailSerializer(ie, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response({"error": "Invalid type."}, status=status.HTTP_400_BAD_REQUEST)

def get_post_for_interaction(post_id, entity_type=None):
    post_obj = Post.objects.filter(id=post_id).first()
    if post_obj:
        return post_obj

    entity_type = (entity_type or '').upper()

    if entity_type == 'OPPORTUNITY' or not entity_type:
        opp = Opportunity.objects.filter(id=post_id).first()
        if opp:
            from apps.accounts.models import User
            author = opp.posted_by or User.objects.filter(role='PLACEMENT_CELL').first() or User.objects.first()
            post, _ = Post.objects.get_or_create(
                title=f"[Opportunity] {opp.title}",
                defaults={
                    'author': author,
                    'company': opp.company,
                    'post_type': 'PLACEMENT_EXPERIENCE',
                    'content': opp.description or opp.title,
                }
            )
            return post

    if entity_type == 'ANNOUNCEMENT' or not entity_type:
        ann = Announcement.objects.filter(id=post_id).first()
        if ann:
            from apps.accounts.models import User
            author = ann.created_by or User.objects.filter(role='PLACEMENT_CELL').first() or User.objects.first()
            post, _ = Post.objects.get_or_create(
                title=f"[Announcement] {ann.title}",
                defaults={
                    'author': author,
                    'post_type': 'GENERAL',
                    'content': ann.content or ann.title,
                }
            )
            return post

    if entity_type == 'INTERVIEW_EXPERIENCE' or not entity_type:
        ie = InterviewExperience.objects.filter(id=post_id).first()
        if ie:
            post, _ = Post.objects.get_or_create(
                title=f"[Interview] {ie.company.name} - {ie.role.role_name if ie.role else 'Process'}",
                defaults={
                    'author': ie.author,
                    'company': ie.company,
                    'post_type': 'INTERVIEW_EXPERIENCE',
                    'content': ie.experience or 'Interview Experience',
                }
            )
            return post

    return get_object_or_404(Post, id=post_id)

class CreateCommentView(APIView):
    permission_classes = [IsAuthenticated]
    pagination_class = LimitOffsetPagination

    def get(self, request, post_id):
        post_obj = get_post_for_interaction(post_id, request.query_params.get('type'))
        comments = Comment.objects.filter(post=post_obj).select_related(
            'author', 'author__student_profile__department', 'author__student_profile__batch', 'author__alumni_profile__current_company'
        ).order_by('created_at')
        paginator = self.pagination_class()
        paginated_comments = paginator.paginate_queryset(comments, request)
        serializer = CommentSerializer(paginated_comments, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)

    def post(self, request, post_id):
        post_obj = get_post_for_interaction(post_id, request.query_params.get('type') or request.data.get('type'))
        serializer = CreateCommentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        comment = Comment.objects.create(
            post=post_obj,
            author=request.user,
            content=serializer.validated_data['content']
        )
        response_serializer = CommentSerializer(comment, context={'request': request})
        return Response({"message": "Comment added successfully.", "comment": response_serializer.data}, status=status.HTTP_201_CREATED)

class ToggleLikeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, post_id):
        post_obj = get_post_for_interaction(post_id, request.query_params.get('type') or request.data.get('type'))
        user = request.user
        like_obj = PostLike.objects.filter(post=post_obj, user=user).first()
        if like_obj:
            like_obj.delete()
            return Response({"message": "Post unliked.", "likes_count": post_obj.likes.count(), "is_liked_by_me": False}, status=status.HTTP_200_OK)
        else:
            PostLike.objects.create(post=post_obj, user=user)
            return Response({"message": "Post liked.", "likes_count": post_obj.likes.count(), "is_liked_by_me": True}, status=status.HTTP_200_OK)

class ManageCommentView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, comment_id):
        comment = get_object_or_404(Comment, id=comment_id)
        if request.user != comment.author:
            raise PermissionDenied("You do not have permission to edit this comment.")
        content = request.data.get('content')
        if not content or not str(content).strip():
            return Response({"error": "Content cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)
        comment.content = str(content).strip()
        comment.save()
        serializer = CommentSerializer(comment, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, comment_id):
        comment = get_object_or_404(Comment, id=comment_id)
        if request.user != comment.author:
            raise PermissionDenied("You do not have permission to delete this comment.")
        comment.delete()
        return Response({"message": "Comment successfully deleted."}, status=status.HTTP_200_OK)

class ToggleBookmarkView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, post_id):
        post_obj = get_post_for_interaction(post_id, request.query_params.get('type') or request.data.get('type'))
        user = request.user
        saved_obj = SavedPost.objects.filter(post=post_obj, user=user).first()
        if saved_obj:
            saved_obj.delete()
            return Response({"message": "Post removed from bookmarks.", "is_bookmarked_by_me": False}, status=status.HTTP_200_OK)
        else:
            SavedPost.objects.create(post=post_obj, user=user)
            return Response({"message": "Post bookmarked successfully.", "is_bookmarked_by_me": True}, status=status.HTTP_200_OK)

class BookmarkListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        saved_posts = SavedPost.objects.filter(user=request.user).order_by('-saved_at').select_related(
            'post', 'post__author', 'post__author__student_profile__department', 
            'post__author__student_profile__batch', 'post__author__alumni_profile__current_company', 
            'post__company'
        ).prefetch_related('post__media', 'post__post_tags__tag', 'post__likes')
        posts = [saved.post for saved in saved_posts]
        paginator = LimitOffsetPagination()
        paginated_posts = paginator.paginate_queryset(posts, request)
        serializer = PostFeedSerializer(paginated_posts, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)
