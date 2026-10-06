import random
from django.core.management.base import BaseCommand
from django.utils import timezone
from faker import Faker
from datetime import timedelta

from apps.accounts.models import User
from apps.companies.models import Company
from apps.opportunities.models import Opportunity
from apps.interviews.models import InterviewExperience
from apps.announcements.models import Announcement

class Command(BaseCommand):
    help = "Fills remaining empty tables"

    def handle(self, *args, **kwargs):
        fake = Faker('en_IN')
        
        users = list(User.objects.all())
        companies = list(Company.objects.all())
        if not users or not companies:
            return
            
        # 1. Opportunities
        if Opportunity.objects.count() == 0:
            opps = []
            for _ in range(50):
                opps.append(Opportunity(
                    company=random.choice(companies),
                    posted_by=random.choice(users),
                    opportunity_type=random.choice(["JOB", "INTERNSHIP"]),
                    title=fake.job(),
                    description=fake.text(),
                    location=fake.city(),
                    work_mode=random.choice(["REMOTE", "ONSITE", "HYBRID"]),
                    employment_type=random.choice(["FULL_TIME", "PART_TIME"]),
                    deadline=timezone.now() + timedelta(days=random.randint(10, 60)),
                    status="OPEN"
                ))
            Opportunity.objects.bulk_create(opps)
            self.stdout.write("Added 50 Opportunities!")

        # 2. Interview Experiences
        if InterviewExperience.objects.count() == 0:
            exps = []
            for _ in range(50):
                exps.append(InterviewExperience(
                    author=random.choice(users),
                    company=random.choice(companies),
                    role_title=fake.job(),
                    status=random.choice(["SELECTED", "REJECTED", "PENDING"]),
                    difficulty=random.choice(["EASY", "MEDIUM", "HARD"]),
                    overall_experience=fake.paragraph()
                ))
            InterviewExperience.objects.bulk_create(exps)
            self.stdout.write("Added 50 Interview Experiences!")
            
        # 3. Announcements
        if Announcement.objects.count() == 0:
            anns = []
            for _ in range(10):
                anns.append(Announcement(
                    title=fake.sentence(),
                    content=fake.paragraph(),
                    priority=random.choice(["LOW", "MEDIUM", "HIGH"]),
                    is_active=True
                ))
            Announcement.objects.bulk_create(anns)
            self.stdout.write("Added 10 Announcements!")
