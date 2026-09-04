from django.core.exceptions import (
    ObjectDoesNotExist,
    ValidationError as DjangoValidationError,
)

from django.db import models

from rest_framework import (
    status,
    viewsets,
)

from rest_framework.decorators import action

from rest_framework.exceptions import (
    NotFound,
    ValidationError,
)

from rest_framework.response import Response


from apps.inventario.models import (
    Activo,
    Componente,
)

from apps.inventario.serializers import (
    ActivoSerializer,
    ComponenteSerializer,
)


from .models import (
    MovimientoActivo,
    MovimientoComponente,
)

from .serializers import (
    AsignarActivoEquipoSerializer,
    InstalarComponenteSerializer,
    MovimientoActivoSerializer,
    MovimientoComponenteSerializer,
    ObservacionOperacionSerializer,
    CrearComponenteStockSerializer,
    ActualizarConfiguracionActivoSerializer,
)

from .services import (
    actualizar_configuracion_activo,
    asignar_activo_equipo,
    dar_baja_activo,
    dar_baja_componente,
    enviar_activo_reparacion,
    enviar_activo_stock,
    enviar_componente_reparacion,
    enviar_componente_stock,
    instalar_componente,
    marcar_activo_defectuoso,
    marcar_activo_operativo,
    marcar_componente_defectuoso,
    marcar_componente_operativo,
    retornar_activo_reparacion_stock,
    retornar_componente_reparacion_stock,
    crear_componente_stock,
)


# ============================================================
# HELPER
# ============================================================


def convertir_error_servicio(exc):
    """
    Convierte ValidationError de Django en
    ValidationError de Django REST Framework.
    """

    if hasattr(
        exc,
        "message_dict",
    ):
        raise ValidationError(
            exc.message_dict
        )

    if hasattr(
        exc,
        "messages",
    ):
        raise ValidationError(
            {
                "detail": exc.messages
            }
        )

    raise ValidationError(
        {
            "detail": str(exc)
        }
    )


# ============================================================
# OPERACIONES DE COMPONENTES
# ============================================================


