from django.core.validators import RegexValidator
from django.db import models

class UniversityIdentity(models.Model):
    UNIVERSITY_EMAIL_VALIDATOR = RegexValidator(
        regex=r"^\d{2}(bce|bec|bme|bam|bch|bee|bcv)\d{3}@nirmauni\.ac\.in$",
        message="Enter a valid university email address."
    )
    full_name = models.CharField(max_length=150)
    date_of_birth = models.DateField()
    university_email = models.EmailField(unique=True, validators=[UNIVERSITY_EMAIL_VALIDATOR])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.university_email

class Department(models.Model):
    name = models.CharField(max_length=150, unique=True)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.code})"

class Batch(models.Model):
    start_year = models.PositiveSmallIntegerField()
    end_year = models.PositiveSmallIntegerField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["start_year", "end_year"], name="unique_batch_period"),
            models.CheckConstraint(condition=models.Q(end_year__gt=models.F("start_year")), name="batch_end_year_after_start_year"),
        ]

    def __str__(self):
        return f"{self.start_year}-{self.end_year}"
