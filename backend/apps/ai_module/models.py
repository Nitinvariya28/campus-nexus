from django.db import models


class VectorIndexState(models.Model):
    """
    Technical Table 31: Tracks Qdrant vector synchronization state for MySQL records.
    
    IMPORTANT DESIGN INVARIANT:
    `source_hash` and `indexed_hash` represent the SHA-256 hash of ONLY the meaningful
    vectorized content (technical skills, proficiencies, department, batch, semester, bio,
    and professional experience). Sensitive PII, personal names, profile photos, phone numbers,
    and passwords are NEVER included in the hash and NEVER vectorized.
    """
    SOURCE_TYPE_CHOICES = [
        ("PROFILE", "User Profile"),
        ("POST", "Community Post / Opportunity"),
    ]
    STATUS_CHOICES = [
        ("PENDING", "Pending Indexing"),
        ("SYNCED", "Synchronized"),
        ("FAILED", "Sync Failed"),
        ("DELETE_PENDING", "Pending Deletion"),
    ]

    source_type = models.CharField(
        max_length=20,
        choices=SOURCE_TYPE_CHOICES,
        db_index=True,
        help_text="Domain entity: PROFILE or POST"
    )
    source_id = models.BigIntegerField(
        db_index=True,
        help_text="Primary key of MySQL record (User.id or Post.id)"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="PENDING",
        db_index=True,
        help_text="Current vectorization lifecycle state"
    )
    source_hash = models.CharField(
        max_length=64,
        blank=True,
        null=True,
        help_text="SHA-256 hash of only vectorized content (skills, academics; strictly excludes PII/photos)"
    )
    indexed_hash = models.CharField(
        max_length=64,
        blank=True,
        null=True,
        help_text="SHA-256 hash of content currently vectorized in Qdrant"
    )
    embedding_model = models.CharField(
        max_length=100,
        default="all-MiniLM-L6-v2",
        help_text="Model version used for vector generation"
    )
    schema_version = models.PositiveSmallIntegerField(
        default=1,
        help_text="Version of chunking/payload schema"
    )
    chunk_count = models.PositiveSmallIntegerField(
        default=0,
        help_text="Number of Qdrant points active for this entity"
    )
    attempt_count = models.PositiveSmallIntegerField(
        default=0,
        help_text="Retry attempts for failed indexing"
    )
    last_error = models.TextField(
        blank=True,
        null=True,
        help_text="Error message/traceback if last sync failed"
    )
    requested_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp of last sync request"
    )
    synced_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="Timestamp of last successful Qdrant sync"
    )

    class Meta:
        db_table = "ai_vector_index_state"
        verbose_name = "Vector Index State"
        verbose_name_plural = "Vector Index States"
        constraints = [
            models.UniqueConstraint(
                fields=["source_type", "source_id"],
                name="unique_source_vector_state"
            )
        ]
        indexes = [
            models.Index(fields=["status", "requested_at"], name="idx_ai_state_status_req"),
        ]

    def __str__(self):
        return f"{self.source_type} #{self.source_id} [{self.status}]"
