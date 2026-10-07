import random
from datetime import timedelta
from django.utils import timezone
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.opportunities.models import Opportunity, OpportunitySkill
from apps.announcements.models import Announcement
from apps.companies.models import Company, CompanyRole
from apps.university.models import Department, Batch
from apps.skills.models import Skill

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds realistic Placement Cell data (Opportunities and Announcements).'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS("Starting Phase 5: Seeding Placement Cell Data..."))

        # 1. Ensure a Placement Cell User exists
        placement_user, created = User.objects.get_or_create(
            email="placement_cell@nirmauni.ac.in",
            defaults={
                "role": "PLACEMENT_CELL",
                "is_staff": True
            }
        )
        if created:
            placement_user.set_password("placement123")
            placement_user.save()

        companies = list(Company.objects.all())
        departments = list(Department.objects.all())
        batches = list(Batch.objects.all())
        skills = list(Skill.objects.all())

        if not companies or not departments or not batches or not skills:
            self.stdout.write(self.style.ERROR("Master data missing! Run Phase 1 first."))
            return

        opps_created = 0
        announcements_created = 0

        # --- 2. GENERATE OPPORTUNITIES ---
        for i in range(25): # Generate 25 Opportunities
            company = random.choice(companies)
            roles = list(CompanyRole.objects.filter(company=company))
            role = random.choice(roles) if roles else None
            
            is_internship = random.choice([True, False])
            salary = f"{random.randint(4, 30)}.0 LPA" if not is_internship else f"{random.randint(20, 80)}k / month"
            
            opp = Opportunity.objects.create(
                company=company,
                role=role,
                posted_by=placement_user,
                opportunity_type="INTERNSHIP" if is_internship else "PLACEMENT",
                title=f"{role.role_name if role else 'Software Engineer'} at {company.name}",
                description="We are looking for highly motivated individuals to join our fast-paced engineering team.",
                location=random.choice(["Bangalore", "Hyderabad", "Pune", "Remote", "Gurgaon"]),
                work_mode=random.choice(["ON_SITE", "REMOTE", "HYBRID"]),
                employment_type="INTERNSHIP" if is_internship else "FULL_TIME",
                salary_package=salary,
                min_cgpa=random.choice([7.0, 7.5, 8.0, 8.5]),
                deadline=timezone.now() + timedelta(days=random.randint(5, 30)),
                status="OPEN"
            )
            
            # Attach Departments (e.g., usually CS and IT)
            selected_depts = random.sample(departments, k=random.randint(2, 4))
            opp.eligible_departments.set(selected_depts)
            
            # Attach Batches (e.g., 2024, 2025)
            selected_batches = random.sample(batches, k=random.randint(1, 2))
            opp.eligible_batches.set(selected_batches)
            
            # Attach Skills
            selected_skills = random.sample(skills, k=random.randint(3, 5))
            for skill in selected_skills:
                OpportunitySkill.objects.create(
                    opportunity=opp,
                    skill=skill,
                    importance=random.choice(["REQUIRED", "PREFERRED"])
                )
            opps_created += 1

        # --- 3. GENERATE ANNOUNCEMENTS ---
        ANNOUNCEMENT_TEMPLATES = [
            ("PLACEMENT", "Urgent: Upload Resumes for {company} On-Campus Drive", "Please ensure your resumes are uploaded to the portal by EOD. {company} will begin shortlisting tomorrow."),
            ("TRAINING", "Pre-Placement Talk: {company}", "{company} leadership will be hosting a Pre-Placement talk this Friday. Mandatory for all shortlisted students."),
            ("INTERNSHIP", "{company} 6-Month Internship Drive Declared", "Eligible students for the {company} internship drive must register on the Google Form linked below."),
            ("GENERAL", "Resume Building Workshop by Alumni", "Join our distinguished alumni for a masterclass on building ATS-friendly resumes."),
        ]

        for i in range(15):
            company = random.choice(companies)
            template = random.choice(ANNOUNCEMENT_TEMPLATES)
            
            ann = Announcement.objects.create(
                created_by=placement_user,
                title=template[1].format(company=company.name),
                content=template[2].format(company=company.name),
                announcement_type=template[0],
                target_audience=random.choice(["STUDENTS", "ALL"]),
                is_published=True,
                published_at=timezone.now() - timedelta(days=random.randint(1, 10))
            )
            announcements_created += 1

        self.stdout.write(self.style.SUCCESS(f"PHASE 5 COMPLETE!"))
        self.stdout.write(self.style.SUCCESS(f"- {opps_created} Opportunities (with criteria & skills) generated."))
        self.stdout.write(self.style.SUCCESS(f"- {announcements_created} Announcements generated."))
