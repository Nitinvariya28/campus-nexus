import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.profiles.models import StudentProfile, AlumniProfile, StudentPlacementRecord
from apps.skills.models import Skill, SkillCategory, UserSkill
from apps.companies.models import Company
from apps.university.models import Department, Batch

@pytest.mark.django_db
class TestAPI11SkillDistributionAnalytics:
    def test_skill_distribution_success(self):
        cat = SkillCategory.objects.create(name="Languages", category_type="TECH")
        s_python = Skill.objects.create(name="Python", category=cat)
        s_java = Skill.objects.create(name="Java", category=cat)
        
        dept = Department.objects.create(name="CS")
        batch = Batch.objects.create(start_year=2024, end_year=2028)
        
        c = Company.objects.create(name="Google")
        
        # Student 1 (Placed)
        u1 = User.objects.create_user(email="s1@test.com", password="pwd", role="STUDENT")
        sp1 = StudentProfile.objects.create(user=u1, department=dept, batch=batch)
        StudentPlacementRecord.objects.create(student=sp1, company=c, placement_year=2024, offer_type="FTE")
        UserSkill.objects.create(user=u1, skill=s_python, proficiency="ADVANCED")
        
        # Student 2 (Unplaced)
        u2 = User.objects.create_user(email="s2@test.com", password="pwd", role="STUDENT")
        StudentProfile.objects.create(user=u2, department=dept, batch=batch)
        UserSkill.objects.create(user=u2, skill=s_python, proficiency="INTERMEDIATE")
        UserSkill.objects.create(user=u2, skill=s_java, proficiency="BEGINNER")
        
        # Alumni
        u3 = User.objects.create_user(email="a1@test.com", password="pwd", role="ALUMNI")
        AlumniProfile.objects.create(user=u3, current_company=c, job_category="Data", years_of_experience=3, department=dept, batch=batch)
        UserSkill.objects.create(user=u3, skill=s_python, proficiency="ADVANCED")
        
        client = APIClient()
        client.force_authenticate(user=u1)
        
        response = client.get('/api/analytics/skills/distribution/')
        assert response.status_code == 200
        
        data = response.data['data']
        
        assert data['inventory_summary']['total_unique_skills_listed'] == 2
        assert data['inventory_summary']['average_skills_per_user_by_role']['STUDENT'] == 1.5
        
        assert data['top_skills'][0]['skill__name'] == "Python"
        assert data['top_skills'][0]['distinct_users'] == 3
        
        # Student Placement Correlation
        corr = data['student_associations']['placement_correlation']
        python_corr = next(x for x in corr if x['skill__name'] == 'Python')
        assert python_corr['users_with_skill'] == 2
        assert python_corr['placed_users'] == 1
        assert python_corr['placement_rate_pct'] == 50.0
        
        # Advanced Impact
        adv = data['student_associations']['advanced_skill_impact']
        assert adv['avg_placed_user_advanced_skills'] == 1.0 # u1 has 1 advanced
        assert adv['avg_unplaced_user_advanced_skills'] == 0.0 # u2 has 0 advanced
        
        # Alumni Associations
        al_comp = data['alumni_associations']['skills_by_company'][0]
        assert al_comp['company__name'] == "Google"
        assert al_comp['top_skills'][0]['skill__name'] == "Python"
        
        al_exp = data['alumni_associations']['proficiency_by_experience_band']
        mid_band = next(x for x in al_exp if x['experience_band'] == '2-5 Years')
        assert mid_band['proficiencies'][0]['proficiency'] == 'ADVANCED'
        assert mid_band['proficiencies'][0]['count'] == 1
