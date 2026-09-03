from rest_framework import viewsets

from .services import crear_activo

from .models import (
    Activo,
    Componente,
    EquipoTrabajo,
    TipoActivo,
    TipoComponente,
    SistemaOperativo,
)

from .serializers import (
    ActivoSerializer,
    ComponenteSerializer,
    EquipoTrabajoSerializer,
    TipoActivoSerializer,
    TipoComponenteSerializer,
    SistemaOperativoSerializer,
)


# ============================================================
# BASE
# ============================================================


class BaseAuditViewSet(viewsets.ModelViewSet):

    def perform_create(self, serializer):

        user = (
            self.request.user
            if self.request.user.is_authenticated
            else None
        )

        serializer.save(
            user_made=user
        )

    def perform_update(self, serializer):

        user = (
            self.request.user
            if self.request.user.is_authenticated
            else None
        )

        serializer.save(
            user_updated=user
        )

    def perform_destroy(self, instance):

        user = (
            self.request.user
            if self.request.user.is_authenticated
            else None
        )

        instance.delete(
            user=user
        )


# ============================================================
# TIPO ACTIVO
# ============================================================






class SistemaOperativoViewSet(BaseAuditViewSet):

    serializer_class = SistemaOperativoSerializer

    def get_queryset(self):

        queryset = (
            SistemaOperativo.objects
            .filter(
                is_deleted=False,
            )
        )

        activo = (
            self.request
            .query_params
            .get("activo")
        )

        if activo is not None:

            valor = (
                activo
                .strip()
                .lower()
            )

            if valor in (
                "true",
                "1",
                "si",
                "sí",
            ):
                queryset = queryset.filter(
                    activo=True,
                )

            elif valor in (
                "false",
                "0",
                "no",
            ):
                queryset = queryset.filter(
                    activo=False,
                )

        return queryset.order_by(
            "nombre"
        )





class TipoActivoViewSet(BaseAuditViewSet):

    serializer_class = TipoActivoSerializer

    def get_queryset(self):

        return (
            TipoActivo.objects
            .filter(
                is_deleted=False
            )
            .order_by(
                "nombre"
            )
        )


# ============================================================
# TIPO COMPONENTE
# ============================================================


class TipoComponenteViewSet(BaseAuditViewSet):

    serializer_class = TipoComponenteSerializer

    def get_queryset(self):

        queryset = (
            TipoComponente.objects
            .filter(
                is_deleted=False
            )
            .prefetch_related(
                "tipos_activo_permitidos"
            )
        )

        activo = (
            self.request
            .query_params
            .get("activo")
        )

        tipo_activo = (
            self.request
            .query_params
            .get("tipo_activo")
        )

        # ----------------------------------------------------
        # FILTRAR SOLO ACTIVOS
        # ----------------------------------------------------

        if activo is not None:

            valor = (
                activo
                .strip()
                .lower()
            )

            if valor in (
                "true",
                "1",
                "si",
                "sí",
            ):

                queryset = queryset.filter(
                    activo=True
                )

            elif valor in (
                "false",
                "0",
                "no",
            ):

                queryset = queryset.filter(
                    activo=False
                )

        # ----------------------------------------------------
        # FILTRAR POR TIPO DE ACTIVO COMPATIBLE
        # ----------------------------------------------------

        if tipo_activo:

            queryset = queryset.filter(
                tipos_activo_permitidos__id=tipo_activo
            )

        return (
            queryset
            .distinct()
            .order_by(
                "nombre"
            )
        )


# ============================================================
# EQUIPO TRABAJO
# ============================================================


class EquipoTrabajoViewSet(BaseAuditViewSet):

    serializer_class = EquipoTrabajoSerializer

    def get_queryset(self):

        queryset = (
            EquipoTrabajo.objects
            .filter(
                is_deleted=False
            )
            .select_related(
                "sector",
                "sector__area",
            )
        )

        sector = (
            self.request
            .query_params
            .get("sector")
        )

        area = (
            self.request
            .query_params
            .get("area")
        )

        estado = (
            self.request
            .query_params
            .get("estado")
        )

        if sector:

            queryset = queryset.filter(
                sector_id=sector
            )

        if area:

            queryset = queryset.filter(
                sector__area_id=area
            )

        if estado:

            queryset = queryset.filter(
                estado=estado
            )

        return queryset.order_by(
            "sector__area__nombre",
            "sector__nombre",
            "nombre",
        )


# ============================================================
# ACTIVO
# ============================================================


class ActivoViewSet(BaseAuditViewSet):

    serializer_class = ActivoSerializer

    def get_queryset(self):

        queryset = (
            Activo.objects
            .filter(
                is_deleted=False
            )
            .select_related(
                "tipo_activo",
                "sector",
                "sector__area",
                "equipo_trabajo",
                "sistema_operativo",
            )
            .prefetch_related(
                "componentes",
                "componentes__tipo_componente",
            )
        )

        tipo = (
            self.request
            .query_params
            .get("tipo")
        )

        sector = (
            self.request
            .query_params
            .get("sector")
        )

        area = (
            self.request
            .query_params
            .get("area")
        )

        equipo = (
            self.request
            .query_params
            .get("equipo")
        )

        estado = (
            self.request
            .query_params
            .get("estado")
        )

        hostname = (
            self.request
            .query_params
            .get("hostname")
        )

        sin_equipo = (
            self.request
            .query_params
            .get("sin_equipo")
        )

        if tipo:

            queryset = queryset.filter(
                tipo_activo_id=tipo
            )

        if sector:

            queryset = queryset.filter(
                sector_id=sector
            )

        if area:

            queryset = queryset.filter(
                sector__area_id=area
            )

        if equipo:

            queryset = queryset.filter(
                equipo_trabajo_id=equipo
            )

        if estado:

            queryset = queryset.filter(
                estado=estado
            )

        if hostname:

            queryset = queryset.filter(
                hostname__icontains=hostname
            )

        if sin_equipo:

            valor = (
                sin_equipo
                .strip()
                .lower()
            )

            if valor in (
                "true",
                "1",
                "si",
                "sí",
            ):

                queryset = queryset.filter(
                    equipo_trabajo__isnull=True
                )

            elif valor in (
                "false",
                "0",
                "no",
            ):

                queryset = queryset.filter(
                    equipo_trabajo__isnull=False
                )

        return queryset.order_by(
            "codigo_inventario"
        )

    def perform_create(
        self,
        serializer,
    ):

        activo = crear_activo(
            validated_data=(
                serializer.validated_data
            ),
            user=self.request.user,
        )

        serializer.instance = activo


# ============================================================
# COMPONENTE
# ============================================================


class ComponenteViewSet(BaseAuditViewSet):

    serializer_class = ComponenteSerializer

    def get_queryset(self):

        queryset = (
            Componente.objects
            .filter(
                is_deleted=False
            )
            .select_related(
                "tipo_componente",
                "activo",
                "activo__tipo_activo",
            )
        )

        tipo = (
            self.request
            .query_params
            .get("tipo")
        )

        activo = (
            self.request
            .query_params
            .get("activo")
        )

        estado = (
            self.request
            .query_params
            .get("estado")
        )

        if tipo:

            queryset = queryset.filter(
                tipo_componente_id=tipo
            )

        if activo:

            queryset = queryset.filter(
                activo_id=activo
            )

        if estado:

            queryset = queryset.filter(
                estado=estado
            )

        return queryset.order_by(
            "tipo_componente__nombre",
            "marca",
        )