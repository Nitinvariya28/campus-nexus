from django.db.models import Count, Q
from django.db.models.functions import TruncMonth
from collections import defaultdict
from apps.resources.models import Resource, ResourceCategory
from apps.announcements.models import Announcement
from apps.community.models import Post, Comment, PostLike, SavedPost

def get_resources_announcements_analytics(filters):
    resources_qs = Resource.objects.all()
    announcements_qs = Announcement.objects.all()
    posts_qs = Post.objects.filter(post_type='ANNOUNCEMENT')
    
    # Extract filters
    date_from = filters.get('date_from')
    date_to = filters.get('date_to')
    category_id = filters.get('category_id')
    author_role = filters.get('author_role')
    company_id = filters.get('company_id')
    
    if date_from and date_from != 'None':
        resources_qs = resources_qs.filter(created_at__gte=date_from)
        announcements_qs = announcements_qs.filter(created_at__gte=date_from)
        posts_qs = posts_qs.filter(created_at__gte=date_from)
    if date_to and date_to != 'None':
        resources_qs = resources_qs.filter(created_at__lte=date_to)
        announcements_qs = announcements_qs.filter(created_at__lte=date_to)
        posts_qs = posts_qs.filter(created_at__lte=date_to)
        
    if category_id and category_id != 'None':
        resources_qs = resources_qs.filter(category_id=category_id)
        
    if author_role and author_role != 'None':
        resources_qs = resources_qs.filter(uploaded_by__role=author_role)
        announcements_qs = announcements_qs.filter(created_by__role=author_role)
        posts_qs = posts_qs.filter(author__role=author_role)
        
    if company_id and company_id != 'None':
        posts_qs = posts_qs.filter(company_id=company_id)
        
    # --- A-78: Resources by Category ---
    resources_by_category = list(
        resources_qs.values('category__name')
        .annotate(count=Count('id'))
    )
    
    # --- A-79: Top Resource Contributors ---
    top_resource_contributors = list(
        resources_qs.filter(uploaded_by__isnull=False)
        .values('uploaded_by_id', 'uploaded_by__first_name', 'uploaded_by__last_name')
        .annotate(contributed_count=Count('id'))
        .order_by('-contributed_count')[:5]
    )
    
    # --- A-80: Announcements by month ---
    announcements_by_month = []
    monthly_ann = announcements_qs.annotate(month=TruncMonth('created_at')).values('month').annotate(c=Count('id')).order_by('month')
    for m in monthly_ann:
        if m['month']:
            announcements_by_month.append({
                "month": m['month'].strftime('%Y-%m'),
                "new_announcements": m['c']
            })
            
    # --- A-81 & B-59: Announcement Engagement (using Community Posts) ---
    engagement_metrics = posts_qs.aggregate(
        likes=Count('likes', distinct=True),
        saves=Count('saved_by_users', distinct=True)
    )
    total_comments = Comment.objects.filter(post__in=posts_qs).count()
    
    # B-59: Placement/Drives Announcements (We assume titles or content contain "placement" or "drive", or company is linked)
    drive_posts = posts_qs.filter(Q(title__icontains='placement') | Q(title__icontains='drive') | Q(company__isnull=False))
    drive_engagement = drive_posts.aggregate(
        likes=Count('likes', distinct=True),
        saves=Count('saved_by_users', distinct=True)
    )
    drive_comments = Comment.objects.filter(post__in=drive_posts).count()
    
    announcement_engagement = {
        "total_likes": engagement_metrics['likes'] or 0,
        "total_comments": total_comments,
        "total_saves": engagement_metrics['saves'] or 0,
        "placement_drive_engagement": {
            "likes": drive_engagement['likes'] or 0,
            "comments": drive_comments,
            "saves": drive_engagement['saves'] or 0
        }
    }

    return {
        "resources_by_category": resources_by_category,
        "top_resource_contributors": top_resource_contributors,
        "announcements_by_month": announcements_by_month,
        "announcement_engagement": announcement_engagement
    }
