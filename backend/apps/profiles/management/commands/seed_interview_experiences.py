import random
from django.core.management.base import BaseCommand
from apps.profiles.models import AlumniProfile
from apps.interviews.models import InterviewExperience, InterviewRound
from apps.companies.models import CompanyRole

class Command(BaseCommand):
    help = 'Seeds realistic Interview Experiences and Rounds for Alumni.'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS("Starting Interview Experience Seeding for Alumni..."))

        alumni = AlumniProfile.objects.select_related('user', 'current_company').all()
        if not alumni.exists():
            self.stdout.write(self.style.ERROR("No Alumni found!"))
            return

        experiences_created = 0
        rounds_created = 0
        
        EXPERIENCE_TEXTS = [
            "The interview process was very smooth. The interviewers were friendly and focused on problem-solving skills rather than syntax.",
            "It was a rigorous process. The technical rounds heavily tested my knowledge of System Design and advanced DSA.",
            "Standard interview process. Make sure your fundamentals in OS and DBMS are strong. They grilled me on my resume projects.",
            "The online assessment was tricky with hard DP problems, but the face-to-face rounds were more about cultural fit and practical coding."
        ]
        
        PREPARATION_TEXTS = [
            "I primarily used LeetCode and practiced medium/hard problems. For system design, I read standard engineering blogs.",
            "Striver's SDE sheet was my main resource for coding rounds. Also watched a lot of mock interviews on YouTube.",
            "Focused heavily on my resume projects. Ensure you know every detail of what you have built and why you chose that tech stack.",
            "Practiced mock interviews with my friends. GeeksforGeeks was incredibly helpful for company-specific archives."
        ]

        for alum in alumni:
            # 80% chance an alumni shares their successful interview experience
            if random.random() < 0.8:
                company = alum.current_company
                if not company:
                    continue
                
                # Pick a random role from that company to make it highly realistic
                roles = list(CompanyRole.objects.filter(company=company))
                selected_role = random.choice(roles) if roles else None
                
                exp, created = InterviewExperience.objects.get_or_create(
                    author=alum.user,
                    company=company,
                    defaults={
                        'role': selected_role,
                        'experience_type': "PLACEMENT",
                        'result': "SELECTED", # Since they work there, they were selected!
                        'difficulty': random.choice(["MEDIUM", "HARD", "VERY_HARD"]),
                        'experience': random.choice(EXPERIENCE_TEXTS),
                        'preparation': random.choice(PREPARATION_TEXTS)
                    }
                )
                
                if created:
                    experiences_created += 1
                    
                    # Generate 3 realistic Rounds for this experience
                    # Round 1: Online Assessment
                    InterviewRound.objects.get_or_create(
                        interview_experience=exp, round_number=1,
                        defaults={
                            'round_type': "ONLINE_ASSESSMENT", 
                            'mode': "ONLINE", 
                            'duration_minutes': 90, 
                            'topics': "Aptitude, Logical Reasoning, Basic DSA, SQL queries"
                        }
                    )
                    
                    # Round 2: Technical Interview
                    InterviewRound.objects.get_or_create(
                        interview_experience=exp, round_number=2,
                        defaults={
                            'round_type': "TECHNICAL", 
                            'mode': random.choice(["ONLINE", "OFFLINE"]), 
                            'duration_minutes': 60, 
                            'topics': "Advanced DSA (Trees/Graphs), Core Subjects (OS/DBMS), Project Discussion"
                        }
                    )
                    
                    # Round 3: HR / Managerial Interview
                    InterviewRound.objects.get_or_create(
                        interview_experience=exp, round_number=3,
                        defaults={
                            'round_type': random.choice(["HR", "MANAGERIAL"]), 
                            'mode': random.choice(["ONLINE", "OFFLINE"]), 
                            'duration_minutes': 30, 
                            'topics': "Resume Deep Dive, Behavioral Questions, Cultural Fit, Salary Discussion"
                        }
                    )
                    rounds_created += 3
                    
        self.stdout.write(self.style.SUCCESS(f"Seeded {experiences_created} Interview Experiences!"))
        self.stdout.write(self.style.SUCCESS(f"Seeded {rounds_created} Interview Rounds!"))
        self.stdout.write(self.style.SUCCESS("Alumni Interview Analytics are now fully consistent and populated."))
