from django.db import models

from apps.core.models import BaseAbstractWithUser


class Area(BaseAbstractWithUser):
    nombre = models.CharField(
        max_length=100,
        unique=True,
        verbose_name="nombre",
    )

    descripcion = models.TextField(
        blank=True,
        verbose_name="descripción",
    )

    activo = models.BooleanField(
        default=True,
        verbose_name="activo",
    )

    class Meta:
        verbose_name = "Área"
        verbose_name_plural = "Áreas"
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre


class Sector(BaseAbstractWithUser):
    area = models.ForeignKey(
        Area,
        on_delete=models.PROTECT,
        related_name="sectores",
        verbose_name="área",
    )

    nombre = models.CharField(
        max_length=100,
        verbose_name="nombre",
    )

    descripcion = models.TextField(
        blank=True,
        verbose_name="descripción",
    )

    activo = models.BooleanField(
        default=True,
        verbose_name="activo",
    )

    class Meta:
        verbose_name = "Sector"
        verbose_name_plural = "Sectores"
        ordering = [
            "area__nombre",
            "nombre",
        ]

        constraints = [
            models.UniqueConstraint(
                fields=["area", "nombre"],
                condition=models.Q(is_deleted=False),
                name="unique_sector_activo_por_area",
            )
        ]

    def __str__(self):
        return f"{self.area.nombre} - {self.nombre}"