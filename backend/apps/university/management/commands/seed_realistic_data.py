import random
from datetime import timedelta
from faker import Faker
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model

# Import models
from apps.university.models import Department, Batch, UniversityIdentity
from apps.profiles.models import StudentProfile, AlumniProfile
from apps.companies.models import Company, CompanyRole
from apps.skills.models import SkillCategory, Skill, UserSkill, SocialLink, UserAIUsage
from apps.community.models import Post, Comment, PostLike, Tag, PostTag
from apps.interviews.models import InterviewExperience, InterviewRound
from apps.opportunities.models import Opportunity, OpportunitySkill
from apps.resources.models import ResourceCategory, Resource
from apps.announcements.models import Announcement

User = get_user_model()
fake = Faker('en_IN')

def optional(val, chance=0.2):
    return None if random.random() < chance else val

class Command(BaseCommand):
    help = 'Seeds the database with realistic data.'

    def handle(self, *args, **kwargs):
        self.stdout.write("Starting database seeding...")
        
        # 1. DEPARTMENTS
        self.stdout.write("Seeding Departments...")
        programs = [
            ("B.Tech Computer Engineering", "BCE"),
            ("B.Tech Electronics & Communication", "BEC"),
            ("B.Tech Mechanical Engineering", "BME"),
            ("B.Tech Mathematics & Computing", "BAM"),
            ("B.Tech Chemical Engineering", "BCH"),
            ("B.Tech Electrical Engineering", "BEE"),
            ("B.Tech Civil Engineering", "BCV"),
        ]
        depts = []
        for name, code in programs:
            dept, _ = Department.objects.get_or_create(name=name, code=code)
            depts.append(dept)

        # 2. BATCHES
        self.stdout.write("Seeding Batches...")
        batches = []
        for start_year in range(2015, 2025):
            b, _ = Batch.objects.get_or_create(start_year=start_year, end_year=start_year+4)
            batches.append(b)
            
        alumni_batches = [b for b in batches if b.start_year <= 2020]
        student_batches = [b for b in batches if b.start_year > 2020]

        # 3. ADMIN & PLACEMENT CELL
        self.stdout.write("Seeding Admin & Placement Cell...")
        admin, _ = User.objects.get_or_create(email="admin@nirmauni.ac.in", defaults={
            'role': 'ADMIN', 'is_staff': True, 'is_superuser': True, 'is_verified': True,
            'first_name': 'System', 'last_name': 'Admin'
        })
        admin.set_password('admin123')
        admin.save()
        
        placement, _ = User.objects.get_or_create(email="placement@nirmauni.ac.in", defaults={
            'role': 'PLACEMENT_CELL', 'is_staff': True, 'is_verified': True,
            'first_name': 'Placement', 'last_name': 'Cell'
        })
        placement.set_password('placement123')
        placement.save()
        
        all_users = []

        # 4. STUDENTS & ALUMNI
        self.stdout.write("Seeding Students and Alumni (~1000 users)...")
        roles_to_create = [('ALUMNI', 300, alumni_batches), ('STUDENT', 700, student_batches)]
        
        for role, count, role_batches in roles_to_create:
            for i in range(count):
                b = random.choice(role_batches)
                dept = random.choice(depts)
                prog_code = dept.code.lower()
                roll = random.randint(1, 250)
                year = b.start_year % 100
                
                if role == 'STUDENT':
                    email = f"{year}{prog_code}{roll:03d}@nirmauni.ac.in"
                else:
                    email = f"{fake.user_name()}{year}{random.randint(10,99)}@gmail.com"
                
                try:
                    user, created = User.objects.get_or_create(
                        email=email,
                        defaults={
                            'role': role,
                            'first_name': fake.first_name(),
                            'last_name': optional(fake.last_name()),
                            'is_verified': True,
                        }
                    )
                    if created:
                        user.set_password('password123')
                        user.save()
                    all_users.append(user)
                    
                    # Profiles
                    if role == 'STUDENT' and not hasattr(user, 'student_profile'):
                        StudentProfile.objects.create(
                            user=user,
                            department=dept,
                            batch=b,
                            semester=random.randint(1, 8),
                            bio=optional(fake.text(max_nb_chars=100)),
                            phone=optional(f"+91{fake.msisdn()[2:]}"),
                            address=optional(fake.address())
                        )
                    elif role == 'ALUMNI' and not hasattr(user, 'alumni_profile'):
                        AlumniProfile.objects.create(
                            user=user,
                            department=dept,
                            batch=b,
                            current_job_title=optional(fake.job()),
                            bio=optional(fake.text(max_nb_chars=150)),
                            phone=optional(f"+91{fake.msisdn()[2:]}"),
                            location=optional(fake.city())
                        )
                except Exception as e:
                    print(f"Error creating user {email}: {e}")

        self.stdout.write(f"Users registered: {len(all_users)}")

        # 5. COMPANIES & ROLES
        self.stdout.write("Seeding Companies...")
        companies_list = ["Google", "Microsoft", "Amazon", "TCS", "Infosys", "Wipro", "Flipkart", "Zomato", "Swiggy", "Postman", "Zerodha"]
        db_companies = []
        db_roles = []
        for c_name in companies_list:
            c, _ = Company.objects.get_or_create(
                name=c_name,
                defaults={
                    'website': optional(f"https://www.{c_name.lower()}.com"),
                    'industry': random.choice(["Technology", "E-Commerce", "FinTech", "Consulting"]),
                    'company_size': random.choice(["STARTUP", "SMALL", "MEDIUM", "LARGE", "ENTERPRISE"]),
                    'description': optional(fake.text()),
                    'headquarters': optional(fake.city())
                }
            )
            db_companies.append(c)
            
            for r_name, r_cat in [("Software Engineer", "SOFTWARE"), ("Data Scientist", "DATA"), ("DevOps Engineer", "DEVOPS_CLOUD")]:
                role, _ = CompanyRole.objects.get_or_create(company=c, role_name=r_name, role_category=r_cat)
                db_roles.append(role)
                
        # Update alumni companies
        alumni = User.objects.filter(role='ALUMNI')
        for alum in alumni:
            if hasattr(alum, 'alumni_profile') and random.random() < 0.7:
                prof = alum.alumni_profile
                prof.current_company = random.choice(db_companies)
                prof.save()

        # 6. SKILLS
        self.stdout.write("Seeding Skills...")
        categories = {
            "Programming": ["Python", "Java", "C++", "JavaScript", "Go"],
            "Web": ["React", "Django", "Node.js", "Vue", "Spring"],
            "Data & AI": ["Machine Learning", "Data Analysis", "TensorFlow", "SQL"],
        }
        db_skills = []
        for cat_name, skills in categories.items():
            cat, _ = SkillCategory.objects.get_or_create(name=cat_name)
            for s_name in skills:
                skill, _ = Skill.objects.get_or_create(category=cat, name=s_name)
                db_skills.append(skill)
                
        for user in all_users:
            user_skills = random.sample(db_skills, random.randint(1, 4))
            for s in user_skills:
                try:
                    UserSkill.objects.get_or_create(user=user, skill=s, defaults={'proficiency': random.choice(["BEGINNER", "INTERMEDIATE", "ADVANCED"])})
                except:
                    pass

        # 7. COMMUNITY (Posts, Tags)
        self.stdout.write("Seeding Community Posts & Comments...")
        db_tags = []
        for t in ["DSA", "System Design", "Internship", "Placement", "Resume", "Off-Campus"]:
            tag, _ = Tag.objects.get_or_create(name=t)
            db_tags.append(tag)
            
        post_types = ["PLACEMENT_EXPERIENCE", "INTERVIEW_EXPERIENCE", "INTERNSHIP", "CAREER_ADVICE", "GENERAL"]
        
        db_posts = []
        for _ in range(300):
            author = random.choice(all_users)
            post = Post.objects.create(
                author=author,
                company=optional(random.choice(db_companies), 0.5),
                post_type=random.choice(post_types),
                title=fake.sentence(nb_words=6),
                content=fake.paragraph(nb_sentences=5)
            )
            db_posts.append(post)
            # Tags
            for tag in random.sample(db_tags, random.randint(1, 3)):
                PostTag.objects.create(post=post, tag=tag)
            # Comments
            for _ in range(random.randint(0, 5)):
                Comment.objects.create(post=post, author=random.choice(all_users), content=fake.sentence())
            # Likes
            for _ in range(random.randint(0, 10)):
                try:
                    PostLike.objects.create(post=post, user=random.choice(all_users))
                except:
                    pass

        # 8. INTERVIEWS
        self.stdout.write("Seeding Interview Experiences...")
        for _ in range(200):
            author = random.choice(all_users)
            comp = random.choice(db_companies)
            role = random.choice([r for r in db_roles if r.company == comp] or [None])
            
            exp = InterviewExperience.objects.create(
                author=author,
                company=comp,
                role=role,
                experience_type=random.choice(["PLACEMENT", "INTERNSHIP"]),
                result=random.choice(["SELECTED", "NOT_SELECTED", "IN_PROGRESS"]),
                difficulty=optional(random.choice(["EASY", "MEDIUM", "HARD", "VERY_HARD"])),
                experience=fake.paragraph(nb_sentences=6),
                preparation=optional(fake.paragraph())
            )
            
            for i in range(1, random.randint(2, 5)):
                InterviewRound.objects.create(
                    interview_experience=exp,
                    round_number=i,
                    round_type=random.choice(["ONLINE_ASSESSMENT", "TECHNICAL", "HR", "CODING"]),
                    mode=optional(random.choice(["ONLINE", "OFFLINE"])),
                    duration_minutes=optional(random.choice([30, 45, 60, 90])),
                    topics=optional(fake.sentence()),
                    description=optional(fake.text())
                )

        # 9. OPPORTUNITIES
        self.stdout.write("Seeding Opportunities...")
        for _ in range(100):
            comp = random.choice(db_companies)
            role = random.choice([r for r in db_roles if r.company == comp] or [None])
            opp = Opportunity.objects.create(
                company=comp,
                role=role,
                posted_by=placement,
                opportunity_type=random.choice(["INTERNSHIP", "PLACEMENT"]),
                title=f"{comp.name} Hiring",
                description=fake.paragraph(nb_sentences=4),
                location=optional(fake.city()),
                work_mode=random.choice(["ON_SITE", "REMOTE", "HYBRID"]),
                employment_type=random.choice(["FULL_TIME", "INTERNSHIP"]),
                application_url=optional(fake.url()),
                deadline=optional(timezone.now() + timedelta(days=random.randint(5, 30))),
                status=random.choice(["OPEN", "OPEN", "CLOSED"])
            )
            for skill in random.sample(db_skills, random.randint(1, 3)):
                try:
                    OpportunitySkill.objects.create(opportunity=opp, skill=skill, importance=random.choice(["REQUIRED", "PREFERRED"]))
                except:
                    pass

        self.stdout.write(self.style.SUCCESS('Successfully seeded database!'))
