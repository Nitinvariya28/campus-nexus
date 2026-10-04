from django.conf import settings
from django.db import models

class Announcement(models.Model):
    ANNOUNCEMENT_TYPE_CHOICES = [
        ("PLACEMENT", "Placement"),
        ("INTERNSHIP", "Internship"),
        ("TRAINING", "Training"),
        ("EVENT", "Event"),
        ("DOCUMENT", "Document"),
        ("GENERAL", "General"),
    ]
    AUDIENCE_CHOICES = [
        ("ALL", "All"),
        ("STUDENTS", "Students"),
        ("ALUMNI", "Alumni"),
        ("PLACEMENT_CELL", "Placement Cell"),
    ]
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="announcements")
    title = models.CharField(max_length=250)
    content = models.TextField()
    announcement_type = models.CharField(max_length=20, choices=ANNOUNCEMENT_TYPE_CHOICES)
    target_audience = models.CharField(max_length=20, choices=AUDIENCE_CHOICES)
    deadline = models.DateTimeField(blank=True, null=True)
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
