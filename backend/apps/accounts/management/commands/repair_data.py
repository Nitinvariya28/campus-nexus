from django.core.management.base import BaseCommand
from apps.profiles.models import StudentProfile, AlumniProfile
from apps.university.models import UniversityIdentity
from apps.accounts.models import User

class Command(BaseCommand):
    help = "Repairs all inconsistent dummy emails to perfectly match the API Regex."

    def handle(self, *args, **kwargs):
        # 1. Repair Student Profiles (Must match batch and department mathematically)
        students = StudentProfile.objects.select_related('user', 'batch', 'department').all()
        student_counters = {}
        for sp in students:
            year = str(sp.batch.start_year)[-2:]
            dept = sp.department.code.lower()
            key = f"{year}{dept}"
            
            while True:
                student_counters[key] = student_counters.get(key, 0) + 1
                roll = student_counters[key]
                new_email = f"{year}{dept}{roll:03d}@nirmauni.ac.in"
                
                # Check if this email is already taken (e.g. by manual API testing)
                if not User.objects.filter(email=new_email).exists():
                    break
                    
            user = sp.user
            user.email = new_email
            user.save()
            
        self.stdout.write(self.style.SUCCESS(f"Successfully repaired {students.count()} Student emails!"))

        # 2. Repair Alumni Profiles (Should be personal emails like @gmail.com)
        alumni = AlumniProfile.objects.select_related('user').all()
        alumni_counter = 1
        for ap in alumni:
            user = ap.user
            if "@nirmauni.ac.in" in user.email: # If they have a fake nirma email
                user.email = f"alumni.user{alumni_counter}@gmail.com"
                user.save()
                alumni_counter += 1
                
        self.stdout.write(self.style.SUCCESS(f"Successfully repaired {alumni.count()} Alumni personal emails!"))

        # 3. Repair UniversityIdentity (Master Records)
        identities = UniversityIdentity.objects.all()
        ui_counter = 1
        for ui in identities:
            # Generate a perfectly valid 3-digit email (e.g., 18bce001)
            new_ui_email = f"18bce{ui_counter:03d}@nirmauni.ac.in"
            ui.university_email = new_ui_email
            ui.save()
            ui_counter += 1
            
        self.stdout.write(self.style.SUCCESS(f"Successfully repaired {identities.count()} UniversityIdentity master emails!"))
