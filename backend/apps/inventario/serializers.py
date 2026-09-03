from rest_framework import serializers

from .models import (
    Activo,
    Componente,
    EquipoTrabajo,
    TipoActivo,
    TipoComponente,
    SistemaOperativo,
)


# ============================================================
# TIPO ACTIVO
# ============================================================


class SistemaOperativoSerializer(serializers.ModelSerializer):

    class Meta:
        model = SistemaOperativo

        fields = [
            "id",
            "nombre",
            "activo",
        ]

        read_only_fields = [
            "id",
        ]


class TipoActivoSerializer(serializers.ModelSerializer):

    class Meta:
        model = TipoActivo

        fields = [
            "id",
            "nombre",
            "prefijo",
            "descripcion",
            "activo",
            "tiene_sistema_operativo",
        ]

        read_only_fields = [
            "id",
        ]


# ============================================================
# TIPO COMPONENTE
# ============================================================


class TipoComponenteSerializer(serializers.ModelSerializer):

    class Meta:
        model = TipoComponente

        fields = [
            "id",
            "nombre",
            "descripcion",
            "activo",
            "tiene_capacidad",
            "tipos_activo_permitidos",
        ]

        read_only_fields = [
            "id",
        ]


# ============================================================
# EQUIPO DE TRABAJO
# ============================================================


class EquipoTrabajoSerializer(serializers.ModelSerializer):

    sector_nombre = serializers.CharField(
        source="sector.nombre",
        read_only=True,
    )

    area_nombre = serializers.CharField(
        source="sector.area.nombre",
        read_only=True,
    )

    sistema_operativo_principal = serializers.SerializerMethodField()
    ram_total_gb = serializers.SerializerMethodField()
    
    cantidad_activos = serializers.SerializerMethodField()

    hostname_principal = serializers.SerializerMethodField()

    class Meta:
        model = EquipoTrabajo

        fields = [
            "id",
            "sector",
            "sector_nombre",
            "area_nombre",
            "nombre",
            "uso_actual",
            "foto",
            "estado",
            "sistema_operativo_principal",
            "ram_total_gb",
            "observaciones",
            "cantidad_activos",
            "hostname_principal",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "sector_nombre",
            "area_nombre",
            "cantidad_activos",
            "hostname_principal",
            "sistema_operativo_principal",
            "ram_total_gb",     
            "created_at",
            "updated_at",
        ]

    def get_cantidad_activos(self, obj):
        return obj.activos.filter(
            is_deleted=False,
        ).count()

    def get_activo_principal(self, obj):
        """
        Busca el activo técnico principal del equipo.

        Primero prioriza un activo con sistema operativo.
        Si no encuentra, usa uno con hostname.
        """
        activo = (
            obj.activos
            .filter(
                is_deleted=False,
                sistema_operativo__isnull=False,
            )
            .select_related(
                "sistema_operativo",
                "tipo_activo",
            )
            .order_by("id")
            .first()
        )

        if activo:
            return activo

        activo = (
            obj.activos
            .filter(
                is_deleted=False,
            )
            .exclude(hostname="")
            .select_related(
                "sistema_operativo",
                "tipo_activo",
            )
            .order_by("id")
            .first()
        )

        return activo


    def get_hostname_principal(self, obj):
        activo = self.get_activo_principal(obj)

        if activo and activo.hostname:
            return activo.hostname

        return None


    def get_sistema_operativo_principal(self, obj):
        activo = self.get_activo_principal(obj)

        if (
            activo
            and activo.sistema_operativo
        ):
            return activo.sistema_operativo.nombre

        return None


    def get_ram_total_gb(self, obj):
        activo = self.get_activo_principal(obj)

        if not activo:
            return 0

        componentes_ram = (
            activo.componentes
            .filter(
                is_deleted=False,
                estado="INSTALADO",
                tipo_componente__nombre__iexact="RAM",
            )
            .select_related(
                "tipo_componente",
            )
        )

        total_gb = 0

        for componente in componentes_ram:
            valor = componente.capacidad_valor
            unidad = componente.capacidad_unidad

            if valor is None:
                continue

            valor = float(valor)

            if unidad == "GB":
                total_gb += valor

            elif unidad == "MB":
                total_gb += valor / 1024

            elif unidad == "TB":
                total_gb += valor * 1024

        if total_gb.is_integer():
            return int(total_gb)

        return round(total_gb, 2)


