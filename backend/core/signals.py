# core/signals.py
"""
Django signals for the School MIS.
Post-save hooks for fee payments, attendance alerts, etc.
"""

import logging
from django.db.models.signals import post_save
from django.dispatch import receiver

logger = logging.getLogger(__name__)


@receiver(post_save, sender="core.Payment")
def on_payment_saved(sender, instance, created, **kwargs):
    """Log confirmed payments and trigger invoice status update."""
    if created and instance.confirmed:
        logger.info(
            "Payment confirmed: KES %.2f for %s via %s (ref: %s)",
            instance.amount,
            instance.invoice.student.admission_number,
            instance.payment_method,
            instance.transaction_reference,
        )


@receiver(post_save, sender="core.ExamResult")
def on_result_saved(sender, instance, created, **kwargs):
    """Log newly entered exam results."""
    if created:
        logger.debug(
            "Result entered: %s | %s | %s → %s (%s)",
            instance.student.admission_number,
            instance.exam.name,
            instance.subject.name,
            instance.marks,
            instance.grade,
        )