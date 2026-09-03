from django.db import models

from apps.core.models import BaseAbstractWithUser

from apps.inventario.models import (
    Activo,
    Componente,
    EquipoTrabajo,
    EstadoActivo,
    EstadoComponente,
)

from apps.estructura.models import Sector


# ============================================================
# MOVIMIENTOS DE COMPONENTES
# ============================================================


class TipoMovimientoComponente(models.TextChoices):
    INSTALACION = (
        "INSTALACION",
        "Instalación en activo",
    )

    CAMBIO_ESTADO = (
        "CAMBIO_ESTADO",
        "Cambio de estado",
    )

    RETIRO_STOCK = (
        "RETIRO_STOCK",
        "Retiro a stock",
    )

    ENVIO_REPARACION = (
        "ENVIO_REPARACION",
        "Envío a reparación",
    )

    RETORNO_REPARACION = (
        "RETORNO_REPARACION",
        "Retorno de reparación",
    )

    BAJA = (
        "BAJA",
        "Baja definitiva",
    )


class UbicacionComponente(models.TextChoices):
    ACTIVO = (
        "ACTIVO",
        "Instalado en activo",
    )

    STOCK = (
        "STOCK",
        "Stock de Sistemas",
    )

    REPARACION = (
        "REPARACION",
        "En reparación",
    )

    BAJA = (
        "BAJA",
        "Baja definitiva",
    )


class MovimientoComponente(
    BaseAbstractWithUser
):
    componente = models.ForeignKey(
        Componente,
        on_delete=models.PROTECT,
        related_name="movimientos",
        verbose_name="componente",
    )

    tipo_movimiento = models.CharField(
        max_length=30,
        choices=TipoMovimientoComponente.choices,
        db_index=True,
        verbose_name="tipo de movimiento",
    )

    # --------------------------------------------------------
    # UBICACIÓN ANTERIOR
    # --------------------------------------------------------

    ubicacion_origen = models.CharField(
        max_length=20,
        choices=UbicacionComponente.choices,
        verbose_name="ubicación origen",
    )

    activo_origen = models.ForeignKey(
        Activo,
        on_delete=models.PROTECT,
        related_name="movimientos_componentes_salida",
        blank=True,
        null=True,
        verbose_name="activo origen",
    )

    # --------------------------------------------------------
    # UBICACIÓN NUEVA
    # --------------------------------------------------------

    ubicacion_destino = models.CharField(
        max_length=20,
        choices=UbicacionComponente.choices,
        verbose_name="ubicación destino",
    )

    activo_destino = models.ForeignKey(
        Activo,
        on_delete=models.PROTECT,
        related_name="movimientos_componentes_entrada",
        blank=True,
        null=True,
        verbose_name="activo destino",
    )

    # --------------------------------------------------------
    # ESTADOS
    # --------------------------------------------------------

    estado_anterior = models.CharField(
        max_length=20,
        choices=EstadoComponente.choices,
        verbose_name="estado anterior",
    )

    estado_nuevo = models.CharField(
        max_length=20,
        choices=EstadoComponente.choices,
        verbose_name="estado nuevo",
    )

    # --------------------------------------------------------
    # INFORMACIÓN ADICIONAL
    # --------------------------------------------------------

    observaciones = models.TextField(
        blank=True,
        verbose_name="observaciones",
    )

    class Meta:
        verbose_name = (
            "Movimiento de componente"
        )

        verbose_name_plural = (
            "Movimientos de componentes"
        )

        ordering = [
            "-created_at",
            "-id",
        ]

        indexes = [
            models.Index(
                fields=[
                    "componente",
                    "created_at",
                ],
                name="idx_mov_comp_fecha",
            ),

            models.Index(
                fields=[
                    "tipo_movimiento",
                ],
                name="idx_mov_comp_tipo",
            ),
        ]

    def __str__(self):
        return (
            f"{self.componente} - "
            f"{self.get_tipo_movimiento_display()}"
        )


# ============================================================
# MOVIMIENTOS DE ACTIVOS
# ============================================================


