import random
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.profiles.models import StudentProfile, AlumniProfile, StudentPlacementRecord
from apps.skills.models import Skill, UserSkill, MasterLearningPlatform, UserLearningResource, UserAIUsage
from apps.companies.models import Company

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds User tables with realistic analytics data based on Tech Personas.'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS("Starting Phase 2, 3 & 4: Seeding User Profiles..."))

        # Pre-fetch master data to memory for fast random selection
        all_skills = list(Skill.objects.select_related('category').all())
        all_platforms = list(MasterLearningPlatform.objects.all())
        all_companies = list(Company.objects.all())
        
        if not all_skills or not all_platforms or not all_companies:
            self.stdout.write(self.style.ERROR("Master data is missing! Run seed_master_data first."))
            return

        # Define Tech Personas
        PERSONAS = {
            "SOFTWARE_ENGINEER": {
                "categories": ["PROGRAMMING_LANGUAGE", "WEB_FRAMEWORK", "DATABASE", "CORE_SUBJECT"],
                "platforms": ["LeetCode", "Codeforces", "freeCodeCamp.org", "Traversy Media"],
                "job_category": "SOFTWARE",
            },
            "DATA_SCIENTIST": {
                "categories": ["PROGRAMMING_LANGUAGE", "DATABASE", "CLOUD_TOOL", "CORE_SUBJECT"],
                "platforms": ["Kaggle", "Coursera", "CodeWithHarry", "Datacamp"],
                "job_category": "DATA_SCIENCE",
            },
            "DEVOPS": {
                "categories": ["PROGRAMMING_LANGUAGE", "CLOUD_TOOL", "DATABASE", "CERTIFICATION"],
                "platforms": ["Udemy", "Pluralsight", "freeCodeCamp.org", "The Net Ninja"],
                "job_category": "DEVOPS_CLOUD",
            }
        }

        PROFICIENCY = ["BEGINNER", "INTERMEDIATE", "ADVANCED"]
        AI_TOOLS = ["CHATGPT", "GEMINI", "CLAUDE", "GITHUB_COPILOT", "CURSOR"]
        AI_FREQ = ["OCCASIONALLY", "REGULARLY", "HEAVILY"]
        AI_PURPOSE = ["CODING", "DEBUGGING", "LEARNING", "INTERVIEW_PREPARATION"]
        AI_TIME = ["30_TO_60_MIN", "1_TO_2_HOURS", "2_TO_4_HOURS"]

        def generate_user_data(user, persona_key, is_alumni=False):
            persona = PERSONAS[persona_key]
            
            # 1. Assign Skills
            num_skills = random.randint(5, 10) if is_alumni else random.randint(3, 7)
            valid_skills = [s for s in all_skills if s.category.category_type in persona["categories"]]
            selected_skills = random.sample(valid_skills, min(num_skills, len(valid_skills)))
            
            for skill in selected_skills:
                prof = random.choice(["INTERMEDIATE", "ADVANCED"]) if is_alumni else random.choice(PROFICIENCY)
                UserSkill.objects.get_or_create(user=user, skill=skill, defaults={'proficiency': prof})

            # 2. Assign Learning Resources
            num_platforms = random.randint(1, 3)
            valid_platforms = [p for p in all_platforms if p.name in persona["platforms"]]
            if valid_platforms:
                selected_platforms = random.sample(valid_platforms, min(num_platforms, len(valid_platforms)))
                for plat in selected_platforms:
                    UserLearningResource.objects.get_or_create(user=user, platform=plat)

            # 3. Assign AI Usage
            num_ai = random.randint(1, 2)
            selected_ai = random.sample(AI_TOOLS, num_ai)
            for ai in selected_ai:
                UserAIUsage.objects.get_or_create(
                    user=user, ai_tool=ai,
                    defaults={
                        'usage_frequency': random.choice(AI_FREQ),
                        'usage_purpose': random.choice(AI_PURPOSE),
                        'daily_time_range': random.choice(AI_TIME)
                    }
                )

        # --- SEED STUDENTS ---
        students = StudentProfile.objects.all()
        if students.exists():
            self.stdout.write(f"Seeding {students.count()} Student Profiles...")
            for student in students:
                persona_key = random.choice(list(PERSONAS.keys()))
                generate_user_data(student.user, persona_key, is_alumni=False)
                
                # 30% chance a student has an internship
                if random.random() < 0.3:
                    company = random.choice(all_companies)
                    StudentPlacementRecord.objects.get_or_create(
                        student=student, company=company, placement_year=2024,
                        defaults={
                            'offer_type': "INTERNSHIP",
                            'hiring_mode': random.choice(["ON_CAMPUS", "OFF_CAMPUS", "PPO"]),
                            'job_category': PERSONAS[persona_key]["job_category"],
                            'package_lpa': Decimal(random.randint(15, 80)) / 10 # 1.5 to 8.0 LPA
                        }
                    )
        else:
            self.stdout.write(self.style.WARNING("No Student Profiles found in DB!"))

        # --- SEED ALUMNI ---
        alumni = AlumniProfile.objects.all()
        if alumni.exists():
            self.stdout.write(f"Seeding {alumni.count()} Alumni Profiles...")
            for alum in alumni:
                persona_key = random.choice(list(PERSONAS.keys()))
                generate_user_data(alum.user, persona_key, is_alumni=True)

                # Update Alumni Career details
                company = random.choice(all_companies)
                alum.current_company = company
                alum.job_category = PERSONAS[persona_key]["job_category"]
                alum.years_of_experience = random.randint(1, 5)
                alum.save()

                # Generate their historical Placement Record
                # Make sure we have a student profile for them to attach the record
                # Wait, StudentPlacementRecord requires a StudentProfile. If they are alumni, do they have a StudentProfile?
                # Usually, Alumni might not have a StudentProfile object if it's OneToOne. 
                # Let's skip historical placement for alumni unless they have a StudentProfile, to avoid DB IntegrityErrors.
                try:
                    student_prof = alum.user.student_profile
                    StudentPlacementRecord.objects.get_or_create(
                        student=student_prof, company=company, placement_year=random.randint(2019, 2023),
                        defaults={
                            'offer_type': "FULL_TIME_PLACEMENT",
                            'hiring_mode': random.choice(["ON_CAMPUS", "OFF_CAMPUS"]),
                            'job_category': alum.job_category,
                            'package_lpa': Decimal(random.randint(40, 250)) / 10 # 4.0 to 25.0 LPA
                        }
                    )
                except StudentProfile.DoesNotExist:
                    pass
        else:
            self.stdout.write(self.style.WARNING("No Alumni Profiles found in DB!"))

        self.stdout.write(self.style.SUCCESS("USER PROFILES SUCCESSFULLY SEEDED! Analytics Dashboard is ready."))
