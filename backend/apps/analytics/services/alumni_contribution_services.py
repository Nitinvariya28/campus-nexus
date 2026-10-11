from django.db.models import Count, Q, F
from django.utils import timezone
from apps.community.models import Post, Comment
from apps.interviews.models import InterviewExperience
from apps.resources.models import Resource
from apps.opportunities.models import Opportunity, OpportunitySkill
from apps.accounts.models import User
from apps.profiles.models import AlumniProfile
from datetime import datetime

def get_alumni_contribution_analytics(filters):
    date_from = filters.get('date_from')
    date_to = filters.get('date_to')
    company_id = filters.get('company_id')
    skill_id = filters.get('skill_id')
    author_id = filters.get('author_id')
    opportunity_id = filters.get('opportunity_id')

    # Date filters apply to the creation date of the entities
    q_post = Q(author__role='ALUMNI')
    q_comment = Q(author__role='ALUMNI')
    q_interview = Q(author__role='ALUMNI')
    q_resource = Q(uploaded_by__role='ALUMNI')
    q_opp = Q(posted_by__role='ALUMNI')

    if date_from and date_from != 'None':
        dt_from = datetime.fromisoformat(date_from)
        q_post &= Q(created_at__gte=dt_from)
        q_comment &= Q(created_at__gte=dt_from)
        q_interview &= Q(created_at__gte=dt_from)
        q_resource &= Q(created_at__gte=dt_from)
        q_opp &= Q(created_at__gte=dt_from)

    if date_to and date_to != 'None':
        dt_to = datetime.fromisoformat(date_to)
        q_post &= Q(created_at__lte=dt_to)
        q_comment &= Q(created_at__lte=dt_to)
        q_interview &= Q(created_at__lte=dt_to)
        q_resource &= Q(created_at__lte=dt_to)
        q_opp &= Q(created_at__lte=dt_to)

    if author_id and author_id != 'None':
        q_post &= Q(author_id=author_id)
        q_comment &= Q(author_id=author_id)
        q_interview &= Q(author_id=author_id)
        q_resource &= Q(uploaded_by_id=author_id)
        q_opp &= Q(posted_by_id=author_id)

    if company_id and company_id != 'None':
        q_opp &= Q(company_id=company_id)
        q_interview &= Q(company_id=company_id)

    if opportunity_id and opportunity_id != 'None':
        q_opp &= Q(id=opportunity_id)

    # 1. Top Contributors (B-37, A-79)
    # Get all distinct alumni users who have contributed
    alumni_users = set(Post.objects.filter(q_post).values_list('author_id', flat=True))
    alumni_users.update(Comment.objects.filter(q_comment).values_list('author_id', flat=True))
    alumni_users.update(InterviewExperience.objects.filter(q_interview).values_list('author_id', flat=True))
    alumni_users.update(Resource.objects.filter(q_resource).values_list('uploaded_by_id', flat=True))
    alumni_users.update(Opportunity.objects.filter(q_opp).values_list('posted_by_id', flat=True))

    contributors_data = {}
    for user_id in alumni_users:
        if user_id is None: continue
        contributors_data[user_id] = {
            "total_posts": 0, "total_comments": 0,
            "total_interview_experiences": 0, "total_resources_uploaded": 0,
            "total_opportunities_posted": 0
        }

    for p in Post.objects.filter(q_post).values('author_id').annotate(c=Count('id')):
        if p['author_id'] in contributors_data: contributors_data[p['author_id']]['total_posts'] = p['c']
    for c in Comment.objects.filter(q_comment).values('author_id').annotate(c=Count('id')):
        if c['author_id'] in contributors_data: contributors_data[c['author_id']]['total_comments'] = p['c'] if 'p' in locals() else c['c'] # wait, c['c']
        # Fixed:
        if c['author_id'] in contributors_data: contributors_data[c['author_id']]['total_comments'] = c['c']
    for i in InterviewExperience.objects.filter(q_interview).values('author_id').annotate(c=Count('id')):
        if i['author_id'] in contributors_data: contributors_data[i['author_id']]['total_interview_experiences'] = i['c']
    for r in Resource.objects.filter(q_resource).values('uploaded_by_id').annotate(c=Count('id')):
        if r['uploaded_by_id'] in contributors_data: contributors_data[r['uploaded_by_id']]['total_resources_uploaded'] = r['c']
    for o in Opportunity.objects.filter(q_opp).values('posted_by_id').annotate(c=Count('id')):
        if o['posted_by_id'] in contributors_data: contributors_data[o['posted_by_id']]['total_opportunities_posted'] = o['c']

    # Fetch emails
    user_emails = {u['id']: u['email'] for u in User.objects.filter(id__in=contributors_data.keys()).values('id', 'email')}

    leaders = []
    for uid, stats in contributors_data.items():
        score = sum(stats.values())
        if score > 0:
            leaders.append({
                "alumni_user_id": uid,
                "alumni_email": user_emails.get(uid, "Unknown"),
                **stats,
                "total_contribution_score": score
            })
    leaders.sort(key=lambda x: x['total_contribution_score'], reverse=True)
    leaders = leaders[:20]

    # 2. Post Engagement (B-38)
    engagement_data = []
    posts_qs = Post.objects.filter(q_post)
    if posts_qs.exists():
        engagement = posts_qs.values('author_id').annotate(
            total_likes=Count('likes', distinct=True),
            total_comments=Count('comments', distinct=True),
            total_saves=Count('saved_by_users', distinct=True)
        ).order_by('-total_likes')[:20]
        for e in engagement:
            engagement_data.append({
                "alumni_user_id": e['author_id'],
                "total_likes_received": e['total_likes'],
                "total_comments_received": e['total_comments'],
                "total_saves_by_others": e['total_saves']
            })

    # 3. Alumni at Hiring Companies (B-39)
    # Get companies with OPEN opportunities
    q_opp_open = Q(status='OPEN')
    if company_id and company_id != 'None':
        q_opp_open &= Q(company_id=company_id)
    open_companies = Opportunity.objects.filter(q_opp_open).values('company_id', 'company__name').annotate(open_opps=Count('id'))
    
    alumni_hiring_bridge = []
    for c in open_companies:
        alumni_count = AlumniProfile.objects.filter(current_company_id=c['company_id'], user__role='ALUMNI').count()
        alumni_hiring_bridge.append({
            "company__name": c['company__name'],
            "open_opportunities_count": c['open_opps'],
            "alumni_working_there": alumni_count
        })
    alumni_hiring_bridge.sort(key=lambda x: x['alumni_working_there'], reverse=True)

    # 4. Skills in Alumni Opportunities (B-40)
    q_opp_skill = Q(opportunity__posted_by__role='ALUMNI')
    if company_id and company_id != 'None':
        q_opp_skill &= Q(opportunity__company_id=company_id)
    if skill_id and skill_id != 'None':
        q_opp_skill &= Q(skill_id=skill_id)
    
    skills_data = OpportunitySkill.objects.filter(q_opp_skill).values('skill__name').annotate(
        required_count=Count('id', filter=Q(importance='REQUIRED')),
        preferred_count=Count('id', filter=Q(importance='PREFERRED'))
    ).order_by('-required_count')[:15]
    
    skills_in_alumni_opportunities = list(skills_data)

    return {
        "top_contributors": {
            "overall_activity_leaders": leaders
        },
        "post_engagement": {
            "by_author": engagement_data
        },
        "alumni_hiring_bridge": {
            "alumni_at_hiring_companies": alumni_hiring_bridge,
            "skills_in_alumni_opportunities": skills_in_alumni_opportunities
        }
    }