# ============================================================
# COMPONENTE INLINE PARA CREAR ACTIVO
# ============================================================


class ComponenteInlineSerializer(serializers.ModelSerializer):

    tipo_componente_nombre = serializers.CharField(
        source="tipo_componente.nombre",
        read_only=True,
    )

    class Meta:
        model = Componente

        fields = [
            "id",

            "tipo_componente",
            "tipo_componente_nombre",

            "marca",
            "modelo",

            "capacidad_valor",
            "capacidad_unidad",

            "fecha_adquisicion",
        ]

        read_only_fields = [
            "id",
            "tipo_componente_nombre",
        ]

    def validate(self, attrs):

        tipo_componente = attrs.get(
            "tipo_componente"
        )

        capacidad_valor = attrs.get(
            "capacidad_valor"
        )

        capacidad_unidad = attrs.get(
            "capacidad_unidad"
        )

        if tipo_componente:

            # ----------------------------------------------------
            # COMPONENTE SIN CAPACIDAD
            # ----------------------------------------------------

            if (
                not tipo_componente.tiene_capacidad
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


# ============================================================
# ACTIVO
# ============================================================


class ActivoSerializer(serializers.ModelSerializer):

    tipo_activo_nombre = serializers.CharField(
        source="tipo_activo.nombre",
        read_only=True,
    )

    sector_nombre = serializers.CharField(
        source="sector.nombre",
        read_only=True,
        allow_null=True,
    )

    area_nombre = serializers.CharField(
        source="sector.area.nombre",
        read_only=True,
        allow_null=True,
    )
    equipo_trabajo_nombre = serializers.CharField(
        source="equipo_trabajo.nombre",
        read_only=True,
        allow_null=True,
    )

    cantidad_componentes = serializers.SerializerMethodField()

    componentes = ComponenteInlineSerializer(
        many=True,
        required=False,
    )
    sistema_operativo_nombre = serializers.CharField(
        source="sistema_operativo.nombre",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = Activo

        fields = [
            "id",
            "codigo_inventario",

            "tipo_activo",
            "tipo_activo_nombre",

            "sector",
            "sector_nombre",
            "area_nombre",

            "equipo_trabajo",
            "equipo_trabajo_nombre",

            "marca",
            "modelo",
            "numero_serie",

            "hostname",
            "sistema_operativo",
            "sistema_operativo_nombre",

            "fecha_adquisicion",
            "estado",
            "observaciones",

            "cantidad_componentes",
            "componentes",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "codigo_inventario",

            "tipo_activo_nombre",
            "sector_nombre",
            "area_nombre",
            "equipo_trabajo_nombre",
            "sistema_operativo_nombre",
            "cantidad_componentes",

            "created_at",
            "updated_at",
        ]

    def get_cantidad_componentes(
        self,
        obj,
    ):

        return obj.componentes.filter(
            is_deleted=False,
        ).count()


    def validate(
        self,
        attrs,
    ):

        sector = attrs.get(
            "sector",
            getattr(
                self.instance,
                "sector",
                None,
            ),
        )

        equipo = attrs.get(
            "equipo_trabajo",
            getattr(
                self.instance,
                "equipo_trabajo",
                None,
            ),
        )

        tipo_activo = attrs.get(
            "tipo_activo",
            getattr(
                self.instance,
                "tipo_activo",
                None,
            ),
        )

        sistema_operativo = attrs.get(
            "sistema_operativo",
            getattr(
                self.instance,
                "sistema_operativo",
                None,
            ),
        )

        componentes = attrs.get(
            "componentes",
            [],
        )


        # --------------------------------------------------------
        # EQUIPO / SECTOR
        # --------------------------------------------------------

        if equipo and sector:

            if (
                equipo.sector_id
                != sector.id
            ):

                raise serializers.ValidationError(
                    {
                        "equipo_trabajo": (
                            "El equipo de trabajo no pertenece "
                            "al sector seleccionado."
                        )
                    }
                )


        # --------------------------------------------------------
        # SISTEMA OPERATIVO
        # --------------------------------------------------------

        if (
            sistema_operativo
            and tipo_activo
            and not tipo_activo.tiene_sistema_operativo
        ):

            raise serializers.ValidationError(
                {
                    "sistema_operativo": (
                        "Este tipo de activo no admite "
                        "sistema operativo."
                    )
                }
            )


        # --------------------------------------------------------
        # COMPONENTES / TIPO DE ACTIVO
        # --------------------------------------------------------

        if (
            tipo_activo
            and componentes
        ):

            for (
                indice,
                componente,
            ) in enumerate(
                componentes
            ):

                tipo_componente = (
                    componente.get(
                        "tipo_componente"
                    )
                )

                if not tipo_componente:
                    continue


                permitido = (
                    tipo_componente
                    .tipos_activo_permitidos
                    .filter(
                        pk=tipo_activo.pk,
                    )
                    .exists()
                )


                if not permitido:

                    raise serializers.ValidationError(
                        {
                            "componentes": (
                                f"El componente "
                                f"'{tipo_componente.nombre}' "
                                f"de la posición "
                                f"{indice + 1} "
                                f"no puede instalarse en un "
                                f"activo de tipo "
                                f"'{tipo_activo.nombre}'."
                            )
                        }
                    )

        return attrs


# ============================================================
# COMPONENTE
# ============================================================


class ComponenteSerializer(serializers.ModelSerializer):

    tipo_componente_nombre = serializers.CharField(
        source="tipo_componente.nombre",
        read_only=True,
    )

    activo_codigo = serializers.CharField(
        source="activo.codigo_inventario",
        read_only=True,
        allow_null=True,
    )

    activo_hostname = serializers.CharField(
        source="activo.hostname",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = Componente

        fields = [
            "id",

            "tipo_componente",
            "tipo_componente_nombre",

            "activo",
            "activo_codigo",
            "activo_hostname",

            "marca",
            "modelo",
            "numero_serie",

            "capacidad_valor",
            "capacidad_unidad",

            "estado",

            "fecha_adquisicion",

            "observaciones",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",

            "tipo_componente_nombre",

            "activo_codigo",
            "activo_hostname",

            "created_at",
            "updated_at",
        ]

    def validate(
        self,
        attrs,
    ):
        estado = attrs.get(
            "estado",
            getattr(
                self.instance,
                "estado",
                None,
            ),
        )

        activo = attrs.get(
            "activo",
            getattr(
                self.instance,
                "activo",
                None,
            ),
        )

        tipo_componente = attrs.get(
            "tipo_componente",
            getattr(
                self.instance,
                "tipo_componente",
                None,
            ),
        )

        capacidad_valor = attrs.get(
            "capacidad_valor",
            getattr(
                self.instance,
                "capacidad_valor",
                None,
            ),
        )

        capacidad_unidad = attrs.get(
            "capacidad_unidad",
            getattr(
                self.instance,
                "capacidad_unidad",
                "",
            ),
        )


        # --------------------------------------------------------
        # INSTALADO NECESITA ACTIVO
        # --------------------------------------------------------

        if (
            estado == "INSTALADO"
            and not activo
        ):
            raise serializers.ValidationError(
                {
                    "activo": (
                        "Un componente instalado debe "
                        "estar asociado a un activo."
                    )
                }
            )


        # --------------------------------------------------------
        # ESTADOS PERMITIDOS SI SIGUE ASOCIADO AL ACTIVO
        # --------------------------------------------------------

        estados_permitidos_con_activo = [
            "INSTALADO",
            "DEFECTUOSO",
        ]

        if (
            activo
            and estado not in estados_permitidos_con_activo
        ):
            raise serializers.ValidationError(
                {
                    "estado": (
                        "Un componente asociado a un activo "
                        "solo puede estar en estado "
                        "Instalado o Defectuoso."
                    )
                }
            )


        # --------------------------------------------------------
        # COMPATIBILIDAD
        # --------------------------------------------------------

        if (
            activo
            and tipo_componente
        ):
            permitido = (
                tipo_componente
                .tipos_activo_permitidos
                .filter(
                    pk=activo.tipo_activo_id,
                )
                .exists()
            )

            if not permitido:
                raise serializers.ValidationError(
                    {
                        "tipo_componente": (
                            f"{tipo_componente.nombre} "
                            f"no puede instalarse en "
                            f"un activo de tipo "
                            f"{activo.tipo_activo.nombre}."
                        )
                    }
                )


        # --------------------------------------------------------
        # CAPACIDAD
        # --------------------------------------------------------

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