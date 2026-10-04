from django.conf import settings
from django.db import models

class Report(models.Model):
    TARGET_TYPE_CHOICES = [
        ("POST", "Post"), ("COMMENT", "Comment"),
    ]
    REASON_CHOICES = [
        ("SPAM", "Spam"), ("INAPPROPRIATE", "Inappropriate"),
        ("HARASSMENT", "Harassment"), ("FALSE_INFORMATION", "False Information"),
        ("DUPLICATE", "Duplicate"), ("OTHER", "Other"),
    ]
    STATUS_CHOICES = [
        ("PENDING", "Pending"), ("UNDER_REVIEW", "Under Review"),
        ("RESOLVED", "Resolved"), ("REJECTED", "Rejected"),
    ]
    reported_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reports")
    target_type = models.CharField(max_length=20, choices=TARGET_TYPE_CHOICES)
    target_id = models.PositiveBigIntegerField()
    reason = models.CharField(max_length=30, choices=REASON_CHOICES)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDING")
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, blank=True, null=True, related_name="reviewed_reports")
    reviewed_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.target_type} - {self.target_id}"
