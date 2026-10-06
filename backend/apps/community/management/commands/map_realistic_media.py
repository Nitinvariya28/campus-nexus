import os
import random
from django.core.management.base import BaseCommand
from apps.community.models import Post, PostMedia

class Command(BaseCommand):
    help = "Replaces random picsum images with highly contextual AI-generated images."

    def handle(self, *args, **kwargs):
        self.stdout.write("Deleting old random PostMedia...")
        PostMedia.objects.all().delete()
        
        all_posts = Post.objects.all()
        for post in all_posts:
            # Randomly give ~70% of posts an image to make the feed highly visual
            if random.random() < 0.7:
                if post.post_type == "GENERAL":
                    # General student posts get the hackathon/study vibe
                    PostMedia.objects.create(post=post, media_type="IMAGE", file="posts/hackathon_coding.jpg")
                    
                elif post.post_type in ["COMPANY_INFO", "CAREER_ADVICE"]:
                    # Corporate posts get the office vibe
                    PostMedia.objects.create(post=post, media_type="IMAGE", file="posts/corporate_office.jpg")
                    
                elif post.post_type == "INTERVIEW_EXPERIENCE":
                    # Interviews get the interview room
                    PostMedia.objects.create(post=post, media_type="IMAGE", file="posts/interview_room.jpg")
                    
                else:
                    # Fallback for anything else (like placements)
                    PostMedia.objects.create(post=post, media_type="IMAGE", file="posts/placement_notice.jpg")
                
        self.stdout.write(self.style.SUCCESS(f"Successfully populated {PostMedia.objects.count()} highly contextual images across the posts!"))
