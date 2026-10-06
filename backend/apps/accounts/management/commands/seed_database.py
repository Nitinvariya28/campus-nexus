import random
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from faker import Faker

# Core Apps
from apps.accounts.models import User
from apps.university.models import UniversityIdentity, Department, Batch
from apps.profiles.models import StudentProfile, AlumniProfile
from apps.community.models import Post, Comment
from apps.companies.models import Company

class Command(BaseCommand):
    help = "Seeds the database with 2000 users and realistic connected data for analysis"

    def handle(self, *args, **kwargs):
        fake = Faker('en_IN')
        
        self.stdout.write(self.style.WARNING("Clearing database to ensure clean, consistent relationships..."))
        
        with transaction.atomic():
            self.clear_database()
            self.stdout.write(self.style.SUCCESS("Starting database seed. Generating ~2000 users and their related content..."))
            self.seed_database(fake)
            
        self.stdout.write(self.style.SUCCESS("Database perfectly seeded with massive data for analysis!"))

    def clear_database(self):
        # Clear child dependencies first
        from apps.interviews.models import InterviewExperience, InterviewRound
        from apps.opportunities.models import Opportunity
        from apps.resources.models import Resource
        
        InterviewRound.objects.all().delete()
        InterviewExperience.objects.all().delete()
        Opportunity.objects.all().delete()
        Resource.objects.all().delete()
        
        Comment.objects.all().delete()
        Post.objects.all().delete()
        AlumniProfile.objects.all().delete()
        StudentProfile.objects.all().delete()
        User.objects.all().delete()
        UniversityIdentity.objects.all().delete()
        Company.objects.all().delete()
        Batch.objects.all().delete()
        Department.objects.all().delete()

    def seed_database(self, fake):
        # 1. Base Core Settings
        dept_data = [
            ("Computer Engineering", "BCE"),
            ("Electronics & Comm.", "BEC"),
            ("Mechanical Eng.", "BME"),
            ("Electrical Eng.", "BEE"),
            ("Civil Eng.", "BCV")
        ]
        departments = [Department.objects.create(name=n, code=c) for n, c in dept_data]
        
        # Batches (2016-2027)
        batches = [Batch.objects.create(start_year=y, end_year=y+4) for y in range(2016, 2028)]
        
        # 2. Companies
        companies = []
        for _ in range(100):
            companies.append(Company(
                name=fake.company(),
                website=fake.url(),
                industry=random.choice(["IT", "Finance", "Healthcare", "Consulting"]),
                company_size=random.choice(["1-10", "11-50", "51-200", "201-500", "500+"]),
                description=fake.text(),
                headquarters=fake.city(),
                is_active=True
            ))
        Company.objects.bulk_create(companies)
        companies = list(Company.objects.all())

        # 3. University Identities (Alumni Master Data ~ 200 records)
        self.stdout.write("- Generating 200 Alumni Verification Records...")
        identities = []
        for i in range(200):
            year = random.randint(2016, 2020) # Historical
            roll = (i % 250) + 1
            code = random.choice(["BCE", "BEC", "BME", "BEE"])
            email = f"{str(year)[-2:]}{code.lower()}{roll:03d}@nirmauni.ac.in"
            identities.append(UniversityIdentity(
                admission_year=year,
                program_code=code,
                roll_number=roll,
                full_name=fake.name(),
                date_of_birth=fake.date_of_birth(minimum_age=23, maximum_age=30),
                university_email=email
            ))
        
        # Filter duplicates safely
        unique_identities = { (uid.admission_year, uid.program_code, uid.roll_number): uid for uid in identities }.values()
        UniversityIdentity.objects.bulk_create(unique_identities, ignore_conflicts=True)

        # 4. Platform Users (~400 total)
        self.stdout.write("- Generating 200 Students and 200 Alumni Platform Accounts...")
        users = []
        for i in range(200):
            # 1 Student
            student_email = f"{random.randint(22, 25)}bce{random.randint(1,250):03d}_{i}@nirmauni.ac.in"
            user = User(email=student_email, role="STUDENT", first_name=fake.first_name(), last_name=fake.last_name(), is_verified=True, is_active=True)
            user.set_password("nirma123")
            users.append(user)
            
            # 1 Alumni
            alumni_email = f"alumni_{i}_{fake.email()}"
            alumni = User(email=alumni_email, role="ALUMNI", first_name=fake.first_name(), last_name=fake.last_name(), is_verified=True, is_active=True)
            alumni.set_password("nirma123")
            users.append(alumni)
            
        User.objects.bulk_create(users)
        
        # Load them back to link Profiles
        students = list(User.objects.filter(role="STUDENT"))
        alumni_users = list(User.objects.filter(role="ALUMNI"))

        # 5. Profiles
        self.stdout.write("- Generating Rich Profiles for everyone...")
        student_profiles = []
        for s in students:
            student_profiles.append(StudentProfile(
                user=s,
                department=random.choice(departments),
                batch=random.choice(batches[-4:]), # Current students
                semester=random.randint(1, 8),
                bio=fake.sentence(),
                phone=fake.phone_number()[:10],
                address=fake.city()
            ))
        StudentProfile.objects.bulk_create(student_profiles)
        
        alumni_profiles = []
        for a in alumni_users:
            alumni_profiles.append(AlumniProfile(
                user=a,
                department=random.choice(departments),
                batch=random.choice(batches[:5]), # Past students
                current_job_title=random.choice(["Software Engineer", "Data Analyst", "Product Manager", "Consultant"]),
                current_company=random.choice(companies) if companies else None,
                bio=fake.sentence(),
                phone=fake.phone_number()[:10],
                location=fake.city()
            ))
        AlumniProfile.objects.bulk_create(alumni_profiles)

        # 6. Community Content
        self.stdout.write("- Simulating Community Engagement (Posts & Comments)...")
        posts = []
        all_users = students + alumni_users
        for _ in range(100):
            posts.append(Post(
                author=random.choice(all_users),
                post_type=random.choice(["DISCUSSION", "OPPORTUNITY", "EXPERIENCE"]),
                title=fake.sentence(),
                content=fake.paragraph(nb_sentences=5)
            ))
        Post.objects.bulk_create(posts)
        
        saved_posts = list(Post.objects.all())
        comments = []
        for _ in range(400):
            comments.append(Comment(
                post=random.choice(saved_posts),
                author=random.choice(all_users),
                content=fake.sentence()
            ))
        Comment.objects.bulk_create(comments)
