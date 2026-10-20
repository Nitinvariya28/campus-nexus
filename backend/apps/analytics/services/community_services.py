from django.db.models import Count, Q, Avg
from django.db.models.functions import TruncMonth
from collections import defaultdict
from apps.community.models import Post, Comment, PostLike, SavedPost, PostTag, PostMedia
from apps.accounts.models import User
from apps.profiles.models import StudentProfile

def get_community_analytics(filters):
    posts_qs = Post.objects.all()
    comments_qs = Comment.objects.all()
    
    # Extract filters
    date_from = filters.get('date_from')
    date_to = filters.get('date_to')
    post_type = filters.get('post_type')
    author_role = filters.get('author_role')
    department_id = filters.get('department_id')
    batch_id = filters.get('batch_id')
    company_id = filters.get('company_id')
    tag_id = filters.get('tag_id')
    
    # 1. Apply Date Filters (Applies to when posts/comments were created)
    if date_from and date_from != 'None':
        posts_qs = posts_qs.filter(created_at__gte=date_from)
        comments_qs = comments_qs.filter(created_at__gte=date_from)
    if date_to and date_to != 'None':
        posts_qs = posts_qs.filter(created_at__lte=date_to)
        comments_qs = comments_qs.filter(created_at__lte=date_to)
        
    # 2. Apply Post Specific Filters
    if post_type and post_type != 'None':
        posts_qs = posts_qs.filter(post_type=post_type)
    if company_id and company_id != 'None':
        posts_qs = posts_qs.filter(company_id=company_id)
    if tag_id and tag_id != 'None':
        posts_qs = posts_qs.filter(post_tags__tag_id=tag_id)
        
    # 3. Apply Author/Demographic Filters
    if author_role and author_role != 'None':
        posts_qs = posts_qs.filter(author__role=author_role)
        
    if department_id and department_id != 'None' or batch_id and batch_id != 'None':
        author_filters = Q()
        if department_id and department_id != 'None':
            from apps.university.helpers import resolve_department_ids
            dept_ids = resolve_department_ids(department_id)
            if dept_ids:
                author_filters &= (Q(author__student_profile__department_id__in=dept_ids) | Q(author__alumni_profile__department_id__in=dept_ids))
        if batch_id and batch_id != 'None':
            author_filters &= (Q(author__student_profile__batch_id=batch_id) | Q(author__alumni_profile__batch_id=batch_id))
        posts_qs = posts_qs.filter(author_filters).distinct()

    total_posts = posts_qs.count()
    total_comments = comments_qs.filter(post__in=posts_qs).count()

    # --- A-70: Post Type Breakdown ---
    post_type_breakdown = list(posts_qs.values('post_type').annotate(count=Count('id')))

    # --- A-71 & A-73: Monthly Activity ---
    # Merge posts and comments by month
    monthly_activity_dict = defaultdict(lambda: {"new_posts": 0, "new_comments": 0})
    
    monthly_posts = posts_qs.annotate(month=TruncMonth('created_at')).values('month').annotate(c=Count('id'))
    for m in monthly_posts:
        if m['month']:
            monthly_activity_dict[m['month'].strftime('%Y-%m')]["new_posts"] += m['c']
            
    monthly_comments = comments_qs.filter(post__in=posts_qs).annotate(month=TruncMonth('created_at')).values('month').annotate(c=Count('id'))
    for m in monthly_comments:
        if m['month']:
            monthly_activity_dict[m['month'].strftime('%Y-%m')]["new_comments"] += m['c']

    monthly_activity = [
        {"month": k, "new_posts": v["new_posts"], "new_comments": v["new_comments"]}
        for k, v in sorted(monthly_activity_dict.items())
    ]

    # --- A-72: Top Authors ---
    top_authors = list(
        posts_qs.values('author_id', 'author__first_name', 'author__last_name')
        .annotate(post_count=Count('id'))
        .order_by('-post_count')[:5]
    )

    # --- A-73 & A-77: Engagement Metrics ---
    engagement_metrics = {
        "average_comments_per_post": round(total_comments / total_posts, 2) if total_posts > 0 else 0,
        "company_linked_posts": posts_qs.filter(company__isnull=False).count()
    }

    # --- A-74: Top Posts ---
    top_posts = list(
        posts_qs.annotate(
            likes_count=Count('likes', distinct=True), 
            saves_count=Count('saved_by_users', distinct=True)
        ).order_by('-likes_count')[:5].values('id', 'title', 'likes_count', 'saves_count')
    )

    # --- A-75: Top Tags ---
    top_tags = list(
        PostTag.objects.filter(post__in=posts_qs)
        .values('tag__name')
        .annotate(post_count=Count('post_id', distinct=True))
        .order_by('-post_count')[:5]
    )

    # --- A-76: Media Breakdown ---
    media_breakdown = list(
        PostMedia.objects.filter(post__in=posts_qs)
        .values('media_type')
        .annotate(count=Count('id'))
    )

    # --- B-61: Role Engagement ---
    role_dict = defaultdict(lambda: {"posts_created": 0, "comments_made": 0, "likes_given": 0})
    
    posts_by_role = posts_qs.values('author__role').annotate(c=Count('id'))
    for r in posts_by_role:
        role_dict[r['author__role']]["posts_created"] = r['c']
        
    comments_by_role = comments_qs.filter(post__in=posts_qs).values('author__role').annotate(c=Count('id'))
    for r in comments_by_role:
        role_dict[r['author__role']]["comments_made"] = r['c']
        
    likes_by_role = PostLike.objects.filter(post__in=posts_qs).values('user__role').annotate(c=Count('id'))
    for r in likes_by_role:
        role_dict[r['user__role']]["likes_given"] = r['c']

    role_engagement = [
        {"role": k, **v} for k, v in role_dict.items() if k
    ]

    # --- B-23: Placement Correlation ---
    active_authors_qs = User.objects.filter(id__in=posts_qs.values('author_id'))
    active_students_qs = StudentProfile.objects.filter(user__in=active_authors_qs, user__role='STUDENT')
    
    placed_active = active_students_qs.filter(placements__isnull=False).distinct().count()
    unplaced_active = active_students_qs.filter(placements__isnull=True).distinct().count()

    placement_correlation = {
        "placed_students_active": placed_active,
        "unplaced_students_active": unplaced_active
    }

    return {
        "post_type_breakdown": post_type_breakdown,
        "monthly_activity": monthly_activity,
        "top_authors": top_authors,
        "engagement_metrics": engagement_metrics,
        "top_posts": top_posts,
        "top_tags": top_tags,
        "media_breakdown": media_breakdown,
        "role_engagement": role_engagement,
        "placement_correlation": placement_correlation
    }
