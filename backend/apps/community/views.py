import os
import uuid
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.db.models import Value, CharField, IntegerField, Count, Q
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
from apps.accounts.models import User
from apps.notifications.models import Notification
from apps.opportunities.models import Opportunity, OpportunitySkill
from apps.announcements.models import Announcement
from apps.interviews.models import InterviewExperience, InterviewRound
from apps.companies.models import Company, CompanyRole
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

    def get_feed_response(self, request, posts_qs, opps_qs, anns_qs, interviews_qs=None, sort='latest'):
        if sort == 'popular':
            posts = posts_qs.annotate(
                feed_type=Value('POST', output_field=CharField()),
                score=Count('likes', distinct=True) + Count('comments', distinct=True)
            ).values('id', 'created_at', 'feed_type', 'score')
            opps = opps_qs.annotate(
                feed_type=Value('OPPORTUNITY', output_field=CharField()),
                score=Value(0, output_field=IntegerField())
            ).values('id', 'created_at', 'feed_type', 'score')
            anns = anns_qs.annotate(
                feed_type=Value('ANNOUNCEMENT', output_field=CharField()),
                score=Value(0, output_field=IntegerField())
            ).values('id', 'created_at', 'feed_type', 'score')

            if interviews_qs is not None:
                interviews = interviews_qs.annotate(
                    feed_type=Value('INTERVIEW_EXPERIENCE', output_field=CharField()),
                    score=Value(0, output_field=IntegerField())
                ).values('id', 'created_at', 'feed_type', 'score')
                feed_queryset = posts.union(opps, anns, interviews).order_by('-score', '-created_at')
            else:
                feed_queryset = posts.union(opps, anns).order_by('-score', '-created_at')
        else:
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
        ).prefetch_related('media', 'post_tags__tag', 'likes', 'comments', 'saved_by_users')
        
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
        is_saved = request.query_params.get('is_saved', '').lower() in ['true', '1']

        # Category filters: ?category=interview,placement or ?category=interview&category=placement
        categories = request.query_params.getlist('category')
        if not categories and 'category' in request.query_params:
            categories = [c.strip().lower() for c in request.query_params.get('category', '').split(',') if c.strip()]
        elif len(categories) == 1 and ',' in categories[0]:
            categories = [c.strip().lower() for c in categories[0].split(',') if c.strip()]
        else:
            categories = [c.strip().lower() for c in categories if c.strip()]

        # Tag filter: ?tag=DSA or ?tag=#DSA
        tag = request.query_params.get('tag', '').strip()
        if tag:
            tag = tag.lstrip('#').strip()

        # Sort: ?sort=latest or ?sort=popular
        sort = request.query_params.get('sort', 'latest').strip().lower()

        posts_qs = Post.objects.exclude(title__startswith='[')
        opps_qs = Opportunity.objects.filter(status='OPEN')
        anns_qs = Announcement.objects.filter(is_published=True)
        interviews_qs = InterviewExperience.objects.all()

        if is_saved:
            posts_qs = posts_qs.filter(saved_by_users__user=request.user)
            opps_qs = opps_qs.none()
            anns_qs = anns_qs.none()
            interviews_qs = interviews_qs.none()

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

        # Apply Category Filter if provided
        if categories:
            post_types = set()
            include_interviews = False
            include_opps = False
            opp_types = set()
            include_anns = False

            for cat in categories:
                if cat == 'interview':
                    post_types.add('INTERVIEW_EXPERIENCE')
                    include_interviews = True
                elif cat == 'placement':
                    post_types.add('PLACEMENT_EXPERIENCE')
                    include_opps = True
                    opp_types.add('PLACEMENT')
                elif cat == 'career':
                    post_types.add('CAREER_ADVICE')
                elif cat == 'internship':
                    post_types.add('INTERNSHIP')
                    include_opps = True
                    opp_types.add('INTERNSHIP')
                elif cat == 'other':
                    post_types.add('GENERAL')
                    post_types.add('COMPANY_INFO')
                    include_anns = True

            posts_qs = posts_qs.filter(post_type__in=post_types)
            
            if not include_interviews:
                interviews_qs = interviews_qs.none()
                
            if not include_opps:
                opps_qs = opps_qs.none()
            elif opp_types:
                opps_qs = opps_qs.filter(opportunity_type__in=opp_types)

            if not include_anns:
                anns_qs = anns_qs.none()

        # Apply Tag Filter if provided
        if tag:
            posts_qs = posts_qs.filter(post_tags__tag__name__iexact=tag).distinct()
            opps_qs = opps_qs.filter(
                Q(opportunity_skills__skill__name__iexact=tag) |
                Q(title__icontains=tag) |
                Q(role__role_name__icontains=tag)
            ).distinct()
            interviews_qs = interviews_qs.filter(
                Q(company__name__icontains=tag) |
                Q(role__role_name__icontains=tag)
            ).distinct()
            anns_qs = anns_qs.none()

        return self.get_feed_response(request, posts_qs, opps_qs, anns_qs, interviews_qs, sort=sort)

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

        posts_qs = Post.objects.exclude(title__startswith='[').filter(
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

        # Job roles for target role selection / autocomplete
        options['common_roles'] = [
            'Software Development Engineer (SDE)',
            'Frontend Developer',
            'Backend Developer',
            'Full Stack Developer',
            'Data Scientist',
            'Machine Learning Engineer',
            'DevOps Engineer',
            'Cloud Architect',
            'Product Manager',
            'UI/UX Designer',
            'Security Analyst / Cybersecurity',
            'Quality Assurance (QA) / SDET',
            'Data Analyst / Business Analyst',
            'Mobile Application Developer',
            'Systems Engineer',
        ]
        options['company_roles'] = list(CompanyRole.objects.values('id', 'company_id', 'role_name', 'role_category'))
        
        return Response(options)

class CommunityMediaUploadView(APIView):
    """
    Dedicated media uploader for community posts.
    Stores files in media/posts/ with UUID-based unique filenames.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response({"error": "No file provided for upload."}, status=status.HTTP_400_BAD_REQUEST)

        # 10MB file limit
        if uploaded_file.size > 10 * 1024 * 1024:
            return Response({"error": "File size exceeds 10MB limit."}, status=status.HTTP_400_BAD_REQUEST)

        base_name, ext = os.path.splitext(uploaded_file.name)
        ext = ext.lower()
        allowed_extensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
        if ext not in allowed_extensions:
            return Response({
                "error": f"Invalid file format '{ext}'. Allowed image formats: JPG, PNG, WEBP, GIF."
            }, status=status.HTTP_400_BAD_REQUEST)

        clean_name = "".join(c for c in base_name if c.isalnum() or c in ('-', '_'))[:35] or "image"
        filename = f"{uuid.uuid4().hex[:8]}_{clean_name}{ext}"
        storage_rel_path = f"posts/{filename}"

        saved_path = default_storage.save(storage_rel_path, ContentFile(uploaded_file.read()))
        file_url = f"/media/{saved_path}"
        if request:
            full_url = request.build_absolute_uri(file_url)
        else:
            full_url = file_url

        return Response({
            "message": "Media uploaded successfully.",
            "url": full_url,
            "file": saved_path,
            "media_type": "IMAGE"
        }, status=status.HTTP_201_CREATED)

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
                try:
                    recipients = User.objects.filter(role__in=['STUDENT', 'ALUMNI'], is_active=True).exclude(id=user.id)
                    notifs = [
                        Notification(
                            recipient=r,
                            actor=user,
                            notification_type="NEW_OPPORTUNITY",
                            title=f"New Opportunity: {opp.title}",
                            message=f"{opp.company_name or 'Placement Cell'} posted a new drive ({opp.opportunity_type})",
                            reference_type="OPPORTUNITY",
                            reference_id=opp.id
                        )
                        for r in recipients
                    ]
                    if notifs:
                        Notification.objects.bulk_create(notifs)
                except Exception:
                    pass
                return Response({"message": "Opportunity created successfully.", "id": opp.id}, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        elif entity_type == 'ANNOUNCEMENT':
            serializer = AnnouncementCreateSerializer(data=request.data)
            if serializer.is_valid():
                ann = serializer.save(created_by=user)
                try:
                    recipients = User.objects.filter(role__in=['STUDENT', 'ALUMNI'], is_active=True).exclude(id=user.id)
                    notifs = [
                        Notification(
                            recipient=r,
                            actor=user,
                            notification_type="NEW_ANNOUNCEMENT",
                            title=f"Official Announcement: {ann.title}",
                            message=(ann.content or ann.title)[:120],
                            reference_type="ANNOUNCEMENT",
                            reference_id=ann.id
                        )
                        for r in recipients
                    ]
                    if notifs:
                        Notification.objects.bulk_create(notifs)
                except Exception:
                    pass
                return Response({"message": "Announcement created successfully.", "id": ann.id}, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        elif entity_type == 'INTERVIEW_EXPERIENCE':
            serializer = InterviewExperienceCreateSerializer(data=request.data)
            if serializer.is_valid():
                ie = serializer.save(author=user)
                try:
                    company_name = ie.company.name if ie.company else "Company"
                    role_name = ie.role.role_name if ie.role else "Process"
                    Post.objects.get_or_create(
                        title=f"[Interview #{ie.id}] {company_name} - {role_name}",
                        defaults={
                            'author': user,
                            'company': ie.company,
                            'post_type': 'INTERVIEW_EXPERIENCE',
                            'content': ie.experience or 'Interview Experience',
                        }
                    )
                except Exception as e:
                    print(f"Error creating post shadow for interview experience: {e}")
                return Response({"message": "Interview Experience created successfully.", "id": ie.id}, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({"error": "Invalid entity_type."}, status=status.HTTP_400_BAD_REQUEST)

class PostDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def patch(self, request, post_id):
        entity_type = (request.query_params.get('type') or request.data.get('entity_type') or 'STANDARD_POST').upper()
        
        if entity_type in ('STANDARD_POST', 'POST'):
            post = get_object_or_404(Post, id=post_id)
            if request.user != post.author:
                return Response({"error": "You do not have permission to edit this post."}, status=status.HTTP_403_FORBIDDEN)
            serializer = UpdatePostSerializer(data=request.data)
            if serializer.is_valid():
                if 'title' in serializer.validated_data: post.title = serializer.validated_data['title']
                if 'content' in serializer.validated_data: post.content = serializer.validated_data['content']
                if 'post_type' in serializer.validated_data: post.post_type = serializer.validated_data['post_type']
                
                if 'new_company_name' in serializer.validated_data and serializer.validated_data['new_company_name']:
                    from apps.companies.models import Company
                    company, _ = Company.objects.get_or_create(name=serializer.validated_data['new_company_name'], defaults={"is_active": False})
                    post.company = company
                elif 'company_id' in serializer.validated_data:
                    post.company_id = serializer.validated_data['company_id']

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
                return Response({"message": "Opportunity successfully updated.", "id": opp.id}, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        elif entity_type == 'ANNOUNCEMENT':
            ann = get_object_or_404(Announcement, id=post_id)
            if request.user != ann.created_by:
                return Response({"error": "You do not have permission to edit this announcement."}, status=status.HTTP_403_FORBIDDEN)
            serializer = AnnouncementCreateSerializer(ann, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({"message": "Announcement successfully updated.", "id": ann.id}, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        elif entity_type == 'INTERVIEW_EXPERIENCE':
            ie = get_object_or_404(InterviewExperience, id=post_id)
            if request.user != ie.author:
                return Response({"error": "You do not have permission to edit this interview experience."}, status=status.HTTP_403_FORBIDDEN)
            serializer = InterviewExperienceCreateSerializer(ie, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({"message": "Interview Experience successfully updated.", "id": ie.id}, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        return Response({"error": "Invalid type."}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, post_id):
        entity_type = (request.query_params.get('type') or request.data.get('entity_type') or 'STANDARD_POST').upper()
        
        if entity_type in ('STANDARD_POST', 'POST'):
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
        entity_type = (request.query_params.get('type') or 'STANDARD_POST').upper()
        
        if entity_type in ('STANDARD_POST', 'POST'):
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
    entity_type = (entity_type or '').upper()

    if entity_type == 'INTERVIEW_EXPERIENCE':
        ie = InterviewExperience.objects.filter(id=post_id).first()
        if ie:
            company_name = ie.company.name if ie.company else "Company"
            role_name = ie.role.role_name if ie.role else "Process"
            title = f"[Interview #{ie.id}] {company_name} - {role_name}"
            post = Post.objects.filter(title=title).first()
            if not post:
                post = Post.objects.filter(title=f"[Interview] {company_name} - {role_name}", author=ie.author).first()
            if not post:
                post = Post.objects.create(
                    author=ie.author,
                    company=ie.company,
                    post_type='INTERVIEW_EXPERIENCE',
                    title=title,
                    content=ie.experience or 'Interview Experience',
                )
            elif post.author != ie.author:
                post.author = ie.author
                post.save(update_fields=['author'])
            return post

    elif entity_type == 'OPPORTUNITY':
        opp = Opportunity.objects.filter(id=post_id).first()
        if opp:
            from apps.accounts.models import User
            author = opp.posted_by or User.objects.filter(role='PLACEMENT_CELL').first() or User.objects.first()
            title = f"[Opportunity #{opp.id}] {opp.title}"
            post = Post.objects.filter(title=title).first() or Post.objects.filter(title=f"[Opportunity] {opp.title}").first()
            if not post:
                post = Post.objects.create(
                    author=author,
                    company=opp.company,
                    post_type='PLACEMENT_EXPERIENCE',
                    title=title,
                    content=opp.description or opp.title,
                )
            return post

    elif entity_type == 'ANNOUNCEMENT':
        ann = Announcement.objects.filter(id=post_id).first()
        if ann:
            from apps.accounts.models import User
            author = ann.created_by or User.objects.filter(role='PLACEMENT_CELL').first() or User.objects.first()
            title = f"[Announcement #{ann.id}] {ann.title}"
            post = Post.objects.filter(title=title).first() or Post.objects.filter(title=f"[Announcement] {ann.title}").first()
            if not post:
                post = Post.objects.create(
                    author=author,
                    post_type='GENERAL',
                    title=title,
                    content=ann.content or ann.title,
                )
            return post

    elif entity_type in ['POST', 'STANDARD_POST']:
        return get_object_or_404(Post, id=post_id)

    # Fallback if entity_type is empty or None
    post_obj = Post.objects.filter(id=post_id).first()
    if post_obj:
        return post_obj

    ie = InterviewExperience.objects.filter(id=post_id).first()
    if ie:
        company_name = ie.company.name if ie.company else "Company"
        role_name = ie.role.role_name if ie.role else "Process"
        title = f"[Interview #{ie.id}] {company_name} - {role_name}"
        post = Post.objects.filter(title=title).first()
        if not post:
            post = Post.objects.create(
                author=ie.author,
                company=ie.company,
                post_type='INTERVIEW_EXPERIENCE',
                title=title,
                content=ie.experience or 'Interview Experience',
            )
        return post

    opp = Opportunity.objects.filter(id=post_id).first()
    if opp:
        from apps.accounts.models import User
        author = opp.posted_by or User.objects.filter(role='PLACEMENT_CELL').first() or User.objects.first()
        title = f"[Opportunity #{opp.id}] {opp.title}"
        post = Post.objects.filter(title=title).first() or Post.objects.filter(title=f"[Opportunity] {opp.title}").first()
        if not post:
            post = Post.objects.create(
                author=author,
                company=opp.company,
                post_type='PLACEMENT_EXPERIENCE',
                title=title,
                content=opp.description or opp.title,
            )
        return post

    ann = Announcement.objects.filter(id=post_id).first()
    if ann:
        from apps.accounts.models import User
        author = ann.created_by or User.objects.filter(role='PLACEMENT_CELL').first() or User.objects.first()
        title = f"[Announcement #{ann.id}] {ann.title}"
        post = Post.objects.filter(title=title).first() or Post.objects.filter(title=f"[Announcement] {ann.title}").first()
        if not post:
            post = Post.objects.create(
                author=author,
                post_type='GENERAL',
                title=title,
                content=ann.content or ann.title,
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
        if post_obj.author and post_obj.author != request.user:
            try:
                actor_name = f"{request.user.first_name} {request.user.last_name}".strip() or request.user.email.split('@')[0]
                post_title = post_obj.title or "Post"
                if post_title.startswith('[Interview'):
                    entity_label = "interview experience"
                elif post_title.startswith('[Opportunity'):
                    entity_label = "opportunity"
                elif post_title.startswith('[Announcement'):
                    entity_label = "announcement"
                else:
                    entity_label = "post"

                Notification.objects.create(
                    recipient=post_obj.author,
                    actor=request.user,
                    notification_type="POST_COMMENT",
                    title=f"{actor_name} commented on your {entity_label}",
                    message=f'"{comment.content[:100]}"',
                    reference_type="POST",
                    reference_id=post_obj.id,
                )
            except Exception as e:
                print(f"Failed to create comment notification: {e}")
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
            if post_obj.author and post_obj.author != user:
                try:
                    actor_name = f"{user.first_name} {user.last_name}".strip() or user.email.split('@')[0]
                    post_title = post_obj.title or "Post"
                    if post_title.startswith('[Interview'):
                        entity_label = "interview experience"
                        clean_title = post_title.split('] ', 1)[-1] if '] ' in post_title else post_title
                    elif post_title.startswith('[Opportunity'):
                        entity_label = "opportunity"
                        clean_title = post_title.split('] ', 1)[-1] if '] ' in post_title else post_title
                    elif post_title.startswith('[Announcement'):
                        entity_label = "announcement"
                        clean_title = post_title.split('] ', 1)[-1] if '] ' in post_title else post_title
                    else:
                        entity_label = "post"
                        clean_title = post_title

                    Notification.objects.create(
                        recipient=post_obj.author,
                        actor=user,
                        notification_type="POST_LIKE",
                        title=f"{actor_name} liked your {entity_label}",
                        message=f'"{clean_title[:80]}"',
                        reference_type="POST",
                        reference_id=post_obj.id,
                    )
                except Exception as e:
                    print(f"Failed to create like notification: {e}")
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
            if post_obj.author and post_obj.author != user:
                try:
                    actor_name = f"{user.first_name} {user.last_name}".strip() or user.email.split('@')[0]
                    post_title = post_obj.title or "Post"
                    if post_title.startswith('[Interview'):
                        entity_label = "interview experience"
                        clean_title = post_title.split('] ', 1)[-1] if '] ' in post_title else post_title
                    elif post_title.startswith('[Opportunity'):
                        entity_label = "opportunity"
                        clean_title = post_title.split('] ', 1)[-1] if '] ' in post_title else post_title
                    elif post_title.startswith('[Announcement'):
                        entity_label = "announcement"
                        clean_title = post_title.split('] ', 1)[-1] if '] ' in post_title else post_title
                    else:
                        entity_label = "post"
                        clean_title = post_title

                    Notification.objects.create(
                        recipient=post_obj.author,
                        actor=user,
                        notification_type="POST_SAVE",
                        title=f"{actor_name} saved your {entity_label}",
                        message=f'"{clean_title[:80]}"',
                        reference_type="POST",
                        reference_id=post_obj.id,
                    )
                except Exception as e:
                    print(f"Failed to create save notification: {e}")
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

class CommunityUserStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # 1. Real count of posts created by the user
        posts_count = Post.objects.filter(author=user).count()
        if user.role == 'ALUMNI':
            posts_count += InterviewExperience.objects.filter(author=user).count()
        elif user.role == 'PLACEMENT_CELL':
            posts_count += Opportunity.objects.filter(posted_by=user).count()
            posts_count += Announcement.objects.filter(created_by=user).count()

        # 2. Real count of posts saved/bookmarked by the user
        saved_count = SavedPost.objects.filter(user=user).count()

        # 3. Real engagement: Total likes given by user across community
        total_likes = PostLike.objects.filter(user=user).count()

        # 4. Real engagement: Total comments written by user across community
        total_comments = Comment.objects.filter(author=user).count()

        return Response({
            "your_posts_count": posts_count,
            "saved_posts_count": saved_count,
            "total_likes": total_likes,
            "total_comments": total_comments,
        }, status=status.HTTP_200_OK)

class CommunityWidgetsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # 1. Real database analytics: Top 10 trending tags by post count
        top_tags = (
            Tag.objects.filter(is_active=True)
            .annotate(post_count=Count('post_tags'))
            .filter(post_count__gt=0)
            .order_by('-post_count')[:10]
        )
        trending_data = [
            {
                "id": t.id,
                "tag": f"#{t.name}" if not t.name.startswith('#') else t.name,
                "raw_name": t.name,
                "count": t.post_count,
                "label": t.description or t.name,
            }
            for t in top_tags
        ]

        # 2. Real database data: Top active hiring opportunities
        active_opps = (
            Opportunity.objects.filter(status='OPEN')
            .select_related('company', 'role')
            .order_by('-created_at')[:5]
        )
        drives_data = [
            {
                "id": opp.id,
                "company_name": opp.company.name if opp.company else "Campus Drive",
                "role": opp.role.title if opp.role else opp.title,
                "opportunity_type": opp.opportunity_type,
                "salary_package": opp.salary_package or "",
                "deadline": opp.deadline.isoformat() if opp.deadline else None,
                "location": opp.location or "On-Campus",
            }
            for opp in active_opps
        ]

        return Response({
            "trending_topics": trending_data,
            "active_drives": drives_data,
        }, status=status.HTTP_200_OK)


