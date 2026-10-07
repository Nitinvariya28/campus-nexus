from django.core.management.base import BaseCommand
from apps.university.models import Department, Batch
from apps.companies.models import Company, CompanyRole

class Command(BaseCommand):
    help = 'Seeds the database with missing Master Data (Departments, Batches, Company Roles)'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS("Starting Phase 1.5: Seeding remaining Master Data..."))

        # --- 1. SEED DEPARTMENTS ---
        DEPARTMENTS = [
            ("Computer Science & Engineering", "CSE"),
            ("Information Technology", "IT"),
            ("Electronics & Communication", "ECE"),
            ("Electrical Engineering", "EE"),
            ("Mechanical Engineering", "ME"),
            ("Civil Engineering", "CE"),
            ("Artificial Intelligence & Data Science", "AIDS")
        ]
        for name, code in DEPARTMENTS:
            Department.objects.get_or_create(code=code, defaults={"name": name})
        
        self.stdout.write(self.style.SUCCESS("Successfully seeded Departments!"))

        # --- 2. SEED BATCHES ---
        BATCHES = [
            (2018, 2022), (2019, 2023), (2020, 2024), 
            (2021, 2025), (2022, 2026), (2023, 2027), (2024, 2028)
        ]
        for start, end in BATCHES:
            Batch.objects.get_or_create(start_year=start, end_year=end)
            
        self.stdout.write(self.style.SUCCESS("Successfully seeded Batches!"))

        # --- 3. SEED COMPANY ROLES ---
        # We will assign 3-4 common roles to EVERY company we seeded earlier
        ROLES = [
            ("Software Development Engineer (SDE)", "SOFTWARE"),
            ("Frontend Developer", "SOFTWARE"),
            ("Backend Developer", "SOFTWARE"),
            ("Data Scientist", "DATA"),
            ("Machine Learning Engineer", "AI_ML"),
            ("DevOps Engineer", "DEVOPS_CLOUD"),
            ("Product Manager", "PRODUCT"),
            ("UI/UX Designer", "DESIGN"),
            ("Security Analyst", "SECURITY")
        ]
        
        companies = Company.objects.all()
        if not companies.exists():
            self.stdout.write(self.style.WARNING("No companies found! Run seed_master_data first."))
        else:
            role_count = 0
            for company in companies:
                # Add a few roles to each company
                for role_name, role_category in ROLES:
                    CompanyRole.objects.get_or_create(
                        company=company, 
                        role_name=role_name, 
                        defaults={"role_category": role_category}
                    )
                    role_count += 1
            self.stdout.write(self.style.SUCCESS(f"Successfully seeded {role_count} Company Roles across {companies.count()} companies!"))

        self.stdout.write(self.style.SUCCESS("PHASE 1.5 COMPLETE. All Master Tables are fully populated."))
