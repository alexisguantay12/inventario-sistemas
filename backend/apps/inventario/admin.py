from django.contrib import admin

from .models import (
    EquipoTrabajo,
    TipoActivo,
    Activo,
    TipoComponente,
    Componente,
    SistemaOperativo
)


# ============================================================
# INLINES
# ============================================================


class ActivoInline(admin.TabularInline):
    model = Activo
    extra = 0

    fields = (
        "codigo_inventario",
        "tipo_activo",
        "hostname",
        "sistema_operativo",
        "estado",
    )

    readonly_fields = (
        "codigo_inventario",
    )

    show_change_link = True


class ComponenteInline(admin.TabularInline):
    model = Componente
    extra = 0

    fields = (
        "tipo_componente",
        "marca",
        "modelo",
        "capacidad_valor",
        "capacidad_unidad",
        "estado",
    )

    show_change_link = True


# ============================================================
# EQUIPO DE TRABAJO
# ============================================================
@admin.register(SistemaOperativo)
class SistemaOperativoAdmin(admin.ModelAdmin):

    list_display = (
        "nombre",
        "activo",
    )

    list_filter = (
        "activo",
    )

    search_fields = (
        "nombre",
    )

    ordering = (
        "nombre",
    )

    fieldsets = (
        (
            "Datos",
            {
                "fields": (
                    "nombre",
                    "activo",
                )
            },
        ),
    )

@admin.register(EquipoTrabajo)
class EquipoTrabajoAdmin(admin.ModelAdmin):

    list_display = (
        "nombre",
        "sector",
        "area",
        "uso_actual",
        "estado",
        "cantidad_activos",
    )

    list_filter = (
        "estado",
        "sector__area",
        "sector",
    )

    search_fields = (
        "nombre",
        "uso_actual",
        "sector__nombre",
        "sector__area__nombre",
    )

    autocomplete_fields = (
        "sector",
    )

    ordering = (
        "sector__area__nombre",
        "sector__nombre",
        "nombre",
    )

    list_select_related = (
        "sector",
        "sector__area",
    )

    inlines = [
        ActivoInline,
    ]

    @admin.display(
        description="Área",
        ordering="sector__area__nombre",
    )
    def area(self, obj):
        return obj.sector.area

    @admin.display(
        description="Activos",
    )
    def cantidad_activos(self, obj):
        return obj.activos.filter(
            is_deleted=False,
        ).count()


# ============================================================
# TIPO DE ACTIVO
# ============================================================


@admin.register(TipoActivo)
class TipoActivoAdmin(admin.ModelAdmin):

    list_display = (
        "nombre",
        "prefijo",
        "activo",
        "tiene_sistema_operativo",
        "tiene_mac",
        "cantidad_activos",
    )

    list_filter = (
        "activo",
        "tiene_sistema_operativo",
        "tiene_mac",
    )

    search_fields = (
        "nombre",
        "prefijo",
        "descripcion",
    )

    ordering = (
        "nombre",
    )

    fieldsets = (
        (
            "Datos",
            {
                "fields": (
                    "nombre",
                    "prefijo",
                    "descripcion",
                    "activo",
                )
            },
        ),
        (
            "Comportamiento",
            {
                "fields": (
                    "tiene_sistema_operativo",
                    "tiene_mac",
                ),
                "description": (
                    "Configurá las capacidades técnicas de este tipo de activo. "
                    "Ej.: CPU o notebook pueden tener sistema operativo y MAC; "
                    "una impresora o switch puede tener MAC aunque no use "
                    "sistema operativo."
                ),
            },
        ),
    )

    @admin.display(
        description="Activos",
    )
    def cantidad_activos(self, obj):
        return obj.activos.filter(
            is_deleted=False,
        ).count()


# ============================================================
# ACTIVO
# ============================================================


@admin.register(Activo)
class ActivoAdmin(admin.ModelAdmin):

    list_display = (
        "codigo_inventario",
        "tipo_activo",
        "hostname",
        "sistema_operativo",
        "marca",
        "modelo",
        "sector",
        "equipo_trabajo",
        "estado",
        "cantidad_componentes",
    )

    list_filter = (
        "estado",
        "tipo_activo",
        "tipo_activo__tiene_sistema_operativo",
        "sector__area",
        "sector",
    )

    search_fields = (
        "codigo_inventario",
        "hostname",
        "sistema_operativo__nombre",
        "marca",
        "modelo",
        "numero_serie",
        "sector__nombre",
        "sector__area__nombre",
        "equipo_trabajo__nombre",
    )

    autocomplete_fields = (
        "tipo_activo",
        "sector",
        "equipo_trabajo",
        "sistema_operativo",
    )

    ordering = (
        "codigo_inventario",
    )

    list_select_related = (
        "tipo_activo",
        "sector",
        "sector__area",
        "equipo_trabajo",
    )

    list_per_page = 50

    inlines = [
        ComponenteInline,
    ]

    fieldsets = (
        (
            "Identificación",
            {
                "fields": (
                    "codigo_inventario",
                    "tipo_activo",
                )
            },
        ),
        (
            "Ubicación",
            {
                "fields": (
                    "sector",
                    "equipo_trabajo",
                )
            },
        ),
        (
            "Información técnica",
            {
                "fields": (
                    "hostname",
                    "sistema_operativo",
                    "marca",
                    "modelo",
                    "numero_serie",
                    "fecha_adquisicion",
                )
            },
        ),
        (
            "Estado",
            {
                "fields": (
                    "estado",
                    "observaciones",
                )
            },
        ),
    )

    @admin.display(
        description="Componentes",
    )
    def cantidad_componentes(self, obj):
        return obj.componentes.filter(
            is_deleted=False,
        ).count()


