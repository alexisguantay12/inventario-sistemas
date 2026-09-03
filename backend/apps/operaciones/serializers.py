from rest_framework import serializers

from .models import (
    MovimientoActivo,
    MovimientoComponente,
    Componente
)


# ============================================================
# INPUT DE OPERACIONES
# ============================================================


class ObservacionOperacionSerializer(
    serializers.Serializer
):
    observaciones = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
    )


class InstalarComponenteSerializer(
    serializers.Serializer
):
    activo_id = serializers.IntegerField(
        min_value=1,
    )

    observaciones = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
    )


# ============================================================
# HISTORIAL DE COMPONENTES
# ============================================================


class MovimientoComponenteSerializer(
    serializers.ModelSerializer
):
    componente_nombre = serializers.CharField(
        source="componente.__str__",
        read_only=True,
    )

    tipo_movimiento_nombre = (
        serializers.CharField(
            source="get_tipo_movimiento_display",
            read_only=True,
        )
    )

    ubicacion_origen_nombre = (
        serializers.CharField(
            source="get_ubicacion_origen_display",
            read_only=True,
        )
    )

    ubicacion_destino_nombre = (
        serializers.CharField(
            source="get_ubicacion_destino_display",
            read_only=True,
        )
    )

    activo_origen_codigo = serializers.CharField(
        source="activo_origen.codigo_inventario",
        read_only=True,
        allow_null=True,
    )

    activo_destino_codigo = serializers.CharField(
        source="activo_destino.codigo_inventario",
        read_only=True,
        allow_null=True,
    )

    usuario_nombre = serializers.SerializerMethodField()


    class Meta:
        model = MovimientoComponente

        fields = [
            "id",

            "componente",
            "componente_nombre",

            "tipo_movimiento",
            "tipo_movimiento_nombre",

            "ubicacion_origen",
            "ubicacion_origen_nombre",

            "activo_origen",
            "activo_origen_codigo",

            "ubicacion_destino",
            "ubicacion_destino_nombre",

            "activo_destino",
            "activo_destino_codigo",

            "estado_anterior",
            "estado_nuevo",

            "observaciones",

            "usuario_nombre",

            "created_at",
        ]

        read_only_fields = fields


    def get_usuario_nombre(
        self,
        obj,
    ):
        user = getattr(
            obj,
            "user_made",
            None,
        )

        if not user:
            return None

        get_full_name = getattr(
            user,
            "get_full_name",
            None,
        )

        if callable(get_full_name):
            nombre = (
                get_full_name() or ""
            ).strip()

            if nombre:
                return nombre

        return getattr(
            user,
            "username",
            str(user),
        )


# ============================================================
# HISTORIAL DE ACTIVOS
# ============================================================


class MovimientoActivoSerializer(
    serializers.ModelSerializer
):
    activo_codigo = serializers.CharField(
        source="activo.codigo_inventario",
        read_only=True,
    )

    tipo_movimiento_nombre = (
        serializers.CharField(
            source="get_tipo_movimiento_display",
            read_only=True,
        )
    )

    ubicacion_origen_nombre = (
        serializers.CharField(
            source="get_ubicacion_origen_display",
            read_only=True,
        )
    )

    ubicacion_destino_nombre = (
        serializers.CharField(
            source="get_ubicacion_destino_display",
            read_only=True,
        )
    )

    sector_origen_nombre = serializers.CharField(
        source="sector_origen.nombre",
        read_only=True,
        allow_null=True,
    )

    sector_destino_nombre = serializers.CharField(
        source="sector_destino.nombre",
        read_only=True,
        allow_null=True,
    )

    equipo_origen_nombre = serializers.CharField(
        source="equipo_origen.nombre",
        read_only=True,
        allow_null=True,
    )

    equipo_destino_nombre = serializers.CharField(
        source="equipo_destino.nombre",
        read_only=True,
        allow_null=True,
    )

    usuario_nombre = serializers.SerializerMethodField()


    class Meta:
        model = MovimientoActivo

        fields = [
            "id",

            "activo",
            "activo_codigo",

            "tipo_movimiento",
            "tipo_movimiento_nombre",

            "ubicacion_origen",
            "ubicacion_origen_nombre",

            "sector_origen",
            "sector_origen_nombre",

            "equipo_origen",
            "equipo_origen_nombre",

            "ubicacion_destino",
            "ubicacion_destino_nombre",

            "sector_destino",
            "sector_destino_nombre",

            "equipo_destino",
            "equipo_destino_nombre",

            "estado_anterior",
            "estado_nuevo",

            "observaciones",

            "usuario_nombre",

            "created_at",
        ]

        read_only_fields = fields


    def get_usuario_nombre(
        self,
        obj,
    ):
        user = getattr(
            obj,
            "user_made",
            None,
        )

        if not user:
            return None

        get_full_name = getattr(
            user,
            "get_full_name",
            None,
        )

        if callable(get_full_name):
            nombre = (
                get_full_name() or ""
            ).strip()

            if nombre:
                return nombre

        return getattr(
            user,
            "username",
            str(user),
        )


# ============================================================
# INPUT OPERACIONES DE ACTIVOS
# ============================================================


class AsignarActivoEquipoSerializer(
    serializers.Serializer
):
    equipo_destino_id = serializers.IntegerField(
        min_value=1,
    )

    observaciones = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
    )




class CrearComponenteStockSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = Componente

        fields = [
            "tipo_componente",
            "marca",
            "modelo",
            "numero_serie",
            "capacidad_valor",
            "capacidad_unidad",
            "fecha_adquisicion",
            "observaciones",
        ]


    def validate(self, attrs):
        tipo_componente = attrs.get(
            "tipo_componente"
        )

        capacidad_valor = attrs.get(
            "capacidad_valor"
        )

        capacidad_unidad = attrs.get(
            "capacidad_unidad",
            "",
        )

        if (
            tipo_componente
            and not tipo_componente.tiene_capacidad
            and (
                capacidad_valor is not None
                or capacidad_unidad
            )
        ):
            raise serializers.ValidationError(
                {
                    "capacidad_valor": (
                        f"{tipo_componente.nombre} "
                        "no utiliza capacidad."
                    )
                }
            )

        return attrs


class ActualizarConfiguracionActivoSerializer(
    serializers.Serializer
):
    hostname = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
        max_length=255,
    )

    sistema_operativo_id = (
        serializers.IntegerField(
            required=False,
            allow_null=True,
            min_value=1,
        )
    )