import logging
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth import get_user_model

from apps.profiles.models import StudentProfile, AlumniProfile
from apps.skills.models import UserSkill
from apps.ai_module.indexing.sync_service import (
    schedule_profile_sync,
    schedule_profile_deletion,
    schedule_profile_deactivation,
)

logger = logging.getLogger(__name__)

User = get_user_model()


@receiver(post_save, sender=User)
def on_user_post_save(sender, instance, created, **kwargs):
    """
    Handles User activation, deactivation, or role assignment.
    Ignores non-profile roles (ADMIN, PLACEMENT_CELL) and raw migrations.
    """
    if kwargs.get("raw", False):
        return

    if instance.role not in ("STUDENT", "ALUMNI"):
        return

    if not instance.is_active:
        logger.info(f"[Signal] User #{instance.id} is inactive. Scheduling soft-deactivation.")
        schedule_profile_deactivation(instance.id, role=instance.role)
    else:
        logger.info(f"[Signal] User #{instance.id} ({instance.role}) saved. Scheduling sync.")
        schedule_profile_sync(instance.id)


@receiver(post_delete, sender=User)
def on_user_post_delete(sender, instance, **kwargs):
    """Purges all vector points and metadata when a User is permanently deleted."""
    if instance.role in ("STUDENT", "ALUMNI"):
        logger.info(f"[Signal] User #{instance.id} deleted. Purging vectors.")
        schedule_profile_deletion(instance.id, role=instance.role)


@receiver(post_save, sender=StudentProfile)
def on_student_profile_post_save(sender, instance, created, **kwargs):
    """Synchronizes vector embeddings when a StudentProfile is created or modified."""
    if kwargs.get("raw", False):
        return
    logger.info(f"[Signal] StudentProfile for User #{instance.user_id} saved. Scheduling sync.")
    schedule_profile_sync(instance.user_id)


@receiver(post_delete, sender=StudentProfile)
def on_student_profile_post_delete(sender, instance, **kwargs):
    """Purges student vectors if the StudentProfile record is deleted."""
    logger.info(f"[Signal] StudentProfile for User #{instance.user_id} deleted. Purging vectors.")
    schedule_profile_deletion(instance.user_id, role="STUDENT")


@receiver(post_save, sender=AlumniProfile)
def on_alumni_profile_post_save(sender, instance, created, **kwargs):
    """Synchronizes vector embeddings when an AlumniProfile is created or modified."""
    if kwargs.get("raw", False):
        return
    logger.info(f"[Signal] AlumniProfile for User #{instance.user_id} saved. Scheduling sync.")
    schedule_profile_sync(instance.user_id)


@receiver(post_delete, sender=AlumniProfile)
def on_alumni_profile_post_delete(sender, instance, **kwargs):
    """Purges alumni vectors if the AlumniProfile record is deleted."""
    logger.info(f"[Signal] AlumniProfile for User #{instance.user_id} deleted. Purging vectors.")
    schedule_profile_deletion(instance.user_id, role="ALUMNI")


@receiver(post_save, sender=UserSkill)
def on_user_skill_post_save(sender, instance, created, **kwargs):
    """Re-chunks and updates vectors when a skill is added or proficiency is updated."""
    if kwargs.get("raw", False):
        return
    logger.info(f"[Signal] UserSkill saved for User #{instance.user_id}. Scheduling sync.")
    schedule_profile_sync(instance.user_id)


@receiver(post_delete, sender=UserSkill)
def on_user_skill_post_delete(sender, instance, **kwargs):
    """Re-chunks and updates vectors when a skill is removed."""
    logger.info(f"[Signal] UserSkill removed for User #{instance.user_id}. Scheduling sync.")
    schedule_profile_sync(instance.user_id)
