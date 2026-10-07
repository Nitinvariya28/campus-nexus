from django.db.models import Value, CharField
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import LimitOffsetPagination
from .models import Post, Tag, PostTag, PostMedia, Comment, PostLike, SavedPost
from apps.opportunities.models import Opportunity
from apps.announcements.models import Announcement
from .serializers import PostFeedSerializer, OpportunityFeedSerializer, AnnouncementFeedSerializer

from django.db.models import Q

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

        full_posts = Post.objects.filter(id__in=post_ids).select_related(
            'author', 'author__student_profile__department', 'author__student_profile__batch',
            'author__alumni_profile__current_company', 'company'
        ).prefetch_related('media', 'post_tags__tag', 'likes', 'comments')
        
        full_opps = Opportunity.objects.filter(id__in=opp_ids).select_related('posted_by', 'company').prefetch_related('opportunity_skills__skill')
        full_anns = Announcement.objects.filter(id__in=ann_ids).select_related('created_by')

        post_dict = {p.id: p for p in full_posts}
        opp_dict = {o.id: o for o in full_opps}
        ann_dict = {a.id: a for a in full_anns}

        results = []
        for item in paginated_feed:
            if item['feed_type'] == 'POST' and item['id'] in post_dict:
                results.append(PostFeedSerializer(post_dict[item['id']], context={'request': request}).data)
            elif item['feed_type'] == 'OPPORTUNITY' and item['id'] in opp_dict:
                results.append(OpportunityFeedSerializer(opp_dict[item['id']], context={'request': request}).data)
            elif item['feed_type'] == 'ANNOUNCEMENT' and item['id'] in ann_dict:
                results.append(AnnouncementFeedSerializer(ann_dict[item['id']], context={'request': request}).data)

        return paginator.get_paginated_response(results)

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
    def post(self, request):
        search_terms = request.data.get('search_terms', [])
        tags = request.data.get('tags', [])
        author_id = request.data.get('author_id', None)
        
        posts_qs = Post.objects.all()
        opps_qs = Opportunity.objects.filter(status='OPEN')
        anns_qs = Announcement.objects.filter(is_published=True)
        
        if author_id:
            posts_qs = posts_qs.filter(author_id=author_id)
            opps_qs = opps_qs.filter(posted_by_id=author_id)
            anns_qs = anns_qs.filter(created_by_id=author_id)
            
        if tags:
            posts_qs = posts_qs.filter(post_tags__tag__name__in=tags).distinct()
            
        if search_terms:
            post_q = Q()
            opp_q = Q()
            ann_q = Q()
            for term in search_terms:
                term_clean = str(term).strip()
                post_q &= (Q(title__icontains=term_clean) | Q(content__icontains=term_clean))
                opp_q &= (Q(title__icontains=term_clean) | Q(description__icontains=term_clean))
                ann_q &= (Q(title__icontains=term_clean) | Q(content__icontains=term_clean))
                
            posts_qs = posts_qs.filter(post_q)
            opps_qs = opps_qs.filter(opp_q)
            anns_qs = anns_qs.filter(ann_q)
            
        return self.get_feed_response(request, posts_qs, opps_qs, anns_qs)

from django.db import transaction
from apps.companies.models import Company
from .models import Tag, PostTag, PostMedia
from .serializers import CreatePostSerializer

class PostOptionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # 1. Determine Post Types based on Role
        # All choices: PLACEMENT_EXPERIENCE, INTERVIEW_EXPERIENCE, INTERNSHIP, CAREER_ADVICE, COMPANY_INFO, GENERAL
        all_choices = dict(Post.POST_TYPE_CHOICES)
        
        if user.role == 'PLACEMENT_CELL':
            allowed_types = ['COMPANY_INFO', 'GENERAL']
        elif user.role == 'STUDENT':
            allowed_types = ['INTERNSHIP', 'INTERVIEW_EXPERIENCE', 'GENERAL', 'COMPANY_INFO']
        elif user.role == 'ALUMNI':
            allowed_types = ['PLACEMENT_EXPERIENCE', 'INTERVIEW_EXPERIENCE', 'INTERNSHIP', 'CAREER_ADVICE', 'COMPANY_INFO', 'GENERAL']
        else:
            allowed_types = ['GENERAL']
            
        post_types = [{"value": k, "label": all_choices[k]} for k in allowed_types]
        
        # 2. Fetch Active Companies
        companies = Company.objects.filter(is_active=True).values('id', 'name')
        
        # 3. Fetch Active Tags
        tags = Tag.objects.filter(is_active=True).values('id', 'name')
        
        return Response({
            "post_types": post_types,
            "companies": list(companies),
            "tags": list(tags)
        })

