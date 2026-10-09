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
    StandardPostSerializer, UpdatePostSerializer, PostDetailSerializer,
    CreateCommentSerializer, CommentSerializer
)
from apps.opportunities.serializers import OpportunityCreateSerializer
from apps.announcements.serializers import AnnouncementCreateSerializer
from apps.interviews.serializers import InterviewExperienceCreateSerializer

class BaseFeedView(APIView):
    permission_classes = [IsAuthenticated]

    def get_feed_response(self, request, posts_qs, opps_qs, anns_qs):
        posts = posts_qs.annotate(feed_type=Value('POST', output_field=CharField())).values('id', 'created_at', 'feed_type')
        opps = opps_qs.annotate(feed_type=Value('OPPORTUNITY', output_field=CharField())).values('id', 'created_at', 'feed_type')
        anns = anns_qs.annotate(feed_type=Value('ANNOUNCEMENT', output_field=CharField())).values('id', 'created_at', 'feed_type')

        feed_queryset = posts.union(opps, anns).order_by('-created_at')

        paginator = LimitOffsetPagination()
        paginated_feed = paginator.paginate_queryset(feed_queryset, request, view=self)

        post_ids = [item['id'] for item in paginated_feed if item['feed_type'] == 'POST']
        opp_ids = [item['id'] for item in paginated_feed if item['feed_type'] == 'OPPORTUNITY']
        ann_ids = [item['id'] for item in paginated_feed if item['feed_type'] == 'ANNOUNCEMENT']

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

        post_serializer = PostFeedSerializer(posts_data, many=True, context={'request': request})
        opp_serializer = OpportunityFeedSerializer(opps_data, many=True, context={'request': request})
        ann_serializer = AnnouncementFeedSerializer(anns_data, many=True, context={'request': request})

        combined_data = {
            'POST': {item['id']: item for item in post_serializer.data},
            'OPPORTUNITY': {item['id']: item for item in opp_serializer.data},
            'ANNOUNCEMENT': {item['id']: item for item in ann_serializer.data},
        }

        final_feed = []
        for item in paginated_feed:
            feed_type = item['feed_type']
            item_id = item['id']
            if item_id in combined_data[feed_type]:
                feed_item = combined_data[feed_type][item_id]
                feed_item['feed_type'] = feed_type
                final_feed.append(feed_item)

        return paginator.get_paginated_response(final_feed)

class UnifiedFeedView(BaseFeedView):
    def get(self, request):
        role_filter = request.query_params.get('role', None)
        author_id = request.query_params.get('author_id', None)

        posts_qs = Post.objects.all()
        opps_qs = Opportunity.objects.filter(status='OPEN')
        anns_qs = Announcement.objects.filter(is_published=True)

        if role_filter:
            posts_qs = posts_qs.filter(author__role=role_filter)
            opps_qs = opps_qs.filter(posted_by__role=role_filter)
            anns_qs = anns_qs.filter(created_by__role=role_filter)
        if author_id:
            posts_qs = posts_qs.filter(author_id=author_id)
            opps_qs = opps_qs.filter(posted_by_id=author_id)
            anns_qs = anns_qs.filter(created_by_id=author_id)

        return self.get_feed_response(request, posts_qs, opps_qs, anns_qs)

