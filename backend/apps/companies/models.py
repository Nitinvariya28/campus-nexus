from django.db import models

class Company(models.Model):
    COMPANY_SIZE_CHOICES = [
        ("STARTUP", "Startup"), ("SMALL", "Small"),
        ("MEDIUM", "Medium"), ("LARGE", "Large"), ("ENTERPRISE", "Enterprise"),
    ]
    COMPANY_TIER_CHOICES = [
        ("SUPER_DREAM", "Super Dream (Tier 1)"),
        ("DREAM", "Dream (Tier 2)"),
        ("REGULAR", "Regular / Mass Recruiter"),
        ("UNICORN", "Unicorn Startup"),
        ("CORE", "Core Engineering"),
        ("GOVT_PSU", "Government / PSU"),
        ("OTHER", "Other"),
    ]
    name = models.CharField(max_length=200, unique=True)
    website = models.CharField(max_length=500, blank=True, null=True)
    industry = models.CharField(max_length=150, blank=True, null=True)
    company_size = models.CharField(max_length=20, choices=COMPANY_SIZE_CHOICES, blank=True, null=True)
    company_tier = models.CharField(max_length=30, choices=COMPANY_TIER_CHOICES, null=True, blank=True, db_index=True)
    description = models.TextField(blank=True, null=True)
    headquarters = models.CharField(max_length=200, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class CompanyRole(models.Model):
    ROLE_CATEGORY_CHOICES = [
        ("SOFTWARE", "Software"), ("DATA", "Data"),
        ("AI_ML", "AI/ML"), ("DEVOPS_CLOUD", "DevOps/Cloud"),
        ("SECURITY", "Security"), ("PRODUCT", "Product"),
        ("DESIGN", "Design"), ("OTHER", "Other"),
    ]
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="roles")
    role_name = models.CharField(max_length=150)
    role_category = models.CharField(max_length=20, choices=ROLE_CATEGORY_CHOICES)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["company", "role_name"], name="unique_company_role")]

    def __str__(self):
        return f"{self.company.name} - {self.role_name}"
