from django.conf import settings
from django.db import models

class Notification(models.Model):
    NOTIFICATION_TYPE_CHOICES = [
        ("POST_LIKE", "Post Like"), ("POST_COMMENT", "Post Comment"),
        ("NEW_ANNOUNCEMENT", "New Announcement"), ("NEW_OPPORTUNITY", "New Opportunity"),
        ("REPORT_UPDATE", "Report Update"), ("SYSTEM", "System"),
    ]
    REFERENCE_TYPE_CHOICES = [
        ("POST", "Post"), ("COMMENT", "Comment"),
        ("ANNOUNCEMENT", "Announcement"), ("OPPORTUNITY", "Opportunity"),
        ("REPORT", "Report"), ("NONE", "None"),
    ]
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPE_CHOICES)
    title = models.CharField(max_length=250)
    message = models.CharField(max_length=500)
    reference_type = models.CharField(max_length=30, choices=REFERENCE_TYPE_CHOICES, blank=True, null=True)
    reference_id = models.PositiveBigIntegerField(blank=True, null=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["recipient", "is_read"]),
            models.Index(fields=["recipient", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.recipient.email} - {self.title}"
