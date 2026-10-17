import random
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.accounts.models import User
from apps.profiles.models import StudentProfile, AlumniProfile, StudentPlacementRecord
from apps.university.models import Department, Batch
from apps.companies.models import Company
from apps.skills.models import Skill, UserSkill
from apps.resumes.models import Resume, ResumeAnalysis

class Command(BaseCommand):
    help = "Seed comprehensive, realistic institutional data for analytics dashboards across departments, batches, and company tiers."

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("Starting realistic analytics data seeding..."))
        
        with transaction.atomic():
            # 1. Departments normalization
            standard_depts = {
                'CSE': ('Computer Science & Engineering', 'CSE'),
                'IT': ('Information Technology', 'IT'),
                'AIDS': ('Artificial Intelligence & Data Science', 'AIDS'),
                'ECE': ('Electronics & Communication Engineering', 'ECE'),
                'EE': ('Electrical Engineering', 'EE'),
                'ME': ('Mechanical Engineering', 'ME'),
                'CE': ('Civil Engineering', 'CE'),
            }
            dept_objs = {}
            for code, (name, c) in standard_depts.items():
                d_obj, _ = Department.objects.get_or_create(code=code, defaults={'name': name, 'is_active': True})
                dept_objs[code] = d_obj

            dept_map = {'BCE': 'CSE', 'BEC': 'ECE', 'BME': 'ME', 'BEE': 'EE', 'BCV': 'CE'}
            for old_code, std_code in dept_map.items():
                old_d = Department.objects.filter(code=old_code).first()
                if old_d:
                    StudentProfile.objects.filter(department=old_d).update(department=dept_objs[std_code])
                    AlumniProfile.objects.filter(department=old_d).update(department=dept_objs[std_code])

            # 2. Top Companies
            top_companies = [
                {"name": "Google", "tier": "SUPER_DREAM", "industry": "Information Technology", "headquarters": "Bengaluru", "size": "ENTERPRISE"},
                {"name": "Microsoft", "tier": "SUPER_DREAM", "industry": "Information Technology", "headquarters": "Hyderabad", "size": "ENTERPRISE"},
                {"name": "Amazon", "tier": "SUPER_DREAM", "industry": "E-Commerce & Cloud", "headquarters": "Bengaluru", "size": "ENTERPRISE"},
                {"name": "Atlassian", "tier": "SUPER_DREAM", "industry": "Enterprise Software", "headquarters": "Bengaluru", "size": "ENTERPRISE"},
                {"name": "Adobe", "tier": "SUPER_DREAM", "industry": "Enterprise Software", "headquarters": "Noida", "size": "ENTERPRISE"},
                {"name": "Razorpay", "tier": "UNICORN", "industry": "Financial Services", "headquarters": "Bengaluru", "size": "LARGE"},
                {"name": "Zerodha", "tier": "UNICORN", "industry": "Financial Services", "headquarters": "Bengaluru", "size": "LARGE"},
                {"name": "Flipkart", "tier": "UNICORN", "industry": "E-Commerce & Retail", "headquarters": "Bengaluru", "size": "ENTERPRISE"},
                {"name": "Oracle", "tier": "DREAM", "industry": "Enterprise Software", "headquarters": "Bengaluru", "size": "ENTERPRISE"},
                {"name": "Cisco", "tier": "DREAM", "industry": "Networking & Cloud", "headquarters": "Bengaluru", "size": "ENTERPRISE"},
                {"name": "Deloitte", "tier": "DREAM", "industry": "Consulting", "headquarters": "Hyderabad", "size": "ENTERPRISE"},
                {"name": "Tata Consultancy Services (TCS)", "tier": "REGULAR", "industry": "Information Technology", "headquarters": "Mumbai", "size": "ENTERPRISE"},
                {"name": "Infosys", "tier": "REGULAR", "industry": "Information Technology", "headquarters": "Bengaluru", "size": "ENTERPRISE"},
                {"name": "Wipro", "tier": "REGULAR", "industry": "Information Technology", "headquarters": "Bengaluru", "size": "ENTERPRISE"},
                {"name": "Larsen & Toubro (L&T)", "tier": "CORE", "industry": "Construction & Infrastructure", "headquarters": "Mumbai", "size": "ENTERPRISE"},
                {"name": "Siemens", "tier": "CORE", "industry": "Industrial Automation", "headquarters": "Mumbai", "size": "ENTERPRISE"},
            ]
            for c in top_companies:
                Company.objects.update_or_create(
                    name=c["name"],
                    defaults={"company_tier": c["tier"], "industry": c["industry"], "headquarters": c["headquarters"], "company_size": c["size"], "is_active": True}
                )

            # Untiered fallback
            tier_cycle = ['REGULAR', 'DREAM', 'REGULAR', 'SUPER_DREAM', 'UNICORN', 'CORE']
            for i, comp in enumerate(Company.objects.filter(company_tier__isnull=True)):
                comp.company_tier = tier_cycle[i % len(tier_cycle)]
                comp.save(update_fields=['company_tier'])

        self.stdout.write(self.style.SUCCESS("Realistic analytics data seeded successfully!"))
