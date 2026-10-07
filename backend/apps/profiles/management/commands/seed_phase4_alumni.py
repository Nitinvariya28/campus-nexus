import random
from decimal import Decimal
from django.core.management.base import BaseCommand
from apps.profiles.models import AlumniProfile, StudentProfile, StudentPlacementRecord
from apps.companies.models import Company

class Command(BaseCommand):
    help = 'Executes Phase 4: Fixes Alumni historical placements and ensures all Alumni have career data.'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS("Starting Phase 4: Finalizing Alumni Analytics Data..."))

        alumni = AlumniProfile.objects.all()
        companies = list(Company.objects.all())
        
        if not alumni.exists() or not companies:
            self.stdout.write(self.style.ERROR("Missing Alumni or Company data!"))
            return

        placements_created = 0
        profiles_updated = 0

        for alum in alumni:
            # 1. Ensure Alumni has Job details securely assigned
            if not alum.current_company or not alum.job_category:
                alum.current_company = random.choice(companies)
                alum.job_category = random.choice([
                    "SOFTWARE", "DATA_SCIENCE", "DEVOPS_CLOUD", 
                    "SECURITY", "DESIGN", "PRODUCT_MANAGEMENT"
                ])
                alum.years_of_experience = random.randint(1, 5)
                alum.save()
                profiles_updated += 1
            
            # 2. Fix the Historical Placement Issue
            # In order to track "Year-wise Placement Trends" for the university, 
            # we need to log how these Alumni got placed years ago.
            # We ensure they have a linked StudentProfile for the placement record.
            student_prof, created = StudentProfile.objects.get_or_create(
                user=alum.user,
                defaults={
                    'department': alum.department,
                    'batch': alum.batch,
                    'semester': 8
                }
            )

            # 3. Create their historical StudentPlacementRecord
            record, record_created = StudentPlacementRecord.objects.get_or_create(
                student=student_prof,
                company=alum.current_company,
                placement_year=alum.batch.end_year, # e.g., Placed in their graduation year
                defaults={
                    'offer_type': "FULL_TIME_PLACEMENT",
                    'hiring_mode': random.choice(["ON_CAMPUS", "OFF_CAMPUS", "PPO"]),
                    'job_category': alum.job_category,
                    'package_lpa': Decimal(random.randint(40, 250)) / 10 # 4.0 to 25.0 LPA
                }
            )
            if record_created:
                placements_created += 1

        self.stdout.write(self.style.SUCCESS(f"PHASE 4 COMPLETE!"))
        self.stdout.write(self.style.SUCCESS(f"- Alumni Profiles Verified: {alumni.count()}"))
        self.stdout.write(self.style.SUCCESS(f"- Historical Placements Generated: {placements_created}"))
