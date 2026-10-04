
import random
from datetime import date

from django.core.management.base import BaseCommand

from apps.university.models import UniversityIdentity


class Command(BaseCommand):

    help = "Create dummy university identity records"

    FIRST_NAMES = [
        "Rahul", "Aarav", "Arjun", "Rohan", "Aditya",
        "Yash", "Dev", "Harsh", "Karan", "Dhruv",
        "Neel", "Krish", "Mihir", "Parth", "Meet",
        "Nisarg", "Jay", "Darsh", "Shivam", "Akash",
        "Priya", "Diya", "Riya", "Ananya", "Aditi",
        "Isha", "Kavya", "Nisha", "Meera", "Khushi",
    ]

    LAST_NAMES = [
        "Patel", "Shah", "Mehta", "Desai", "Joshi",
        "Sharma", "Verma", "Trivedi", "Parikh", "Dave",
        "Pandya", "Vora", "Modi", "Rana", "Chauhan",
    ]

    def generate_name(self):
        first_name = random.choice(self.FIRST_NAMES)
        last_name = random.choice(self.LAST_NAMES)
        return f"{first_name} {last_name}"

    def generate_date_of_birth(self, admission_year):
        birth_year = admission_year - random.randint(17, 19)

        month = random.randint(1, 12)

        if month == 2:
            day = random.randint(1, 28)
        elif month in [4, 6, 9, 11]:
            day = random.randint(1, 30)
        else:
            day = random.randint(1, 28)

        return date(birth_year, month, day)

    def handle(self, *args, **options):

        target_count = 1000

        programs = [
            code for code, label
            in UniversityIdentity.PROGRAM_CHOICES
        ]

        created_count = 0

        while created_count < target_count:

            admission_year = random.randint(2015, 2026)
            program_code = random.choice(programs)
            roll_number = random.randint(1, 250)

            university_email = (
                f"{str(admission_year)[-2:]}"
                f"{program_code.lower()}"
                f"{roll_number:03d}"
                "@nirmauni.ac.in"
            )

            if UniversityIdentity.objects.filter(
                university_email=university_email
            ).exists():
                continue

            if UniversityIdentity.objects.filter(
                admission_year=admission_year,
                program_code=program_code,
                roll_number=roll_number
            ).exists():
                continue

            if admission_year >= 2023:
                record_status = "ACTIVE"
            else:
                record_status = "GRADUATED"

            UniversityIdentity.objects.create(
                admission_year=admission_year,
                program_code=program_code,
                roll_number=roll_number,
                full_name=self.generate_name(),
                date_of_birth=self.generate_date_of_birth(
                    admission_year
                ),
                university_email=university_email,
                record_status=record_status,
            )

            created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"{created_count} university identity records created successfully."
            )
        )

