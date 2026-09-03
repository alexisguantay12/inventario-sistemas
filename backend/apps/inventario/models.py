from django.core.exceptions import ValidationError
from django.db import models

from apps.core.models import BaseAbstractWithUser
from apps.estructura.models import Sector


class EstadoEquipoTrabajo(models.TextChoices):
    ACTIVO = "ACTIVO", "Activo"
    INACTIVO = "INACTIVO", "Inactivo"


class EstadoActivo(models.TextChoices):
    EN_USO = "EN_USO", "En uso"
    DISPONIBLE = "DISPONIBLE", "Disponible"
    RESERVADO = "RESERVADO", "Reservado"
    EN_REPARACION = "EN_REPARACION", "En reparación"
    DEFECTUOSO = "DEFECTUOSO", "Defectuoso"
    BAJA = "BAJA", "Dado de baja"


class EstadoComponente(models.TextChoices):
    INSTALADO = "INSTALADO", "Instalado"
    DISPONIBLE = "DISPONIBLE", "Disponible"
    RESERVADO = "RESERVADO", "Reservado"
    EN_REPARACION = "EN_REPARACION", "En reparación"
    DEFECTUOSO = "DEFECTUOSO", "Defectuoso"
    BAJA = "BAJA", "Dado de baja"


class EquipoTrabajo(BaseAbstractWithUser):
    sector = models.ForeignKey(
        Sector,
        on_delete=models.PROTECT,
        related_name="equipos_trabajo",
        verbose_name="sector",
    )

    nombre = models.CharField(
        max_length=150,
        verbose_name="nombre",
        help_text="Ej.: Equipo de Facturación Nacionales.",
    )

    uso_actual = models.CharField(
        max_length=150,
        blank=True,
        verbose_name="uso actual",
        help_text="Referencia libre. Ej.: Melisa Rufino.",
    )

    foto = models.ImageField(
        upload_to="equipos_trabajo/",
        blank=True,
        null=True,
        verbose_name="foto",
        help_text="Una única foto identificatoria del equipo de trabajo.",
    )

    estado = models.CharField(
        max_length=20,
        choices=EstadoEquipoTrabajo.choices,
        default=EstadoEquipoTrabajo.ACTIVO,
        db_index=True,
        verbose_name="estado",
    )

    observaciones = models.TextField(
        blank=True,
        verbose_name="observaciones",
    )

    class Meta:
        verbose_name = "Equipo de trabajo"
        verbose_name_plural = "Equipos de trabajo"

        ordering = [
            "sector__area__nombre",
            "sector__nombre",
            "nombre",
        ]

        constraints = [
            models.UniqueConstraint(
                fields=["sector", "nombre"],
                condition=models.Q(is_deleted=False),
                name="unique_equipo_trabajo_activo_por_sector",
            )
        ]

        indexes = [
            models.Index(
                fields=["estado"],
                name="idx_equipo_estado",
            ),
            models.Index(
                fields=["sector"],
                name="idx_equipo_sector",
            ),
        ]

    def __str__(self):
        return self.nombre


class SistemaOperativo(BaseAbstractWithUser):
    nombre = models.CharField(
        max_length=100,
        verbose_name="nombre",
    )

    activo = models.BooleanField(
        default=True,
        verbose_name="activo",
    )

    class Meta:
        verbose_name = "Sistema operativo"
        verbose_name_plural = "Sistemas operativos"
        ordering = ["nombre"]

        constraints = [
            models.UniqueConstraint(
                fields=["nombre"],
                condition=models.Q(
                    is_deleted=False
                ),
                name="unique_sistema_operativo_no_eliminado",
            )
        ]

    def __str__(self):
        return self.nombre



class TipoActivo(BaseAbstractWithUser):
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
    prefijo = models.CharField(
        max_length=5,
        null=True,
        verbose_name="prefijo",
        help_text="Prefijo para generar el código de inventario. Ej.: CPU, MON, TEC.",
    )
    tiene_sistema_operativo = models.BooleanField(
        default=False,
        verbose_name="tiene sistema operativo",
        help_text=(
            "Indica si los activos de este tipo pueden "
            "tener sistema operativo. "
            "Ej.: CPU, notebook o servidor."
        ),
    )

    class Meta:
        verbose_name = "Tipo de activo"
        verbose_name_plural = "Tipos de activo"
        ordering = ["nombre"]

        constraints = [
            models.UniqueConstraint(
                fields=["nombre"],
                condition=models.Q(is_deleted=False),
                name="unique_tipo_activo_no_eliminado",
            ),
            models.UniqueConstraint(
                fields=["prefijo"],
                condition=models.Q(is_deleted=False),
                name="unique_prefijo_tipo_activo_no_eliminado",
            ),
        ]

    def __str__(self):
        return self.nombre


