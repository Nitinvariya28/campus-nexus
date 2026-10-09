import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.opportunities.models import Opportunity
from apps.announcements.models import Announcement
from apps.interviews.models import InterviewExperience
from apps.community.models import Post
from apps.companies.models import Company

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def student_user(db):
    user = User.objects.create(email="student@nirmauni.ac.in", role="STUDENT")
    user.set_password("password")
    user.save()
    return user

@pytest.fixture
def alumni_user(db):
    user = User.objects.create(email="alumni@nirmauni.ac.in", role="ALUMNI")
    user.set_password("password")
    user.save()
    return user

@pytest.fixture
def placement_user(db):
    user = User.objects.create(email="placement@nirmauni.ac.in", role="PLACEMENT_CELL")
    user.set_password("password")
    user.save()
    return user

@pytest.fixture
def company(db):
    return Company.objects.create(name="Google", is_active=True)

@pytest.mark.django_db
class TestPolymorphicAPI:
    
    # ---------------- STUDENT TESTS ----------------
    def test_student_create_standard_post(self, api_client, student_user):
        api_client.force_authenticate(user=student_user)
        res = api_client.post('/api/community/posts/', {
            "entity_type": "STANDARD_POST",
            "title": "My first project",
            "content": "Content here",
            "post_type": "GENERAL"
        }, format='json')
        assert res.status_code == 201
        assert Post.objects.count() == 1

    def test_student_create_opportunity_fails(self, api_client, student_user):
        api_client.force_authenticate(user=student_user)
        res = api_client.post('/api/community/posts/', {
            "entity_type": "OPPORTUNITY",
            "title": "Hacking the system",
            "description": "Content here"
        }, format='json')
        assert res.status_code == 403

    def test_student_edit_post(self, api_client, student_user):
        api_client.force_authenticate(user=student_user)
        post = Post.objects.create(author=student_user, title="Old Title", post_type="GENERAL")
        res = api_client.patch(f'/api/community/posts/{post.id}/?type=STANDARD_POST', {
            "title": "New Title"
        }, format='json')
        assert res.status_code == 200
        post.refresh_from_db()
        assert post.title == "New Title"

    def test_student_delete_post(self, api_client, student_user):
        api_client.force_authenticate(user=student_user)
        post = Post.objects.create(author=student_user, title="Delete Me", post_type="GENERAL")
        res = api_client.delete(f'/api/community/posts/{post.id}/?type=STANDARD_POST')
        assert res.status_code == 200
        assert Post.objects.count() == 0

    # ---------------- ALUMNI TESTS ----------------
    def test_alumni_create_interview_experience(self, api_client, alumni_user, company):
        api_client.force_authenticate(user=alumni_user)
        res = api_client.post('/api/community/posts/', {
            "entity_type": "INTERVIEW_EXPERIENCE",
            "company_id": company.id,
            "experience_type": "PLACEMENT",
            "result": "SELECTED",
            "experience": "It was great",
            "difficulty": "EASY"
        }, format='json')
        assert res.status_code == 201
        assert InterviewExperience.objects.count() == 1

    def test_alumni_create_announcement_fails(self, api_client, alumni_user):
        api_client.force_authenticate(user=alumni_user)
        res = api_client.post('/api/community/posts/', {
            "entity_type": "ANNOUNCEMENT",
            "title": "Fake Announcement",
            "content": "Not allowed"
        }, format='json')
        assert res.status_code == 403

    def test_alumni_edit_interview(self, api_client, alumni_user, company):
        api_client.force_authenticate(user=alumni_user)
        ie = InterviewExperience.objects.create(
            author=alumni_user, company=company, experience_type="PLACEMENT", result="SELECTED", experience="Old"
        )
        res = api_client.patch(f'/api/community/posts/{ie.id}/?type=INTERVIEW_EXPERIENCE', {
            "experience": "New Experience"
        }, format='json')
        assert res.status_code == 200
        ie.refresh_from_db()
        assert ie.experience == "New Experience"

    def test_alumni_delete_interview(self, api_client, alumni_user, company):
        api_client.force_authenticate(user=alumni_user)
        ie = InterviewExperience.objects.create(
            author=alumni_user, company=company, experience_type="PLACEMENT", result="SELECTED", experience="Old"
        )
        res = api_client.delete(f'/api/community/posts/{ie.id}/?type=INTERVIEW_EXPERIENCE')
        assert res.status_code == 200
        assert InterviewExperience.objects.count() == 0

    # ---------------- PLACEMENT CELL TESTS ----------------
    def test_placement_create_opportunity(self, api_client, placement_user, company):
        api_client.force_authenticate(user=placement_user)
        res = api_client.post('/api/community/posts/', {
            "entity_type": "OPPORTUNITY",
            "company_id": company.id,
            "opportunity_type": "PLACEMENT",
            "title": "SDE 1",
            "description": "Google SDE",
            "work_mode": "ON_SITE",
            "status": "OPEN"
        }, format='json')
        assert res.status_code == 201
        assert Opportunity.objects.count() == 1

    def test_placement_create_standard_post_fails(self, api_client, placement_user):
        api_client.force_authenticate(user=placement_user)
        res = api_client.post('/api/community/posts/', {
            "entity_type": "STANDARD_POST",
            "title": "Hey guys",
            "content": "Not allowed"
        }, format='json')
        assert res.status_code == 403

    def test_placement_edit_announcement(self, api_client, placement_user):
        api_client.force_authenticate(user=placement_user)
        ann = Announcement.objects.create(
            created_by=placement_user, title="Old Ann", content="...", announcement_type="GENERAL", target_audience="ALL"
        )
        res = api_client.patch(f'/api/community/posts/{ann.id}/?type=ANNOUNCEMENT', {
            "title": "New Ann"
        }, format='json')
        assert res.status_code == 200
        ann.refresh_from_db()
        assert ann.title == "New Ann"

    def test_placement_delete_opportunity(self, api_client, placement_user, company):
        api_client.force_authenticate(user=placement_user)
        opp = Opportunity.objects.create(
            posted_by=placement_user, company=company, opportunity_type="PLACEMENT", title="Job", description="...", work_mode="ON_SITE"
        )
        res = api_client.delete(f'/api/community/posts/{opp.id}/?type=OPPORTUNITY')
        assert res.status_code == 200
        assert Opportunity.objects.count() == 0