# ============================================================
# TIPO DE COMPONENTE
# ============================================================


@admin.register(TipoComponente)
class TipoComponenteAdmin(admin.ModelAdmin):

    list_display = (
        "nombre",
        "activo",
        "tiene_capacidad",
        "tipos_activo",
        "cantidad_componentes",
    )

    list_filter = (
        "activo",
        "tiene_capacidad",
        "tipos_activo_permitidos",
    )

    search_fields = (
        "nombre",
        "descripcion",
        "tipos_activo_permitidos__nombre",
    )

    filter_horizontal = (
        "tipos_activo_permitidos",
    )

    ordering = (
        "nombre",
    )

    fieldsets = (
        (
            "Datos",
            {
                "fields": (
                    "nombre",
                    "descripcion",
                    "activo",
                )
            },
        ),
        (
            "Comportamiento",
            {
                "fields": (
                    "tiene_capacidad",
                ),
                "description": (
                    "Marcá esta opción si este componente "
                    "utiliza capacidad y unidad. "
                    "Ej.: RAM, SSD o HDD."
                ),
            },
        ),
        (
            "Compatibilidad",
            {
                "fields": (
                    "tipos_activo_permitidos",
                ),
                "description": (
                    "Indicá en qué tipos de activo puede instalarse "
                    "este componente."
                ),
            },
        ),
    )

    @admin.display(
        description="Permitido en",
    )
    def tipos_activo(self, obj):
        return ", ".join(
            obj.tipos_activo_permitidos
            .filter(
                is_deleted=False,
            )
            .values_list(
                "nombre",
                flat=True,
            )
        ) or "-"

    @admin.display(
        description="Componentes",
    )
    def cantidad_componentes(self, obj):
        return obj.componentes.filter(
            is_deleted=False,
        ).count()


# ============================================================
# COMPONENTE
# ============================================================


@admin.register(Componente)
class ComponenteAdmin(admin.ModelAdmin):

    list_display = (
        "tipo_componente",
        "descripcion_componente",
        "activo",
        "estado",
        "fecha_adquisicion",
    )

    list_filter = (
        "estado",
        "tipo_componente",
        "tipo_componente__tiene_capacidad",
        "tipo_componente__tipos_activo_permitidos",
    )

    search_fields = (
        "tipo_componente__nombre",
        "marca",
        "modelo",
        "numero_serie",
        "activo__codigo_inventario",
        "activo__hostname",
    )

    autocomplete_fields = (
        "tipo_componente",
        "activo",
    )

    ordering = (
        "tipo_componente__nombre",
        "marca",
        "modelo",
    )

    list_select_related = (
        "tipo_componente",
        "activo",
    )

    list_per_page = 50

    fieldsets = (
        (
            "Instalación",
            {
                "fields": (
                    "tipo_componente",
                    "activo",
                    "estado",
                )
            },
        ),
        (
            "Información",
            {
                "fields": (
                    "marca",
                    "modelo",
                    "numero_serie",
                )
            },
        ),
        (
            "Capacidad",
            {
                "fields": (
                    "capacidad_valor",
                    "capacidad_unidad",
                ),
                "description": (
                    "Solo aplica a tipos de componente "
                    "que utilizan capacidad, como RAM, SSD o HDD."
                ),
            },
        ),
        (
            "Otros datos",
            {
                "fields": (
                    "fecha_adquisicion",
                    "observaciones",
                )
            },
        ),
    )

    @admin.display(
        description="Descripción",
    )
    def descripcion_componente(self, obj):
        partes = []

        if obj.marca:
            partes.append(
                obj.marca
            )

        if obj.modelo:
            partes.append(
                obj.modelo
            )

        if (
            obj.tipo_componente.tiene_capacidad
            and obj.capacidad_valor is not None
        ):
            capacidad = (
                f"{obj.capacidad_valor:g}"
            )

            if obj.capacidad_unidad:
                capacidad += (
                    f" {obj.capacidad_unidad}"
                )

            partes.append(
                capacidad
            )

        return (
            " - ".join(partes)
            or "-"
        )