class Activo(BaseAbstractWithUser):
    codigo_inventario = models.CharField(
        max_length=50,
        verbose_name="código de inventario",
        help_text="Ej.: CPU-0034, MON-0041, TEC-0078.",
    )

    tipo_activo = models.ForeignKey(
        TipoActivo,
        on_delete=models.PROTECT,
        related_name="activos",
        verbose_name="tipo de activo",
    )

    sector = models.ForeignKey(
        Sector,
        on_delete=models.PROTECT,
        related_name="activos",
        blank=True,
        null=True,
        verbose_name="sector",
    )

    equipo_trabajo = models.ForeignKey(
        EquipoTrabajo,
        on_delete=models.SET_NULL,
        related_name="activos",
        blank=True,
        null=True,
        verbose_name="equipo de trabajo",
    )
    sistema_operativo = models.ForeignKey(
        SistemaOperativo,
        on_delete=models.SET_NULL,
        related_name="activos",
        blank=True,
        null=True,
        verbose_name="sistema operativo",
    )

    marca = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="marca",
    )

    modelo = models.CharField(
        max_length=150,
        blank=True,
        verbose_name="modelo",
    )

    numero_serie = models.CharField(
        max_length=150,
        blank=True,
        verbose_name="número de serie",
    )

    hostname = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="hostname",
        help_text="Principalmente para CPU, notebook o servidor.",
    )

    fecha_adquisicion = models.DateField(
        blank=True,
        null=True,
        verbose_name="fecha de adquisición",
    )

    estado = models.CharField(
        max_length=20,
        choices=EstadoActivo.choices,
        default=EstadoActivo.EN_USO,
        db_index=True,
        verbose_name="estado",
    )

    observaciones = models.TextField(
        blank=True,
        verbose_name="observaciones",
    )

    class Meta:
        verbose_name = "Activo"
        verbose_name_plural = "Activos"
        ordering = ["codigo_inventario"]

        constraints = [
            models.UniqueConstraint(
                fields=["codigo_inventario"],
                condition=models.Q(is_deleted=False),
                name="unique_codigo_activo_no_eliminado",
            )
        ]

        indexes = [
            models.Index(
                fields=["codigo_inventario"],
                name="idx_activo_codigo",
            ),
            models.Index(
                fields=["hostname"],
                name="idx_activo_hostname",
            ),
            models.Index(
                fields=["estado"],
                name="idx_activo_estado",
            ),
            models.Index(
                fields=["sector"],
                name="idx_activo_sector",
            ),
            models.Index(
                fields=["equipo_trabajo"],
                name="idx_activo_equipo",
            ),
        ]
    def clean(self):
        super().clean()

        if self.equipo_trabajo:
            if not self.sector:
                raise ValidationError(
                    {
                        "sector": (
                            "Un activo asociado a un equipo de trabajo "
                            "debe tener sector."
                        )
                    }
                )

            if (
                self.equipo_trabajo.sector_id
                != self.sector_id
            ):
                raise ValidationError(
                    {
                        "equipo_trabajo": (
                            "El equipo de trabajo seleccionado "
                            "pertenece a un sector diferente al activo."
                        )
                    }
                )
        if (
            self.sistema_operativo
            and self.tipo_activo_id
            and not self.tipo_activo.tiene_sistema_operativo
        ):
            raise ValidationError(
                {
                    "sistema_operativo": (
                        "Este tipo de activo no admite "
                        "sistema operativo."
                    )
                }
            )

    def __str__(self):
        if self.hostname:
            return f"{self.codigo_inventario} - {self.hostname}"

        return self.codigo_inventario


class TipoComponente(BaseAbstractWithUser):
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

    tipos_activo_permitidos = models.ManyToManyField(
        TipoActivo,
        related_name="tipos_componentes_permitidos",
        blank=True,
        verbose_name="tipos de activo permitidos",
        help_text=(
            "Tipos de activo donde este componente puede instalarse. "
            "Ej.: RAM puede utilizarse en CPU, Notebook y Servidor."
        ),
    )
    tiene_capacidad = models.BooleanField(
        default=False,
        verbose_name="tiene capacidad",
        help_text=(
            "Indica si este tipo de componente utiliza "
            "valor y unidad de capacidad. "
            "Ej.: RAM, SSD o HDD."
        ),
    )

    class Meta:
        verbose_name = "Tipo de componente"
        verbose_name_plural = "Tipos de componente"
        ordering = ["nombre"]

        constraints = [
            models.UniqueConstraint(
                fields=["nombre"],
                condition=models.Q(is_deleted=False),
                name="unique_tipo_componente_no_eliminado",
            )
        ]

    def __str__(self):
        return self.nombre