class CreatePostView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = CreatePostSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        validated_data = serializer.validated_data
        user = request.user
        
        # 1. Role Validation (Security Check)
        post_type = validated_data.get('post_type')
        allowed_types_by_role = {
            'PLACEMENT_CELL': ['COMPANY_INFO', 'GENERAL'],
            'STUDENT': ['INTERNSHIP', 'INTERVIEW_EXPERIENCE', 'GENERAL', 'COMPANY_INFO'],
            'ALUMNI': ['PLACEMENT_EXPERIENCE', 'INTERVIEW_EXPERIENCE', 'INTERNSHIP', 'CAREER_ADVICE', 'COMPANY_INFO', 'GENERAL'],
        }
        
        allowed_for_user = allowed_types_by_role.get(user.role, ['GENERAL'])
        
        if post_type not in allowed_for_user:
            return Response({
                "error": f"Security Block: Users with role '{user.role}' are not authorized to create '{post_type}' posts."
            }, status=status.HTTP_403_FORBIDDEN)
            
        # 2. Handle Company ("Other" logic)
        company = None
        company_id = validated_data.get('company_id')
        new_company_name = validated_data.get('new_company_name')
        
        if company_id:
            try:
                company = Company.objects.get(id=company_id)
            except Company.DoesNotExist:
                return Response({"error": "Selected company does not exist."}, status=status.HTTP_400_BAD_REQUEST)
        elif new_company_name:
            # Create a new unverified company
            company, _ = Company.objects.get_or_create(name=new_company_name, defaults={"is_active": False})
            
        # 3. Create the Post
        post = Post.objects.create(
            author=user,
            company=company,
            post_type=post_type,
            title=validated_data.get('title'),
            content=validated_data.get('content')
        )
        
        # 4. Handle Tags (Multiple Select & "Other")
        tag_ids = validated_data.get('tag_ids', [])
        new_tags_names = validated_data.get('new_tags', [])
        
        final_tags = []
        if tag_ids:
            final_tags.extend(list(Tag.objects.filter(id__in=tag_ids)))
            
        if new_tags_names:
            # Create new tags in bulk (or ignore if exist using get_or_create logic in loop)
            # For strict performance, we iterate since get_or_create is safer for unique constraints
            for tag_name in new_tags_names:
                tag_obj, _ = Tag.objects.get_or_create(name=tag_name)
                final_tags.append(tag_obj)
                
        # Bulk create PostTags
        if final_tags:
            post_tags_to_create = [PostTag(post=post, tag=tag) for tag in final_tags]
            PostTag.objects.bulk_create(post_tags_to_create, ignore_conflicts=True)
            
        # 5. Handle Media Attachments
        media_files = validated_data.get('media_files', [])
        if media_files:
            media_to_create = [
                PostMedia(post=post, media_type=media.get('media_type', 'IMAGE'), file=media.get('file'))
                for media in media_files
            ]
            PostMedia.objects.bulk_create(media_to_create)
            
        # Return success with the created post data
        return Response({
            "message": "Post created successfully.",
            "post_id": post.id
        }, status=status.HTTP_201_CREATED)

from django.shortcuts import get_object_or_404
from .serializers import PostDetailSerializer

class PostDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def patch(self, request, post_id):
        post = get_object_or_404(Post, id=post_id)
        
        # 1. Security Check
        if request.user != post.author:
            return Response(
                {"error": "You do not have permission to edit this post."}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        from .serializers import UpdatePostSerializer
        serializer = UpdatePostSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        validated_data = serializer.validated_data
        
        # 2. Update Core Data
        if 'title' in validated_data:
            post.title = validated_data['title']
        if 'content' in validated_data:
            post.content = validated_data['content']
        post.save()
        
        # 3. Handle Tags (Overwrite Strategy)
        if 'tag_ids' in validated_data or 'new_tags' in validated_data:
            PostTag.objects.filter(post=post).delete()
            tag_ids = validated_data.get('tag_ids', [])
            new_tags_names = validated_data.get('new_tags', [])
            
            final_tags = []
            if tag_ids:
                final_tags.extend(list(Tag.objects.filter(id__in=tag_ids)))
                
            if new_tags_names:
                for tag_name in new_tags_names:
                    tag_obj, _ = Tag.objects.get_or_create(name=tag_name)
                    final_tags.append(tag_obj)
                    
            if final_tags:
                post_tags_to_create = [PostTag(post=post, tag=tag) for tag in final_tags]
                PostTag.objects.bulk_create(post_tags_to_create, ignore_conflicts=True)
                
        # 4. Handle Media (Overwrite Strategy)
        if 'media_files' in validated_data:
            PostMedia.objects.filter(post=post).delete()
            media_files = validated_data.get('media_files', [])
            if media_files:
                media_to_create = [
                    PostMedia(post=post, media_type=media.get('media_type', 'IMAGE'), file=media.get('file'))
                    for media in media_files
                ]
                PostMedia.objects.bulk_create(media_to_create)
                
        # 5. Return Updated Post
        updated_post = Post.objects.select_related(
            'author', 'author__student_profile__department', 'author__student_profile__batch',
            'author__alumni_profile__current_company', 'company'
        ).prefetch_related('media', 'post_tags__tag', 'likes').get(id=post.id)
        
        response_serializer = PostDetailSerializer(updated_post, context={'request': request})
        return Response({
            "message": "Post successfully updated.",
            "post": response_serializer.data
        }, status=status.HTTP_200_OK)

    def delete(self, request, post_id):
        # 1. Existence Verification
        post = get_object_or_404(Post, id=post_id)
        
        # 2. Object-Level Permission Check
        if request.user != post.author:
            return Response(
                {"error": "You do not have permission to delete this post."}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        # 3. Destruction & Cascade
        post.delete()
        return Response({"message": "Post successfully deleted."}, status=status.HTTP_200_OK)

    def get(self, request, post_id):
        # Optimized N+1 Query Resolution
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

from .serializers import CreateCommentSerializer, CommentSerializer

class CreateCommentView(APIView):
    permission_classes = [IsAuthenticated]
    pagination_class = LimitOffsetPagination

    def get(self, request, post_id):
        # 1. Verify Post exists
        post_obj = get_object_or_404(Post, id=post_id)
        
        # 2. Get all comments ordered by creation date (newest first or oldest first, standard is oldest first for comments)
        comments = Comment.objects.filter(post=post_obj).select_related(
            'author', 'author__student_profile__department', 'author__student_profile__batch', 'author__alumni_profile__current_company'
        ).order_by('created_at')
        
        # 3. Paginate
        paginator = self.pagination_class()
        paginated_comments = paginator.paginate_queryset(comments, request)
        
        # 4. Serialize and return
        serializer = CommentSerializer(paginated_comments, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)

    def post(self, request, post_id):
        # 1. Safety Check: Does the Post still exist?
        post_obj = get_object_or_404(Post, id=post_id)
        
        # 2. Validate the incoming text
        serializer = CreateCommentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        # 3. Create the Comment (Link Author, Post, and Content)
        comment = Comment.objects.create(
            post=post_obj,
            author=request.user,
            content=serializer.validated_data['content']
        )
        
        # 4. Serialize the newly created comment (with full author details) to return to UI
        response_serializer = CommentSerializer(comment, context={'request': request})
        
        return Response({
            "message": "Comment added successfully.",
            "comment": response_serializer.data
        }, status=status.HTTP_201_CREATED)


class ToggleLikeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, post_id):
        # 1. Verify post exists
        post_obj = get_object_or_404(Post, id=post_id)
        user = request.user
        
        # 2. Check if the user already liked the post
        like_obj = PostLike.objects.filter(post=post_obj, user=user).first()
        
        if like_obj:
            # If it exists, delete it (UNLIKE)
            like_obj.delete()
            is_liked_by_me = False
            message = "Post unliked."
        else:
            # If it doesn't exist, create it (LIKE)
            PostLike.objects.create(post=post_obj, user=user)
            is_liked_by_me = True
            message = "Post liked."
            
        # 3. Get the updated total count
        likes_count = post_obj.likes.count()
        
        # 4. Return UI-optimized JSON
        return Response({
            "message": message,
            "likes_count": likes_count,
            "is_liked_by_me": is_liked_by_me
        }, status=status.HTTP_200_OK)

class ManageCommentView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, comment_id):
        comment = get_object_or_404(Comment, id=comment_id)
        
        # 1. Security Check
        if request.user != comment.author:
            return Response(
                {"error": "You do not have permission to edit this comment."}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        content = request.data.get('content')
        if not content or not str(content).strip():
            return Response({"error": "Content cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)
            
        # 2. Update
        comment.content = str(content).strip()
        comment.save()
        
        # 3. Return serialized data
        serializer = CommentSerializer(comment, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, comment_id):
        comment = get_object_or_404(Comment, id=comment_id)
        
        # 1. Security Check
        if request.user != comment.author:
            return Response(
                {"error": "You do not have permission to delete this comment."}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        # 2. Delete
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
            is_bookmarked_by_me = False
            message = "Post removed from bookmarks."
        else:
            SavedPost.objects.create(post=post_obj, user=user)
            is_bookmarked_by_me = True
            message = "Post bookmarked successfully."
            
        return Response({
            "message": message,
            "is_bookmarked_by_me": is_bookmarked_by_me
        }, status=status.HTTP_200_OK)

class BookmarkListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        saved_posts = SavedPost.objects.filter(user=request.user).order_by('-saved_at').select_related(
            'post', 'post__author', 'post__author__student_profile__department', 
            'post__author__student_profile__batch', 'post__author__alumni_profile__current_company', 
            'post__company'
        ).prefetch_related('post__media', 'post__post_tags__tag', 'post__likes')
        
        # Extract the actual Post objects from the SavedPost wrappers
        posts = [saved.post for saved in saved_posts]
        
        paginator = LimitOffsetPagination()
        paginated_posts = paginator.paginate_queryset(posts, request)
        
        serializer = PostFeedSerializer(paginated_posts, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)
