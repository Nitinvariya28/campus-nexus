import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.community.models import Post, Comment, PostLike
from apps.interviews.models import InterviewExperience
from apps.resources.models import Resource, ResourceCategory
from apps.opportunities.models import Opportunity, OpportunitySkill
from apps.companies.models import Company
from apps.skills.models import Skill, SkillCategory

@pytest.mark.django_db
class TestAPI15AlumniContributionAnalytics:
    def test_alumni_contribution_success(self):
        # 1. Setup User
        u1 = User.objects.create_user(email="a1@test.com", password="pwd", role="ALUMNI")
        u2 = User.objects.create_user(email="s1@test.com", password="pwd", role="STUDENT")
        
        # 2. Setup Companies and Skills
        c = Company.objects.create(name="Google")
        sc = SkillCategory.objects.create(name="Language")
        s = Skill.objects.create(name="Python", category=sc)
        
        # 3. Setup Posts, Comments, Likes
        p1 = Post.objects.create(author=u1, title="Alumni Post", content="Hello", post_type="TEXT")
        Comment.objects.create(author=u1, post=p1, content="My comment")
        PostLike.objects.create(user=u2, post=p1) # Student likes Alumni post
        
        # 4. Setup Interview Experience
        InterviewExperience.objects.create(author=u1, company=c, experience_type="PLACEMENT", result="SELECTED", experience="Good")
        
        # 5. Setup Resource
        rc = ResourceCategory.objects.create(name="Notes")
        Resource.objects.create(category=rc, title="My Notes", uploaded_by=u1, external_url="https://test.com")
        
        # 6. Setup Opportunity
        o1 = Opportunity.objects.create(
            company=c, posted_by=u1, opportunity_type="PLACEMENT",
            title="SDE", description="Job", work_mode="REMOTE", status="OPEN"
        )
        OpportunitySkill.objects.create(opportunity=o1, skill=s, importance="REQUIRED")
        
        # Act
        client = APIClient()
        client.force_authenticate(user=u1)
        
        response = client.get('/api/analytics/alumni/contributions/')
        assert response.status_code == 200
        
        data = response.data['data']
        
        # Assertions
        # 1. Top Contributors (1 Post + 1 Comment + 1 Interview + 1 Resource + 1 Opp = 5 score)
        assert len(data['top_contributors']['overall_activity_leaders']) == 1
        leader = data['top_contributors']['overall_activity_leaders'][0]
        assert leader['alumni_user_id'] == u1.id
        assert leader['total_contribution_score'] == 5
        assert leader['total_posts'] == 1
        
        # 2. Post Engagement
        assert len(data['post_engagement']['by_author']) == 1
        engagement = data['post_engagement']['by_author'][0]
        assert engagement['total_likes_received'] == 1
        assert engagement['total_comments_received'] == 1
        assert engagement['total_saves_by_others'] == 0
        
        # 3. Alumni Hiring Bridge
        assert len(data['alumni_hiring_bridge']['alumni_at_hiring_companies']) == 1
        bridge = data['alumni_hiring_bridge']['alumni_at_hiring_companies'][0]
        assert bridge['company__name'] == "Google"
        assert bridge['open_opportunities_count'] == 1
        # No alumni profile explicitly created at Google in this test, so 0 working there
        assert bridge['alumni_working_there'] == 0
        
        # 4. Skills in Alumni Opportunities
        assert len(data['alumni_hiring_bridge']['skills_in_alumni_opportunities']) == 1
        skill_req = data['alumni_hiring_bridge']['skills_in_alumni_opportunities'][0]
        assert skill_req['skill__name'] == "Python"
        assert skill_req['required_count'] == 1