class UnidadCapacidad(models.TextChoices):
    MB = "MB", "MB"
    GB = "GB", "GB"
    TB = "TB", "TB"


class Componente(BaseAbstractWithUser):
    tipo_componente = models.ForeignKey(
        TipoComponente,
        on_delete=models.PROTECT,
        related_name="componentes",
        verbose_name="tipo de componente",
    )

    activo = models.ForeignKey(
        Activo,
        on_delete=models.SET_NULL,
        related_name="componentes",
        blank=True,
        null=True,
        verbose_name="activo instalado",
        help_text="Activo en el que está instalado actualmente.",
    )

    marca = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="marca",
    )

    modelo = models.CharField(
        max_length=150,
        blank=True,
        verbose_name="modelo",
    )

    numero_serie = models.CharField(
        max_length=150,
        blank=True,
        verbose_name="número de serie",
    )

    capacidad_valor = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name="capacidad",
        help_text="Ej.: 8, 16, 256, 500, 1.",
    )

    capacidad_unidad = models.CharField(
        max_length=5,
        choices=UnidadCapacidad.choices,
        blank=True,
        verbose_name="unidad",
        help_text="Ej.: GB o TB.",
    )

    estado = models.CharField(
        max_length=20,
        choices=EstadoComponente.choices,
        default=EstadoComponente.DISPONIBLE,
        db_index=True,
        verbose_name="estado",
    )

    fecha_adquisicion = models.DateField(
        blank=True,
        null=True,
        verbose_name="fecha de adquisición",
    )

    observaciones = models.TextField(
        blank=True,
        verbose_name="observaciones",
    )

    class Meta:
        verbose_name = "Componente"
        verbose_name_plural = "Componentes"

        ordering = [
            "tipo_componente__nombre",
            "marca",
            "modelo",
        ]

        indexes = [
            models.Index(
                fields=["estado"],
                name="idx_componente_estado",
            ),
            models.Index(
                fields=["activo"],
                name="idx_componente_activo",
            ),
            models.Index(
                fields=["tipo_componente"],
                name="idx_componente_tipo",
            ),
        ]

    def clean(self):
        super().clean()

        # --------------------------------------------------------
        # INSTALADO NECESITA ACTIVO
        # --------------------------------------------------------

        if (
            self.estado == EstadoComponente.INSTALADO
            and not self.activo
        ):
            raise ValidationError(
                {
                    "activo": (
                        "Un componente con estado 'Instalado' "
                        "debe estar asociado a un activo."
                    )
                }
            )

        # --------------------------------------------------------
        # ESTADOS PERMITIDOS MIENTRAS SIGUE EN EL ACTIVO
        # --------------------------------------------------------

        estados_permitidos_con_activo = [
            EstadoComponente.INSTALADO,
            EstadoComponente.DEFECTUOSO,
        ]

        if (
            self.activo
            and self.estado not in estados_permitidos_con_activo
        ):
            raise ValidationError(
                {
                    "estado": (
                        "Un componente asociado a un activo "
                        "solo puede estar en estado "
                        "'Instalado' o 'Defectuoso'."
                    )
                }
            )

        # --------------------------------------------------------
        # COMPATIBILIDAD CON EL TIPO DE ACTIVO
        # --------------------------------------------------------

        if (
            self.activo_id
            and self.tipo_componente_id
        ):
            permitido = (
                self.tipo_componente
                .tipos_activo_permitidos
                .filter(
                    pk=self.activo.tipo_activo_id
                )
                .exists()
            )

            if not permitido:
                raise ValidationError(
                    {
                        "tipo_componente": (
                            f"{self.tipo_componente} "
                            f"no está permitido para activos "
                            f"de tipo {self.activo.tipo_activo}."
                        )
                    }
                )

        # --------------------------------------------------------
        # CAPACIDAD
        # --------------------------------------------------------

        if self.tipo_componente_id:

            if (
                not self.tipo_componente.tiene_capacidad
                and (
                    self.capacidad_valor is not None
                    or self.capacidad_unidad
                )
            ):
                raise ValidationError(
                    {
                        "capacidad_valor": (
                            "Este tipo de componente "
                            "no utiliza capacidad."
                        )
                    }
                )

    def __str__(self):
        partes = [self.tipo_componente.nombre]

        if self.marca:
            partes.append(self.marca)

        if self.modelo:
            partes.append(self.modelo)

        if self.capacidad_valor is not None:
            capacidad = f"{self.capacidad_valor}"

            if self.capacidad_unidad:
                capacidad += f" {self.capacidad_unidad}"

            partes.append(capacidad)

        return " - ".join(partes)