class OperacionComponenteViewSet(
    viewsets.ViewSet
):
    """
    Endpoints operativos de componentes.

    No crea ni edita movimientos directamente.
    Cada acción utiliza services.py.
    """

    # --------------------------------------------------------
    # HELPER
    # --------------------------------------------------------

    def _obtener_componente(
        self,
        pk,
    ):
        try:
            return (
                Componente.objects
                .select_related(
                    "tipo_componente",
                    "activo",
                    "activo__tipo_activo",
                )
                .get(
                    pk=pk,
                    is_deleted=False,
                )
            )

        except Componente.DoesNotExist:
            raise NotFound(
                "Componente no encontrado."
            )


    # --------------------------------------------------------
    # CONSULTAR COMPONENTE
    # --------------------------------------------------------

    def retrieve(
        self,
        request,
        pk=None,
    ):
        componente = (
            self._obtener_componente(
                pk
            )
        )

        serializer = (
            ComponenteSerializer(
                componente
            )
        )

        return Response(
            serializer.data
        )


    # --------------------------------------------------------
    # INSTALAR EN ACTIVO
    # --------------------------------------------------------

    @action(
        detail=True,
        methods=["post"],
        url_path="instalar",
    )
    def instalar(
        self,
        request,
        pk=None,
    ):
        serializer = (
            InstalarComponenteSerializer(
                data=request.data,
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        try:
            componente = (
                instalar_componente(
                    componente_id=pk,

                    activo_id=(
                        serializer
                        .validated_data[
                            "activo_id"
                        ]
                    ),

                    user=request.user,

                    observaciones=(
                        serializer
                        .validated_data
                        .get(
                            "observaciones",
                            "",
                        )
                    ),
                )
            )

        except ObjectDoesNotExist:
            raise NotFound(
                "El componente o activo no existe."
            )

        except DjangoValidationError as exc:
            convertir_error_servicio(
                exc
            )

        return Response(
            ComponenteSerializer(
                componente
            ).data,
            status=status.HTTP_200_OK,
        )


    # --------------------------------------------------------
    # MARCAR DEFECTUOSO
    # --------------------------------------------------------

    @action(
        detail=True,
        methods=["post"],
        url_path="marcar-defectuoso",
    )
    def marcar_defectuoso(
        self,
        request,
        pk=None,
    ):
        serializer = (
            ObservacionOperacionSerializer(
                data=request.data,
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        try:
            componente = (
                marcar_componente_defectuoso(
                    componente_id=pk,

                    user=request.user,

                    observaciones=(
                        serializer
                        .validated_data
                        .get(
                            "observaciones",
                            "",
                        )
                    ),
                )
            )

        except ObjectDoesNotExist:
            raise NotFound(
                "Componente no encontrado."
            )

        except DjangoValidationError as exc:
            convertir_error_servicio(
                exc
            )

        return Response(
            ComponenteSerializer(
                componente
            ).data
        )


    # --------------------------------------------------------
    # MARCAR OPERATIVO
    # --------------------------------------------------------

    @action(
        detail=True,
        methods=["post"],
        url_path="marcar-operativo",
    )
    def marcar_operativo(
        self,
        request,
        pk=None,
    ):
        serializer = (
            ObservacionOperacionSerializer(
                data=request.data,
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        try:
            componente = (
                marcar_componente_operativo(
                    componente_id=pk,

                    user=request.user,

                    observaciones=(
                        serializer
                        .validated_data
                        .get(
                            "observaciones",
                            "",
                        )
                    ),
                )
            )

        except ObjectDoesNotExist:
            raise NotFound(
                "Componente no encontrado."
            )

        except DjangoValidationError as exc:
            convertir_error_servicio(
                exc
            )

        return Response(
            ComponenteSerializer(
                componente
            ).data
        )


    # --------------------------------------------------------
    # ENVIAR A STOCK
    # --------------------------------------------------------

    @action(
        detail=True,
        methods=["post"],
        url_path="enviar-stock",
    )
    def enviar_stock(
        self,
        request,
        pk=None,
    ):
        serializer = (
            ObservacionOperacionSerializer(
                data=request.data,
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        try:
            componente = (
                enviar_componente_stock(
                    componente_id=pk,

                    user=request.user,

                    observaciones=(
                        serializer
                        .validated_data
                        .get(
                            "observaciones",
                            "",
                        )
                    ),
                )
            )

        except ObjectDoesNotExist:
            raise NotFound(
                "Componente no encontrado."
            )

        except DjangoValidationError as exc:
            convertir_error_servicio(
                exc
            )

        return Response(
            ComponenteSerializer(
                componente
            ).data
        )


    # --------------------------------------------------------
    # ENVIAR A REPARACIÓN
    # --------------------------------------------------------

    @action(
        detail=True,
        methods=["post"],
        url_path="enviar-reparacion",
    )
    def enviar_reparacion(
        self,
        request,
        pk=None,
    ):
        serializer = (
            ObservacionOperacionSerializer(
                data=request.data,
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        try:
            componente = (
                enviar_componente_reparacion(
                    componente_id=pk,

                    user=request.user,

                    observaciones=(
                        serializer
                        .validated_data
                        .get(
                            "observaciones",
                            "",
                        )
                    ),
                )
            )

        except ObjectDoesNotExist:
            raise NotFound(
                "Componente no encontrado."
            )

        except DjangoValidationError as exc:
            convertir_error_servicio(
                exc
            )

        return Response(
            ComponenteSerializer(
                componente
            ).data
        )


    # --------------------------------------------------------
    # RETORNO DE REPARACIÓN A STOCK
    # --------------------------------------------------------

    @action(
        detail=True,
        methods=["post"],
        url_path="retornar-reparacion-stock",
    )
    def retornar_reparacion_stock(
        self,
        request,
        pk=None,
    ):
        serializer = (
            ObservacionOperacionSerializer(
                data=request.data,
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        try:
            componente = (
                retornar_componente_reparacion_stock(
                    componente_id=pk,

                    user=request.user,

                    observaciones=(
                        serializer
                        .validated_data
                        .get(
                            "observaciones",
                            "",
                        )
                    ),
                )
            )

        except ObjectDoesNotExist:
            raise NotFound(
                "Componente no encontrado."
            )

        except DjangoValidationError as exc:
            convertir_error_servicio(
                exc
            )

        return Response(
            ComponenteSerializer(
                componente
            ).data
        )


    # --------------------------------------------------------
    # BAJA DEFINITIVA
    # --------------------------------------------------------

    @action(
        detail=True,
        methods=["post"],
        url_path="dar-baja",
    )
    def dar_baja(
        self,
        request,
        pk=None,
    ):
        serializer = (
            ObservacionOperacionSerializer(
                data=request.data,
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        try:
            componente = (
                dar_baja_componente(
                    componente_id=pk,

                    user=request.user,

                    observaciones=(
                        serializer
                        .validated_data
                        .get(
                            "observaciones",
                            "",
                        )
                    ),
                )
            )

        except ObjectDoesNotExist:
            raise NotFound(
                "Componente no encontrado."
            )

        except DjangoValidationError as exc:
            convertir_error_servicio(
                exc
            )

        return Response(
            ComponenteSerializer(
                componente
            ).data
        )
    @action(
        detail=False,
        methods=["post"],
        url_path="crear-stock",
    )
    def crear_stock(
        self,
        request,
    ):
        serializer = (
            CrearComponenteStockSerializer(
                data=request.data,
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        try:
            componente = (
                crear_componente_stock(
                    validated_data=(
                        serializer.validated_data
                    ),
                    user=request.user,
                )
            )

        except DjangoValidationError as exc:
            convertir_error_servicio(
                exc
            )

        return Response(
            ComponenteSerializer(
                componente
            ).data,
            status=status.HTTP_201_CREATED,
        )


# ============================================================
# OPERACIONES DE ACTIVOS
# ============================================================


class OperacionActivoViewSet(
    viewsets.ViewSet
):
        # --------------------------------------------------------
    # ACTUALIZAR CONFIGURACIÓN
    # --------------------------------------------------------

    @action(
        detail=True,
        methods=["post"],
        url_path="actualizar-configuracion",
    )
    def actualizar_configuracion(
        self,
        request,
        pk=None,
    ):
        serializer = (
            ActualizarConfiguracionActivoSerializer(
                data=request.data,
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        try:
            activo = (
                actualizar_configuracion_activo(
                    activo_id=pk,

                    hostname=(
                        serializer
                        .validated_data
                        .get(
                            "hostname",
                            "",
                        )
                    ),
                    mac_address=(
                        serializer
                        .validated_data
                        .get(
                            "mac_address",
                            "",
                        )
                    ),

                    sistema_operativo_id=(
                        serializer
                        .validated_data
                        .get(
                            "sistema_operativo_id"
                        )
                    ),

                    user=request.user,
                )
            )

        except ObjectDoesNotExist:
            raise NotFound(
                "Activo no encontrado."
            )

        except DjangoValidationError as exc:
            convertir_error_servicio(
                exc
            )

        return Response(
            ActivoSerializer(
                activo
            ).data
        )



    # --------------------------------------------------------
    # ASIGNAR / TRASLADAR
    # --------------------------------------------------------

    @action(
        detail=True,
        methods=["post"],
        url_path="asignar-equipo",
    )
    def asignar_equipo(
        self,
        request,
        pk=None,
    ):
        serializer = (
            AsignarActivoEquipoSerializer(
                data=request.data,
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        try:
            activo = (
                asignar_activo_equipo(
                    activo_id=pk,

                    equipo_destino_id=(
                        serializer
                        .validated_data[
                            "equipo_destino_id"
                        ]
                    ),

                    user=request.user,

                    observaciones=(
                        serializer
                        .validated_data
                        .get(
                            "observaciones",
                            "",
                        )
                    ),
                )
            )

        except ObjectDoesNotExist:
            raise NotFound(
                "El activo o equipo de trabajo no existe."
            )

        except DjangoValidationError as exc:
            convertir_error_servicio(
                exc
            )

        return Response(
            ActivoSerializer(
                activo
            ).data
        )


    # --------------------------------------------------------
    # ENVIAR A STOCK
    # --------------------------------------------------------

    @action(
        detail=True,
        methods=["post"],
        url_path="enviar-stock",
    )
    def enviar_stock(
        self,
        request,
        pk=None,
    ):
        serializer = (
            ObservacionOperacionSerializer(
                data=request.data,
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        try:
            activo = (
                enviar_activo_stock(
                    activo_id=pk,

                    user=request.user,

                    observaciones=(
                        serializer
                        .validated_data
                        .get(
                            "observaciones",
                            "",
                        )
                    ),
                )
            )

        except ObjectDoesNotExist:
            raise NotFound(
                "Activo no encontrado."
            )

        except DjangoValidationError as exc:
            convertir_error_servicio(
                exc
            )

        return Response(
            ActivoSerializer(
                activo
            ).data
        )


    # --------------------------------------------------------
    # MARCAR DEFECTUOSO
    # --------------------------------------------------------

    @action(
        detail=True,
        methods=["post"],
        url_path="marcar-defectuoso",
    )
    def marcar_defectuoso(
        self,
        request,
        pk=None,
    ):
        serializer = (
            ObservacionOperacionSerializer(
                data=request.data,
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        try:
            activo = (
                marcar_activo_defectuoso(
                    activo_id=pk,

                    user=request.user,

                    observaciones=(
                        serializer
                        .validated_data
                        .get(
                            "observaciones",
                            "",
                        )
                    ),
                )
            )

        except ObjectDoesNotExist:
            raise NotFound(
                "Activo no encontrado."
            )

        except DjangoValidationError as exc:
            convertir_error_servicio(
                exc
            )

        return Response(
            ActivoSerializer(
                activo
            ).data
        )


    # --------------------------------------------------------
    # MARCAR OPERATIVO
    # --------------------------------------------------------

    @action(
        detail=True,
        methods=["post"],
        url_path="marcar-operativo",
    )
    def marcar_operativo(
        self,
        request,
        pk=None,
    ):
        serializer = (
            ObservacionOperacionSerializer(
                data=request.data,
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        try:
            activo = (
                marcar_activo_operativo(
                    activo_id=pk,

                    user=request.user,

                    observaciones=(
                        serializer
                        .validated_data
                        .get(
                            "observaciones",
                            "",
                        )
                    ),
                )
            )

        except ObjectDoesNotExist:
            raise NotFound(
                "Activo no encontrado."
            )

        except DjangoValidationError as exc:
            convertir_error_servicio(
                exc
            )

        return Response(
            ActivoSerializer(
                activo
            ).data
        )


    # --------------------------------------------------------
    # ENVIAR A REPARACIÓN
    # --------------------------------------------------------

    @action(
        detail=True,
        methods=["post"],
        url_path="enviar-reparacion",
    )
    def enviar_reparacion(
        self,
        request,
        pk=None,
    ):
        serializer = (
            ObservacionOperacionSerializer(
                data=request.data,
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        try:
            activo = (
                enviar_activo_reparacion(
                    activo_id=pk,

                    user=request.user,

                    observaciones=(
                        serializer
                        .validated_data
                        .get(
                            "observaciones",
                            "",
                        )
                    ),
                )
            )

        except ObjectDoesNotExist:
            raise NotFound(
                "Activo no encontrado."
            )

        except DjangoValidationError as exc:
            convertir_error_servicio(
                exc
            )

        return Response(
            ActivoSerializer(
                activo
            ).data
        )


    # --------------------------------------------------------
    # RETORNO DE REPARACIÓN
    # --------------------------------------------------------

    @action(
        detail=True,
        methods=["post"],
        url_path="retornar-reparacion-stock",
    )
    def retornar_reparacion_stock(
        self,
        request,
        pk=None,
    ):
        serializer = (
            ObservacionOperacionSerializer(
                data=request.data,
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        try:
            activo = (
                retornar_activo_reparacion_stock(
                    activo_id=pk,

                    user=request.user,

                    observaciones=(
                        serializer
                        .validated_data
                        .get(
                            "observaciones",
                            "",
                        )
                    ),
                )
            )

        except ObjectDoesNotExist:
            raise NotFound(
                "Activo no encontrado."
            )

        except DjangoValidationError as exc:
            convertir_error_servicio(
                exc
            )

        return Response(
            ActivoSerializer(
                activo
            ).data
        )


    # --------------------------------------------------------
    # BAJA DEFINITIVA
    # --------------------------------------------------------

    @action(
        detail=True,
        methods=["post"],
        url_path="dar-baja",
    )
    def dar_baja(
        self,
        request,
        pk=None,
    ):
        serializer = (
            ObservacionOperacionSerializer(
                data=request.data,
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        try:
            activo = (
                dar_baja_activo(
                    activo_id=pk,

                    user=request.user,

                    observaciones=(
                        serializer
                        .validated_data
                        .get(
                            "observaciones",
                            "",
                        )
                    ),
                )
            )

        except ObjectDoesNotExist:
            raise NotFound(
                "Activo no encontrado."
            )

        except DjangoValidationError as exc:
            convertir_error_servicio(
                exc
            )

        return Response(
            ActivoSerializer(
                activo
            ).data
        )


# ============================================================
# HISTORIAL DE COMPONENTES
# ============================================================


class MovimientoComponenteViewSet(
    viewsets.ReadOnlyModelViewSet
):
    serializer_class = (
        MovimientoComponenteSerializer
    )

    def get_queryset(self):
        queryset = (
            MovimientoComponente
            .objects
            .filter(
                is_deleted=False,
            )
            .select_related(
                "componente",
                "componente__tipo_componente",
                "activo_origen",
                "activo_destino",
                "user_made",
            )
        )

        componente = (
            self.request
            .query_params
            .get(
                "componente"
            )
        )

        activo = (
            self.request
            .query_params
            .get(
                "activo"
            )
        )

        tipo = (
            self.request
            .query_params
            .get(
                "tipo"
            )
        )


        if componente:
            queryset = (
                queryset.filter(
                    componente_id=componente
                )
            )


        if activo:
            queryset = (
                queryset.filter(
                    models.Q(
                        activo_origen_id=activo
                    )
                    |
                    models.Q(
                        activo_destino_id=activo
                    )
                )
            )


        if tipo:
            queryset = (
                queryset.filter(
                    tipo_movimiento=tipo
                )
            )


        return queryset.order_by(
            "-created_at",
            "-id",
        )


# ============================================================
# HISTORIAL DE ACTIVOS
# ============================================================


class MovimientoActivoViewSet(
    viewsets.ReadOnlyModelViewSet
):
    serializer_class = (
        MovimientoActivoSerializer
    )

    def get_queryset(self):
        queryset = (
            MovimientoActivo
            .objects
            .filter(
                is_deleted=False,
            )
            .select_related(
                "activo",
                "sector_origen",
                "sector_destino",
                "equipo_origen",
                "equipo_destino",
                "user_made",
            )
        )

        activo = (
            self.request
            .query_params
            .get(
                "activo"
            )
        )

        tipo = (
            self.request
            .query_params
            .get(
                "tipo"
            )
        )


        if activo:
            queryset = (
                queryset.filter(
                    activo_id=activo
                )
            )


        if tipo:
            queryset = (
                queryset.filter(
                    tipo_movimiento=tipo
                )
            )


        return queryset.order_by(
            "-created_at",
            "-id",
        )