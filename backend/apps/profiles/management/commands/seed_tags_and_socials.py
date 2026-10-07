import random
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.community.models import Tag
from apps.skills.models import SocialLink

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds realistic Community Tags and assigns Social Links to all users.'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS("Starting Tag and Social Link Seeding..."))

        # 1. SEED COMMUNITY TAGS
        REALISTIC_TAGS = [
            "Placement", "Internship", "Hackathon", "OpenSource", "Guidance",
            "InterviewExperience", "TechNews", "Doubt", "WebDevelopment", "MachineLearning",
            "DataScience", "SystemDesign", "CyberSecurity", "CloudComputing", "DevOps",
            "OffCampus", "OnCampus", "ResumeReview", "ProjectShowcase", "Startup",
            "Freelancing", "CompetitiveProgramming", "DSA", "FAANG", "CoreEngineering",
            "HigherEducation", "MSinUS", "GATE", "CAT", "Mentorship",
            "WomenInTech", "Blockchain", "Web3", "UI_UX", "ProductManagement"
        ]

        tags_created = 0
        for tag_name in REALISTIC_TAGS:
            tag, created = Tag.objects.get_or_create(name=tag_name)
            if created:
                tags_created += 1

        self.stdout.write(self.style.SUCCESS(f"Seeded {tags_created} missing Community Tags!"))

        # 2. SEED SOCIAL LINKS
        users = User.objects.all()
        if not users.exists():
            self.stdout.write(self.style.ERROR("No users found to seed Social Links."))
            return

        socials_created = 0
        for user in users:
            # Generate a realistic-looking username based on email
            base_username = user.email.split("@")[0]

            # 90% chance to have LinkedIn
            if random.random() < 0.9:
                link, created = SocialLink.objects.get_or_create(
                    user=user, platform="LINKEDIN",
                    defaults={"url": f"https://linkedin.com/in/{base_username}"}
                )
                if created:
                    socials_created += 1

            # 80% chance to have GitHub
            if random.random() < 0.8:
                link, created = SocialLink.objects.get_or_create(
                    user=user, platform="GITHUB",
                    defaults={"url": f"https://github.com/{base_username}"}
                )
                if created:
                    socials_created += 1
            
            # 30% chance to have a Portfolio
            if random.random() < 0.3:
                link, created = SocialLink.objects.get_or_create(
                    user=user, platform="PORTFOLIO",
                    defaults={"url": f"https://{base_username}.dev"}
                )
                if created:
                    socials_created += 1
            
            # 40% chance for LeetCode
            if random.random() < 0.4:
                link, created = SocialLink.objects.get_or_create(
                    user=user, platform="LEETCODE",
                    defaults={"url": f"https://leetcode.com/{base_username}"}
                )
                if created:
                    socials_created += 1

        self.stdout.write(self.style.SUCCESS(f"Seeded {socials_created} Social Links for {users.count()} users!"))
        self.stdout.write(self.style.SUCCESS("All Missing Tables Completed!"))