class TipoMovimientoActivo(models.TextChoices):
    ASIGNACION = (
        "ASIGNACION",
        "Asignación a equipo",
    )

    TRASLADO = (
        "TRASLADO",
        "Traslado",
    )

    RETIRO_STOCK = (
        "RETIRO_STOCK",
        "Retiro a stock",
    )

    SALIDA_STOCK = (
        "SALIDA_STOCK",
        "Salida de stock",
    )

    CAMBIO_ESTADO = (
        "CAMBIO_ESTADO",
        "Cambio de estado",
    )
    ACTUALIZACION_CONFIGURACION = (
        "ACTUALIZACION_CONFIGURACION",
        "Actualización de configuración",
    )

    ENVIO_REPARACION = (
        "ENVIO_REPARACION",
        "Envío a reparación",
    )

    RETORNO_REPARACION = (
        "RETORNO_REPARACION",
        "Retorno de reparación",
    )

    BAJA = (
        "BAJA",
        "Baja definitiva",
    )


class UbicacionActivo(models.TextChoices):
    EQUIPO_TRABAJO = (
        "EQUIPO_TRABAJO",
        "Equipo de trabajo",
    )

    STOCK = (
        "STOCK",
        "Stock de Sistemas",
    )

    REPARACION = (
        "REPARACION",
        "En reparación",
    )

    BAJA = (
        "BAJA",
        "Baja definitiva",
    )


class MovimientoActivo(
    BaseAbstractWithUser
):
    activo = models.ForeignKey(
        Activo,
        on_delete=models.PROTECT,
        related_name="movimientos",
        verbose_name="activo",
    )

    tipo_movimiento = models.CharField(
        max_length=30,
        choices=TipoMovimientoActivo.choices,
        db_index=True,
        verbose_name="tipo de movimiento",
    )

    # --------------------------------------------------------
    # UBICACIÓN ANTERIOR
    # --------------------------------------------------------

    ubicacion_origen = models.CharField(
        max_length=20,
        choices=UbicacionActivo.choices,
        verbose_name="ubicación origen",
    )

    sector_origen = models.ForeignKey(
        Sector,
        on_delete=models.PROTECT,
        related_name="+",
        blank=True,
        null=True,
        verbose_name="sector origen",
    )

    equipo_origen = models.ForeignKey(
        EquipoTrabajo,
        on_delete=models.PROTECT,
        related_name="movimientos_activos_salida",
        blank=True,
        null=True,
        verbose_name="equipo origen",
    )

    # --------------------------------------------------------
    # UBICACIÓN NUEVA
    # --------------------------------------------------------

    ubicacion_destino = models.CharField(
        max_length=20,
        choices=UbicacionActivo.choices,
        verbose_name="ubicación destino",
    )

    sector_destino = models.ForeignKey(
        Sector,
        on_delete=models.PROTECT,
        related_name="+",
        blank=True,
        null=True,
        verbose_name="sector destino",
    )

    equipo_destino = models.ForeignKey(
        EquipoTrabajo,
        on_delete=models.PROTECT,
        related_name="movimientos_activos_entrada",
        blank=True,
        null=True,
        verbose_name="equipo destino",
    )

    # --------------------------------------------------------
    # ESTADOS
    # --------------------------------------------------------

    estado_anterior = models.CharField(
        max_length=20,
        choices=EstadoActivo.choices,
        verbose_name="estado anterior",
    )

    estado_nuevo = models.CharField(
        max_length=20,
        choices=EstadoActivo.choices,
        verbose_name="estado nuevo",
    )

    # --------------------------------------------------------
    # INFORMACIÓN ADICIONAL
    # --------------------------------------------------------

    observaciones = models.TextField(
        blank=True,
        verbose_name="observaciones",
    )

    class Meta:
        verbose_name = (
            "Movimiento de activo"
        )

        verbose_name_plural = (
            "Movimientos de activos"
        )

        ordering = [
            "-created_at",
            "-id",
        ]

        indexes = [
            models.Index(
                fields=[
                    "activo",
                    "created_at",
                ],
                name="idx_mov_act_fecha",
            ),

            models.Index(
                fields=[
                    "tipo_movimiento",
                ],
                name="idx_mov_act_tipo",
            ),
        ]

    def __str__(self):
        return (
            f"{self.activo} - "
            f"{self.get_tipo_movimiento_display()}"
        )