class FeedSearchView(BaseFeedView):
    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if not query:
            return Response({"error": "Search query 'q' is required."}, status=status.HTTP_400_BAD_REQUEST)

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

        return self.get_feed_response(request, posts_qs, opps_qs, anns_qs)

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
        entity_type = request.data.get('entity_type')

        if not entity_type:
            return Response({"error": "entity_type is required (e.g., STANDARD_POST, OPPORTUNITY, ANNOUNCEMENT, INTERVIEW_EXPERIENCE)"}, status=status.HTTP_400_BAD_REQUEST)

        # Role Verification
        if entity_type == 'STANDARD_POST' and user.role not in ['STUDENT', 'ALUMNI']:
            return Response({"error": "Only Students and Alumni can create Standard Posts."}, status=status.HTTP_403_FORBIDDEN)
        if entity_type == 'INTERVIEW_EXPERIENCE' and user.role != 'ALUMNI':
            return Response({"error": "Only Alumni can create Interview Experiences."}, status=status.HTTP_403_FORBIDDEN)
        if entity_type in ['OPPORTUNITY', 'ANNOUNCEMENT'] and user.role != 'PLACEMENT_CELL':
            return Response({"error": "Only Placement Cell can create Opportunities and Announcements."}, status=status.HTTP_403_FORBIDDEN)

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
                raise PermissionDenied("You do not have permission to edit this post.")
            serializer = UpdatePostSerializer(data=request.data)
            if serializer.is_valid():
                if 'title' in serializer.validated_data: post.title = serializer.validated_data['title']
                if 'content' in serializer.validated_data: post.content = serializer.validated_data['content']
                post.save()
                return Response({"message": "Post successfully updated."}, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        elif entity_type == 'OPPORTUNITY':
            opp = get_object_or_404(Opportunity, id=post_id)
            if request.user != opp.posted_by:
                raise PermissionDenied("You do not have permission to edit this opportunity.")
            serializer = OpportunityCreateSerializer(opp, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({"message": "Opportunity successfully updated."}, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        elif entity_type == 'ANNOUNCEMENT':
            ann = get_object_or_404(Announcement, id=post_id)
            if request.user != ann.created_by:
                raise PermissionDenied("You do not have permission to edit this announcement.")
            serializer = AnnouncementCreateSerializer(ann, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({"message": "Announcement successfully updated."}, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        elif entity_type == 'INTERVIEW_EXPERIENCE':
            ie = get_object_or_404(InterviewExperience, id=post_id)
            if request.user != ie.author:
                raise PermissionDenied("You do not have permission to edit this interview experience.")
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
                raise PermissionDenied("You do not have permission to delete this post.")
            post.delete()
            
        elif entity_type == 'OPPORTUNITY':
            opp = get_object_or_404(Opportunity, id=post_id)
            if request.user != opp.posted_by:
                raise PermissionDenied("You do not have permission to delete this opportunity.")
            opp.delete()
            
        elif entity_type == 'ANNOUNCEMENT':
            ann = get_object_or_404(Announcement, id=post_id)
            if request.user != ann.created_by:
                raise PermissionDenied("You do not have permission to delete this announcement.")
            ann.delete()
            
        elif entity_type == 'INTERVIEW_EXPERIENCE':
            ie = get_object_or_404(InterviewExperience, id=post_id)
            if request.user != ie.author:
                raise PermissionDenied("You do not have permission to delete this interview experience.")
            ie.delete()
            
        else:
            return Response({"error": "Invalid type."}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"message": "Successfully deleted."}, status=status.HTTP_200_OK)

    def get(self, request, post_id):
        entity_type = request.query_params.get('type', 'STANDARD_POST')
        if entity_type != 'STANDARD_POST':
            return Response({"error": "GET only supported for STANDARD_POST in this endpoint for now."}, status=status.HTTP_400_BAD_REQUEST)
            
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

class CreateCommentView(APIView):
    permission_classes = [IsAuthenticated]
    pagination_class = LimitOffsetPagination

    def get(self, request, post_id):
        post_obj = get_object_or_404(Post, id=post_id)
        comments = Comment.objects.filter(post=post_obj).select_related(
            'author', 'author__student_profile__department', 'author__student_profile__batch', 'author__alumni_profile__current_company'
        ).order_by('created_at')
        paginator = self.pagination_class()
        paginated_comments = paginator.paginate_queryset(comments, request)
        serializer = CommentSerializer(paginated_comments, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)

    def post(self, request, post_id):
        post_obj = get_object_or_404(Post, id=post_id)
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
        post_obj = get_object_or_404(Post, id=post_id)
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
        post_obj = get_object_or_404(Post, id=post_id)
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
