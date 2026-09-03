from django.conf import settings
from django.db import models
from django.utils import timezone


class BaseAbstractWithUser(models.Model):
    """
    Clase base abstracta para modelos auditables.

    Incluye:
    - created_at
    - updated_at
    - deleted_at
    - is_deleted
    - user_made
    - user_updated
    - user_deleted
    """

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="fecha de creación",
        null=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="fecha de actualización",
        null=True,
    )

    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="fecha de eliminación",
    )

    is_deleted = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="eliminado",
        null=True,
    )

    user_made = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="%(app_label)s_%(class)s_created",
        verbose_name="creado por", 
    )

    user_updated = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="%(app_label)s_%(class)s_updated",
        verbose_name="actualizado por",
    )

    user_deleted = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="%(app_label)s_%(class)s_deleted",
        verbose_name="eliminado por",
    )

    class Meta:
        abstract = True

    def delete(self, using=None, keep_parents=False, user=None):
        """
        Eliminación lógica.
        """
        self.is_deleted = True
        self.deleted_at = timezone.now()

        if user is not None:
            self.user_deleted = user

        self.save(
            using=using,
            update_fields=[
                "is_deleted",
                "deleted_at",
                "user_deleted",
                "updated_at",
            ],
        )

    def restore(self, user=None):
        """
        Restaura un registro eliminado lógicamente.
        """
        self.is_deleted = False
        self.deleted_at = None
        self.user_deleted = None

        if user is not None:
            self.user_updated = user

        self.save(
            update_fields=[
                "is_deleted",
                "deleted_at",
                "user_deleted",
                "user_updated",
                "updated_at",
            ],
        )

    def hard_delete(self, using=None, keep_parents=False):
        """
        Eliminación física real.
        Usar solo cuando realmente corresponda.
        """
        return super().delete(
            using=using,
            keep_parents=keep_parents,
        )