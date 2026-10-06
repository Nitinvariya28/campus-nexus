import os
import random
import urllib.request
from django.core.management.base import BaseCommand
from django.conf import settings
from apps.accounts.models import User
from apps.community.models import Post, Comment, PostLike, PostMedia, Tag, PostTag
from apps.opportunities.models import Opportunity
from apps.announcements.models import Announcement
from apps.companies.models import Company

class Command(BaseCommand):
    help = "Refreshes community posts, opportunities, and announcements with highly realistic, role-specific data and media."

    def handle(self, *args, **kwargs):
        self.stdout.write("Deleting old unrealistic posts, opportunities, and announcements...")
        Post.objects.all().delete()
        Opportunity.objects.all().delete()
        Announcement.objects.all().delete()
        Tag.objects.all().delete()
        
        # Ensure media directory exists
        media_dir = os.path.join(settings.BASE_DIR, 'media', 'posts')
        os.makedirs(media_dir, exist_ok=True)

        users = list(User.objects.all())
        students = [u for u in users if u.role == 'STUDENT']
        alumni = [u for u in users if u.role == 'ALUMNI']
        placement_cells = [u for u in users if u.role == 'PLACEMENT_CELL']
        
        if not placement_cells:
            placement = User.objects.create_user(email="placement@nirmauni.ac.in", password="password123", first_name="Placement", last_name="Cell", role="PLACEMENT_CELL", is_verified=True)
            placement_cells.append(placement)

        # Create Companies if none exist
        if not Company.objects.exists():
            for c in ["Google", "Amazon", "Microsoft", "TCS", "Infosys", "Goldman Sachs"]:
                Company.objects.create(name=c, website=f"https://{c.lower().replace(' ', '')}.com")
        companies = list(Company.objects.all())

        # Create Tags
        tags = [Tag.objects.create(name=t) for t in ["Interview", "System Design", "Internship", "Hackathon", "Doubt", "Guidance", "Referral"]]

        self.stdout.write("Generating realistic ALUMNI Posts...")
        alumni_titles = [
            ("Cracked Google SDE-1! Here is my interview experience", "INTERVIEW_EXPERIENCE", "Just wrapped up my interview loops. Focus heavily on Graphs and DP. System design was mostly around load balancers."),
            ("Amazon is hiring! Referral links inside.", "COMPANY_INFO", "My team at Amazon AWS is hiring freshers. If you have strong AWS knowledge, drop your resume below."),
            ("Corporate Life vs College Life", "CAREER_ADVICE", "The transition is hard. In corporate, communication is 50% of the job. Start building soft skills now!"),
            ("How to negotiate your first salary", "CAREER_ADVICE", "Never accept the first offer immediately. Always ask for a day to review. Research industry standards."),
        ]
        
        for i in range(15):
            author = random.choice(alumni)
            title, p_type, content = random.choice(alumni_titles)
            company = random.choice(companies) if p_type in ["INTERVIEW_EXPERIENCE", "COMPANY_INFO"] else None
            
            post = Post.objects.create(author=author, title=title, content=content, post_type=p_type, company=company)
            PostTag.objects.create(post=post, tag=random.choice(tags))
            
            # Download random media for some posts
            if random.choice([True, False]):
                img_path = os.path.join(media_dir, f'alumni_{i}.jpg')
                try:
                    urllib.request.urlretrieve("https://picsum.photos/800/400", img_path)
                    PostMedia.objects.create(post=post, media_type="IMAGE", file=f"posts/alumni_{i}.jpg")
                except:
                    pass

        self.stdout.write("Generating realistic STUDENT Posts...")
        student_titles = [
            ("Looking for Hackathon Teammates!", "GENERAL", "We need a frontend developer (React) for the upcoming Smart India Hackathon. Ping me!"),
            ("Which elective is better: AI or Cloud Computing?", "GENERAL", "I am confused for the 6th semester. Which one is more scoring and helpful for placements?"),
            ("Doubt in Dynamic Programming", "GENERAL", "Can someone explain the matrix chain multiplication problem? I am stuck."),
            ("Summer Internship search is exhausting", "GENERAL", "Applied to 50 companies, got 3 replies. Any seniors have tips on resume shortlisting?"),
        ]
        
        for i in range(20):
            author = random.choice(students)
            title, p_type, content = random.choice(student_titles)
            
            post = Post.objects.create(author=author, title=title, content=content, post_type=p_type)
            PostTag.objects.create(post=post, tag=random.choice(tags))

        self.stdout.write("Generating realistic PLACEMENT CELL Opportunities & Announcements...")
        placement_admin = placement_cells[0]
        
        # Opportunities
        opp_titles = [
            ("Goldman Sachs Summer Analyst 2027", "INTERNSHIP", "ON_SITE", "Goldman Sachs is visiting campus for Summer Analysts."),
            ("TCS Ninja & Digital Hiring", "PLACEMENT", "ON_SITE", "Mass recruitment drive for all branches. Prepare aptitude."),
            ("Amazon SDE-1 Off-Campus", "PLACEMENT", "REMOTE", "Off-campus drive link for Amazon. Open for 2024 batch."),
        ]
        for title, o_type, w_mode, desc in opp_titles:
            Opportunity.objects.create(
                company=random.choice(companies), posted_by=placement_admin, title=title, description=desc,
                opportunity_type=o_type, work_mode=w_mode, status="OPEN"
            )
            
        # Announcements
        ann_titles = [
            ("Mandatory Pre-Placement Talk: Morgan Stanley", "EVENT", "ALL", "Attendance is strictly mandatory for all final year students."),
            ("Resume Building Workshop by Alumni", "TRAINING", "STUDENTS", "Join us this Sunday to polish your resumes."),
            ("Final Deadline for Placement Registration", "GENERAL", "STUDENTS", "Submit your forms by Friday 5 PM or you will be debarred."),
        ]
        for title, a_type, aud, content in ann_titles:
            Announcement.objects.create(
                created_by=placement_admin, title=title, content=content, announcement_type=a_type, target_audience=aud, is_published=True
            )

        self.stdout.write("Generating realistic Comments and Likes...")
        all_posts = list(Post.objects.all())
        comments_texts = ["Great insights, thanks!", "Can you share more details?", "Interested!", "Check your DM.", "This is very helpful.", "I had a similar experience!"]
        
        for post in all_posts:
            # 2 to 6 comments per post
            for _ in range(random.randint(2, 6)):
                Comment.objects.create(post=post, author=random.choice(users), content=random.choice(comments_texts))
            # 5 to 20 likes per post
            likers = random.sample(users, random.randint(5, 20))
            for liker in likers:
                PostLike.objects.create(post=post, user=liker)

        self.stdout.write(self.style.SUCCESS("Successfully refreshed all community data with highly realistic content and media!"))
