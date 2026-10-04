from django.conf import settings
from django.db import models

class ResourceCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=255, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Resource(models.Model):
    VISIBILITY_CHOICES = [
        ("ALL", "All Users"), ("STUDENTS", "Students"),
        ("ALUMNI", "Alumni"), ("PLACEMENT_CELL", "Placement Cell"),
    ]
    category = models.ForeignKey(ResourceCategory, on_delete=models.PROTECT, related_name="resources")
    title = models.CharField(max_length=250)
    description = models.TextField(blank=True, null=True)
    file = models.CharField(max_length=500, blank=True, null=True)
    external_url = models.CharField(max_length=500, blank=True, null=True)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="resources")
    visibility = models.CharField(max_length=30, choices=VISIBILITY_CHOICES, default="ALL")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.CheckConstraint(condition=(models.Q(file__isnull=False) | models.Q(external_url__isnull=False)), name="resource_file_or_external_url"),
        ]

    def __str__(self):
        return self.title
