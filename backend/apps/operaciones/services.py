from django.core.exceptions import ValidationError
from django.db import transaction

from apps.inventario.models import (
    Activo,
    Componente,
    EquipoTrabajo,
    EstadoActivo,
    EstadoComponente,
)

from .models import (
    MovimientoActivo,
    MovimientoComponente,
    TipoMovimientoActivo,
    TipoMovimientoComponente,
    UbicacionActivo,
    UbicacionComponente,
)


# ============================================================
# HELPERS GENERALES
# ============================================================


def _usuario_autenticado(user):
    """
    Durante desarrollo pueden llegar peticiones sin autenticación.

    Devuelve el usuario únicamente si es un usuario autenticado.
    En caso contrario devuelve None.

    Cuando el frontend implemente autenticación real,
    estos servicios comenzarán a registrar automáticamente
    user_made y user_updated.
    """

    if (
        user
        and getattr(
            user,
            "is_authenticated",
            False,
        )
    ):
        return user

    return None


# ============================================================
# HELPERS COMPONENTES
# ============================================================


def _crear_movimiento_componente(
    *,
    componente,
    tipo_movimiento,
    ubicacion_origen,
    ubicacion_destino,
    activo_origen,
    activo_destino,
    estado_anterior,
    estado_nuevo,
    user,
    observaciones="",
):
    """
    Registra el movimiento histórico de un componente.

    Si existe un usuario autenticado, queda registrado
    en user_made.

    Durante pruebas sin autenticación, el movimiento
    igualmente se registra.
    """

    datos = {
        "componente": componente,

        "tipo_movimiento": tipo_movimiento,

        "ubicacion_origen": ubicacion_origen,
        "activo_origen": activo_origen,

        "ubicacion_destino": ubicacion_destino,
        "activo_destino": activo_destino,

        "estado_anterior": estado_anterior,
        "estado_nuevo": estado_nuevo,

        "observaciones": observaciones,
    }

    usuario = _usuario_autenticado(
        user
    )

    if usuario:
        datos["user_made"] = usuario

    return (
        MovimientoComponente
        .objects
        .create(
            **datos
        )
    )


def _obtener_componente_bloqueado(
    componente_id,
):
    """
    Bloquea exclusivamente la fila del componente.

    of=("self",) evita problemas de PostgreSQL cuando
    select_related incluye relaciones nullable.
    """

    return (
        Componente.objects
        .select_for_update(
            of=("self",)
        )
        .select_related(
            "tipo_componente",
            "activo",
            "activo__tipo_activo",
        )
        .get(
            pk=componente_id,
            is_deleted=False,
        )
    )


def _guardar_componente(
    componente,
    *,
    user,
    campos,
):
    """
    Guarda un componente y actualiza user_updated
    solamente cuando existe un usuario autenticado.
    """

    usuario = _usuario_autenticado(
        user
    )

    update_fields = list(
        campos
    )

    if usuario:
        componente.user_updated = usuario

        if (
            "user_updated"
            not in update_fields
        ):
            update_fields.append(
                "user_updated"
            )

    if (
        "updated_at"
        not in update_fields
    ):
        update_fields.append(
            "updated_at"
        )

    componente.full_clean()

    componente.save(
        update_fields=update_fields
    )


# ============================================================
# INSTALAR COMPONENTE EN ACTIVO
# ============================================================


@transaction.atomic
def instalar_componente(
    *,
    componente_id,
    activo_id,
    user,
    observaciones="",
):
    """
    Instala un componente disponible en un activo.

    Ejemplo:

        RAM 8 GB

        Stock
          ↓
        CPU-001

        DISPONIBLE -> INSTALADO
    """

    componente = (
        _obtener_componente_bloqueado(
            componente_id
        )
    )

    activo = (
        Activo.objects
        .select_for_update(
            of=("self",)
        )
        .select_related(
            "tipo_activo",
        )
        .get(
            pk=activo_id,
            is_deleted=False,
        )
    )


    # --------------------------------------------------------
    # VALIDACIONES
    # --------------------------------------------------------

    if componente.activo_id:
        raise ValidationError(
            "El componente ya se encuentra "
            "asociado a un activo."
        )


    if (
        componente.estado
        != EstadoComponente.DISPONIBLE
    ):
        raise ValidationError(
            "Solo se pueden instalar componentes "
            "que estén disponibles en stock."
        )


    if activo.estado == EstadoActivo.BAJA:
        raise ValidationError(
            "No se pueden instalar componentes "
            "en un activo dado de baja."
        )


    permitido = (
        componente
        .tipo_componente
        .tipos_activo_permitidos
        .filter(
            pk=activo.tipo_activo_id,
        )
        .exists()
    )


    if not permitido:
        raise ValidationError(
            f"{componente.tipo_componente.nombre} "
            f"no puede instalarse en un activo "
            f"de tipo {activo.tipo_activo.nombre}."
        )


    estado_anterior = (
        componente.estado
    )


    # --------------------------------------------------------
    # ACTUALIZAR
    # --------------------------------------------------------

    componente.activo = activo

    componente.estado = (
        EstadoComponente.INSTALADO
    )


    _guardar_componente(
        componente,
        user=user,
        campos=[
            "activo",
            "estado",
        ],
    )


    # --------------------------------------------------------
    # MOVIMIENTO
    # --------------------------------------------------------

    _crear_movimiento_componente(
        componente=componente,

        tipo_movimiento=(
            TipoMovimientoComponente.INSTALACION
        ),

        ubicacion_origen=(
            UbicacionComponente.STOCK
        ),

        ubicacion_destino=(
            UbicacionComponente.ACTIVO
        ),

        activo_origen=None,
        activo_destino=activo,

        estado_anterior=estado_anterior,

        estado_nuevo=(
            EstadoComponente.INSTALADO
        ),

        user=user,

        observaciones=observaciones,
    )

    return componente


# ============================================================
# MARCAR COMPONENTE DEFECTUOSO
# ============================================================


@transaction.atomic
def marcar_componente_defectuoso(
    *,
    componente_id,
    user,
    observaciones="",
):
    """
    Marca un componente como defectuoso sin retirarlo.

    Sigue físicamente asociado al activo.

    INSTALADO -> DEFECTUOSO
    """

    componente = (
        _obtener_componente_bloqueado(
            componente_id
        )
    )


    if not componente.activo_id:
        raise ValidationError(
            "El componente no está instalado "
            "en ningún activo."
        )


    if (
        componente.estado
        != EstadoComponente.INSTALADO
    ):
        raise ValidationError(
            "Solo un componente instalado puede "
            "marcarse como defectuoso desde el activo."
        )


    activo = componente.activo

    estado_anterior = (
        componente.estado
    )


    componente.estado = (
        EstadoComponente.DEFECTUOSO
    )


    _guardar_componente(
        componente,
        user=user,
        campos=[
            "estado",
        ],
    )


    _crear_movimiento_componente(
        componente=componente,

        tipo_movimiento=(
            TipoMovimientoComponente.CAMBIO_ESTADO
        ),

        ubicacion_origen=(
            UbicacionComponente.ACTIVO
        ),

        ubicacion_destino=(
            UbicacionComponente.ACTIVO
        ),

        activo_origen=activo,
        activo_destino=activo,

        estado_anterior=estado_anterior,

        estado_nuevo=(
            EstadoComponente.DEFECTUOSO
        ),

        user=user,

        observaciones=observaciones,
    )


    return componente


# ============================================================
# MARCAR COMPONENTE NUEVAMENTE OPERATIVO
# ============================================================


@transaction.atomic
def marcar_componente_operativo(
    *,
    componente_id,
    user,
    observaciones="",
):
    """
    Devuelve a INSTALADO un componente defectuoso
    que continúa físicamente dentro del activo.

    DEFECTUOSO -> INSTALADO
    """

    componente = (
        _obtener_componente_bloqueado(
            componente_id
        )
    )


    if not componente.activo_id:
        raise ValidationError(
            "El componente no está asociado "
            "a ningún activo."
        )


    if (
        componente.estado
        != EstadoComponente.DEFECTUOSO
    ):
        raise ValidationError(
            "Solo un componente defectuoso puede "
            "marcarse nuevamente como operativo."
        )


    activo = componente.activo

    estado_anterior = (
        componente.estado
    )


    componente.estado = (
        EstadoComponente.INSTALADO
    )


    _guardar_componente(
        componente,
        user=user,
        campos=[
            "estado",
        ],
    )


    _crear_movimiento_componente(
        componente=componente,

        tipo_movimiento=(
            TipoMovimientoComponente.CAMBIO_ESTADO
        ),

        ubicacion_origen=(
            UbicacionComponente.ACTIVO
        ),

        ubicacion_destino=(
            UbicacionComponente.ACTIVO
        ),

        activo_origen=activo,
        activo_destino=activo,

        estado_anterior=estado_anterior,

        estado_nuevo=(
            EstadoComponente.INSTALADO
        ),

        user=user,

        observaciones=observaciones,
    )


    return componente


# ============================================================
# RETIRAR COMPONENTE A STOCK
# ============================================================


@transaction.atomic
def enviar_componente_stock(
    *,
    componente_id,
    user,
    observaciones="",
):
    """
    Retira físicamente el componente del activo.

    Resultado:

        activo = None
        estado = DISPONIBLE
    """

    componente = (
        _obtener_componente_bloqueado(
            componente_id
        )
    )


    if not componente.activo_id:
        raise ValidationError(
            "El componente ya se encuentra "
            "fuera de un activo."
        )


    if componente.estado not in (
        EstadoComponente.INSTALADO,
        EstadoComponente.DEFECTUOSO,
    ):
        raise ValidationError(
            "El componente no puede enviarse "
            "a stock desde su estado actual."
        )


    activo_origen = (
        componente.activo
    )

    estado_anterior = (
        componente.estado
    )


    componente.activo = None

    componente.estado = (
        EstadoComponente.DISPONIBLE
    )


    _guardar_componente(
        componente,
        user=user,
        campos=[
            "activo",
            "estado",
        ],
    )


    _crear_movimiento_componente(
        componente=componente,

        tipo_movimiento=(
            TipoMovimientoComponente.RETIRO_STOCK
        ),

        ubicacion_origen=(
            UbicacionComponente.ACTIVO
        ),

        ubicacion_destino=(
            UbicacionComponente.STOCK
        ),

        activo_origen=activo_origen,
        activo_destino=None,

        estado_anterior=estado_anterior,

        estado_nuevo=(
            EstadoComponente.DISPONIBLE
        ),

        user=user,

        observaciones=observaciones,
    )


    return componente


# ============================================================
# ENVIAR COMPONENTE A REPARACIÓN
# ============================================================


@transaction.atomic
def enviar_componente_reparacion(
    *,
    componente_id,
    user,
    observaciones="",
):
    """
    Retira el componente del activo y lo envía
    a reparación.

    Resultado:

        activo = None
        estado = EN_REPARACION
    """

    componente = (
        _obtener_componente_bloqueado(
            componente_id
        )
    )


    if not componente.activo_id:
        raise ValidationError(
            "El componente no está instalado "
            "en ningún activo."
        )


    if componente.estado not in (
        EstadoComponente.INSTALADO,
        EstadoComponente.DEFECTUOSO,
    ):
        raise ValidationError(
            "El componente no puede enviarse "
            "a reparación desde su estado actual."
        )


    activo_origen = (
        componente.activo
    )

    estado_anterior = (
        componente.estado
    )


    componente.activo = None

    componente.estado = (
        EstadoComponente.EN_REPARACION
    )


    _guardar_componente(
        componente,
        user=user,
        campos=[
            "activo",
            "estado",
        ],
    )


    _crear_movimiento_componente(
        componente=componente,

        tipo_movimiento=(
            TipoMovimientoComponente.ENVIO_REPARACION
        ),

        ubicacion_origen=(
            UbicacionComponente.ACTIVO
        ),

        ubicacion_destino=(
            UbicacionComponente.REPARACION
        ),

        activo_origen=activo_origen,
        activo_destino=None,

        estado_anterior=estado_anterior,

        estado_nuevo=(
            EstadoComponente.EN_REPARACION
        ),

        user=user,

        observaciones=observaciones,
    )


    return componente


# ============================================================
# RETORNO COMPONENTE DE REPARACIÓN
# ============================================================


@transaction.atomic
def retornar_componente_reparacion_stock(
    *,
    componente_id,
    user,
    observaciones="",
):
    """
    Registra el retorno de reparación.

    EN_REPARACION -> DISPONIBLE
    """

    componente = (
        _obtener_componente_bloqueado(
            componente_id
        )
    )


    if componente.activo_id:
        raise ValidationError(
            "Un componente en reparación no debería "
            "estar asociado a un activo."
        )


    if (
        componente.estado
        != EstadoComponente.EN_REPARACION
    ):
        raise ValidationError(
            "El componente no se encuentra "
            "en reparación."
        )


    estado_anterior = (
        componente.estado
    )


    componente.estado = (
        EstadoComponente.DISPONIBLE
    )


    _guardar_componente(
        componente,
        user=user,
        campos=[
            "estado",
        ],
    )


    _crear_movimiento_componente(
        componente=componente,

        tipo_movimiento=(
            TipoMovimientoComponente.RETORNO_REPARACION
        ),

        ubicacion_origen=(
            UbicacionComponente.REPARACION
        ),

        ubicacion_destino=(
            UbicacionComponente.STOCK
        ),

        activo_origen=None,
        activo_destino=None,

        estado_anterior=estado_anterior,

        estado_nuevo=(
            EstadoComponente.DISPONIBLE
        ),

        user=user,

        observaciones=observaciones,
    )


    return componente


# ============================================================
# BAJA DEFINITIVA COMPONENTE
# ============================================================


@transaction.atomic
def dar_baja_componente(
    *,
    componente_id,
    user,
    observaciones="",
):
    """
    Baja definitiva.

    El registro NO se elimina.

    Resultado:

        activo = None
        estado = BAJA
    """

    componente = (
        _obtener_componente_bloqueado(
            componente_id
        )
    )


    if (
        componente.estado
        == EstadoComponente.BAJA
    ):
        raise ValidationError(
            "El componente ya se encuentra "
            "dado de baja."
        )


    activo_origen = (
        componente.activo
    )

    estado_anterior = (
        componente.estado
    )


    if activo_origen:
        ubicacion_origen = (
            UbicacionComponente.ACTIVO
        )

    elif (
        estado_anterior
        == EstadoComponente.EN_REPARACION
    ):
        ubicacion_origen = (
            UbicacionComponente.REPARACION
        )

    else:
        ubicacion_origen = (
            UbicacionComponente.STOCK
        )


    componente.activo = None

    componente.estado = (
        EstadoComponente.BAJA
    )


    _guardar_componente(
        componente,
        user=user,
        campos=[
            "activo",
            "estado",
        ],
    )


    _crear_movimiento_componente(
        componente=componente,

        tipo_movimiento=(
            TipoMovimientoComponente.BAJA
        ),

        ubicacion_origen=ubicacion_origen,

        ubicacion_destino=(
            UbicacionComponente.BAJA
        ),

        activo_origen=activo_origen,
        activo_destino=None,

        estado_anterior=estado_anterior,

        estado_nuevo=(
            EstadoComponente.BAJA
        ),

        user=user,

        observaciones=observaciones,
    )


    return componente


# ============================================================
# HELPERS ACTIVOS
# ============================================================

def _obtener_activo_bloqueado(
    activo_id,
):
    return (
        Activo.objects
        .select_for_update(
            of=("self",)
        )
        .select_related(
            "tipo_activo",
            "sector",
            "equipo_trabajo",
            "sistema_operativo",
        )
        .get(
            pk=activo_id,
            is_deleted=False,
        )
    )


def _crear_movimiento_activo(
    *,
    activo,
    tipo_movimiento,
    ubicacion_origen,
    ubicacion_destino,
    sector_origen,
    sector_destino,
    equipo_origen,
    equipo_destino,
    estado_anterior,
    estado_nuevo,
    user,
    observaciones="",
):
    """
    Registra MovimientoActivo.

    user_made solamente se guarda si existe
    un usuario autenticado.
    """

    datos = {
        "activo": activo,

        "tipo_movimiento": tipo_movimiento,

        "ubicacion_origen":
            ubicacion_origen,

        "sector_origen":
            sector_origen,

        "equipo_origen":
            equipo_origen,

        "ubicacion_destino":
            ubicacion_destino,

        "sector_destino":
            sector_destino,

        "equipo_destino":
            equipo_destino,

        "estado_anterior":
            estado_anterior,

        "estado_nuevo":
            estado_nuevo,

        "observaciones":
            observaciones,
    }


    usuario = _usuario_autenticado(
        user
    )


    if usuario:
        datos["user_made"] = usuario


    return (
        MovimientoActivo
        .objects
        .create(
            **datos
        )
    )


def _guardar_activo(
    activo,
    *,
    user,
    campos,
):
    """
    Guarda Activo sin intentar asignar AnonymousUser
    a user_updated.
    """

    usuario = _usuario_autenticado(
        user
    )

    update_fields = list(
        campos
    )


    if usuario:
        activo.user_updated = usuario

        if (
            "user_updated"
            not in update_fields
        ):
            update_fields.append(
                "user_updated"
            )


    if (
        "updated_at"
        not in update_fields
    ):
        update_fields.append(
            "updated_at"
        )


    activo.full_clean()


    activo.save(
        update_fields=update_fields
    )


def _determinar_ubicacion_actual_activo(
    activo,
):
    if (
        activo.estado
        == EstadoActivo.BAJA
    ):
        return (
            UbicacionActivo.BAJA
        )


    if (
        activo.estado
        == EstadoActivo.EN_REPARACION
    ):
        return (
            UbicacionActivo.REPARACION
        )


    if activo.equipo_trabajo_id:
        return (
            UbicacionActivo.EQUIPO_TRABAJO
        )


    return (
        UbicacionActivo.STOCK
    )


# ============================================================
# ASIGNAR / MOVER ACTIVO A EQUIPO DE TRABAJO
# ============================================================


@transaction.atomic
def asignar_activo_equipo(
    *,
    activo_id,
    equipo_destino_id,
    user,
    observaciones="",
):
    """
    Sirve tanto para:

        Stock -> EquipoTrabajo

    como:

        EquipoTrabajo A -> EquipoTrabajo B
    """

    activo = (
        _obtener_activo_bloqueado(
            activo_id
        )
    )


    equipo_destino = (
        EquipoTrabajo.objects
        .select_for_update(
            of=("self",)
        )
        .select_related(
            "sector",
        )
        .get(
            pk=equipo_destino_id,
            is_deleted=False,
        )
    )


    if (
        activo.estado
        == EstadoActivo.BAJA
    ):
        raise ValidationError(
            "Un activo dado de baja no puede "
            "volver a asignarse."
        )


    if (
        activo.estado
        == EstadoActivo.EN_REPARACION
    ):
        raise ValidationError(
            "El activo está en reparación. "
            "Debe retornar primero a stock."
        )


    if (
        activo.equipo_trabajo_id
        == equipo_destino.id
    ):
        raise ValidationError(
            "El activo ya pertenece a este "
            "equipo de trabajo."
        )


    sector_origen = (
        activo.sector
    )

    equipo_origen = (
        activo.equipo_trabajo
    )

    estado_anterior = (
        activo.estado
    )

    ubicacion_origen = (
        _determinar_ubicacion_actual_activo(
            activo
        )
    )


    if equipo_origen:
        tipo_movimiento = (
            TipoMovimientoActivo.TRASLADO
        )

    else:
        tipo_movimiento = (
            TipoMovimientoActivo.SALIDA_STOCK
        )


    activo.sector = (
        equipo_destino.sector
    )

    activo.equipo_trabajo = (
        equipo_destino
    )

    activo.estado = (
        EstadoActivo.EN_USO
    )


    _guardar_activo(
        activo,
        user=user,
        campos=[
            "sector",
            "equipo_trabajo",
            "estado",
        ],
    )


    _crear_movimiento_activo(
        activo=activo,

        tipo_movimiento=tipo_movimiento,

        ubicacion_origen=
            ubicacion_origen,

        ubicacion_destino=(
            UbicacionActivo.EQUIPO_TRABAJO
        ),

        sector_origen=
            sector_origen,

        sector_destino=(
            equipo_destino.sector
        ),

        equipo_origen=
            equipo_origen,

        equipo_destino=
            equipo_destino,

        estado_anterior=
            estado_anterior,

        estado_nuevo=(
            EstadoActivo.EN_USO
        ),

        user=user,

        observaciones=
            observaciones,
    )


    return activo


# ============================================================
# ENVIAR ACTIVO A STOCK
# ============================================================


@transaction.atomic
def enviar_activo_stock(
    *,
    activo_id,
    user,
    observaciones="",
):
    """
    Retira un activo del EquipoTrabajo.

    Resultado:

        sector = None
        equipo_trabajo = None
        estado = DISPONIBLE

    Los componentes internos permanecen asociados
    al activo.
    """

    activo = (
        _obtener_activo_bloqueado(
            activo_id
        )
    )


    if (
        activo.estado
        == EstadoActivo.BAJA
    ):
        raise ValidationError(
            "El activo está dado de baja."
        )


    if (
        activo.estado
        == EstadoActivo.EN_REPARACION
    ):
        raise ValidationError(
            "El activo está en reparación. "
            "Debe retornar primero de reparación."
        )


    if (
        not activo.equipo_trabajo_id
        and activo.estado
        == EstadoActivo.DISPONIBLE
    ):
        raise ValidationError(
            "El activo ya se encuentra "
            "disponible en stock."
        )


    sector_origen = (
        activo.sector
    )

    equipo_origen = (
        activo.equipo_trabajo
    )

    estado_anterior = (
        activo.estado
    )

    ubicacion_origen = (
        _determinar_ubicacion_actual_activo(
            activo
        )
    )


    activo.sector = None

    activo.equipo_trabajo = None

    activo.estado = (
        EstadoActivo.DISPONIBLE
    )


    _guardar_activo(
        activo,
        user=user,
        campos=[
            "sector",
            "equipo_trabajo",
            "estado",
        ],
    )


    _crear_movimiento_activo(
        activo=activo,

        tipo_movimiento=(
            TipoMovimientoActivo.RETIRO_STOCK
        ),

        ubicacion_origen=
            ubicacion_origen,

        ubicacion_destino=(
            UbicacionActivo.STOCK
        ),

        sector_origen=
            sector_origen,

        sector_destino=None,

        equipo_origen=
            equipo_origen,

        equipo_destino=None,

        estado_anterior=
            estado_anterior,

        estado_nuevo=(
            EstadoActivo.DISPONIBLE
        ),

        user=user,

        observaciones=
            observaciones,
    )


    return activo


# ============================================================
# MARCAR ACTIVO DEFECTUOSO
# ============================================================


@transaction.atomic
def marcar_activo_defectuoso(
    *,
    activo_id,
    user,
    observaciones="",
):
    """
    Cambia el estado sin mover el activo.

    EN_USO -> DEFECTUOSO

    o

    DISPONIBLE -> DEFECTUOSO
    """

    activo = (
        _obtener_activo_bloqueado(
            activo_id
        )
    )


    if (
        activo.estado
        == EstadoActivo.BAJA
    ):
        raise ValidationError(
            "Un activo dado de baja no puede "
            "cambiar de estado."
        )


    if (
        activo.estado
        == EstadoActivo.DEFECTUOSO
    ):
        raise ValidationError(
            "El activo ya está marcado "
            "como defectuoso."
        )


    if (
        activo.estado
        == EstadoActivo.EN_REPARACION
    ):
        raise ValidationError(
            "El activo se encuentra "
            "en reparación."
        )


    sector = activo.sector

    equipo = (
        activo.equipo_trabajo
    )

    estado_anterior = (
        activo.estado
    )

    ubicacion = (
        _determinar_ubicacion_actual_activo(
            activo
        )
    )


    activo.estado = (
        EstadoActivo.DEFECTUOSO
    )


    _guardar_activo(
        activo,
        user=user,
        campos=[
            "estado",
        ],
    )


    _crear_movimiento_activo(
        activo=activo,

        tipo_movimiento=(
            TipoMovimientoActivo.CAMBIO_ESTADO
        ),

        ubicacion_origen=
            ubicacion,

        ubicacion_destino=
            ubicacion,

        sector_origen=
            sector,

        sector_destino=
            sector,

        equipo_origen=
            equipo,

        equipo_destino=
            equipo,

        estado_anterior=
            estado_anterior,

        estado_nuevo=(
            EstadoActivo.DEFECTUOSO
        ),

        user=user,

        observaciones=
            observaciones,
    )


    return activo


# ============================================================
# MARCAR ACTIVO NUEVAMENTE OPERATIVO
# ============================================================


@transaction.atomic
def marcar_activo_operativo(
    *,
    activo_id,
    user,
    observaciones="",
):
    """
    Si sigue asignado:

        DEFECTUOSO -> EN_USO

    Si está suelto:

        DEFECTUOSO -> DISPONIBLE
    """

    activo = (
        _obtener_activo_bloqueado(
            activo_id
        )
    )


    if (
        activo.estado
        != EstadoActivo.DEFECTUOSO
    ):
        raise ValidationError(
            "Solo un activo defectuoso puede "
            "marcarse nuevamente como operativo."
        )


    sector = (
        activo.sector
    )

    equipo = (
        activo.equipo_trabajo
    )

    estado_anterior = (
        activo.estado
    )

    ubicacion = (
        _determinar_ubicacion_actual_activo(
            activo
        )
    )


    if equipo:
        estado_nuevo = (
            EstadoActivo.EN_USO
        )

    else:
        estado_nuevo = (
            EstadoActivo.DISPONIBLE
        )


    activo.estado = (
        estado_nuevo
    )


    _guardar_activo(
        activo,
        user=user,
        campos=[
            "estado",
        ],
    )


    _crear_movimiento_activo(
        activo=activo,

        tipo_movimiento=(
            TipoMovimientoActivo.CAMBIO_ESTADO
        ),

        ubicacion_origen=
            ubicacion,

        ubicacion_destino=
            ubicacion,

        sector_origen=
            sector,

        sector_destino=
            sector,

        equipo_origen=
            equipo,

        equipo_destino=
            equipo,

        estado_anterior=
            estado_anterior,

        estado_nuevo=
            estado_nuevo,

        user=user,

        observaciones=
            observaciones,
    )


    return activo


# ============================================================
# ENVIAR ACTIVO A REPARACIÓN
# ============================================================


@transaction.atomic
def enviar_activo_reparacion(
    *,
    activo_id,
    user,
    observaciones="",
):
    """
    Envía el activo a reparación.

    Resultado:

        sector = None
        equipo_trabajo = None
        estado = EN_REPARACION
    """

    activo = (
        _obtener_activo_bloqueado(
            activo_id
        )
    )


    if (
        activo.estado
        == EstadoActivo.BAJA
    ):
        raise ValidationError(
            "El activo está dado de baja."
        )


    if (
        activo.estado
        == EstadoActivo.EN_REPARACION
    ):
        raise ValidationError(
            "El activo ya se encuentra "
            "en reparación."
        )


    sector_origen = (
        activo.sector
    )

    equipo_origen = (
        activo.equipo_trabajo
    )

    estado_anterior = (
        activo.estado
    )

    ubicacion_origen = (
        _determinar_ubicacion_actual_activo(
            activo
        )
    )


    activo.sector = None

    activo.equipo_trabajo = None

    activo.estado = (
        EstadoActivo.EN_REPARACION
    )


    _guardar_activo(
        activo,
        user=user,
        campos=[
            "sector",
            "equipo_trabajo",
            "estado",
        ],
    )


    _crear_movimiento_activo(
        activo=activo,

        tipo_movimiento=(
            TipoMovimientoActivo.ENVIO_REPARACION
        ),

        ubicacion_origen=
            ubicacion_origen,

        ubicacion_destino=(
            UbicacionActivo.REPARACION
        ),

        sector_origen=
            sector_origen,

        sector_destino=None,

        equipo_origen=
            equipo_origen,

        equipo_destino=None,

        estado_anterior=
            estado_anterior,

        estado_nuevo=(
            EstadoActivo.EN_REPARACION
        ),

        user=user,

        observaciones=
            observaciones,
    )


    return activo


# ============================================================
# RETORNAR ACTIVO DE REPARACIÓN A STOCK
# ============================================================


@transaction.atomic
def retornar_activo_reparacion_stock(
    *,
    activo_id,
    user,
    observaciones="",
):
    """
    EN_REPARACION -> DISPONIBLE

    El activo vuelve sin sector y sin EquipoTrabajo.
    """

    activo = (
        _obtener_activo_bloqueado(
            activo_id
        )
    )


    if (
        activo.estado
        != EstadoActivo.EN_REPARACION
    ):
        raise ValidationError(
            "El activo no se encuentra "
            "en reparación."
        )


    sector_origen = (
        activo.sector
    )

    equipo_origen = (
        activo.equipo_trabajo
    )

    estado_anterior = (
        activo.estado
    )


    activo.sector = None

    activo.equipo_trabajo = None

    activo.estado = (
        EstadoActivo.DISPONIBLE
    )


    _guardar_activo(
        activo,
        user=user,
        campos=[
            "sector",
            "equipo_trabajo",
            "estado",
        ],
    )


    _crear_movimiento_activo(
        activo=activo,

        tipo_movimiento=(
            TipoMovimientoActivo.RETORNO_REPARACION
        ),

        ubicacion_origen=(
            UbicacionActivo.REPARACION
        ),

        ubicacion_destino=(
            UbicacionActivo.STOCK
        ),

        sector_origen=
            sector_origen,

        sector_destino=None,

        equipo_origen=
            equipo_origen,

        equipo_destino=None,

        estado_anterior=
            estado_anterior,

        estado_nuevo=(
            EstadoActivo.DISPONIBLE
        ),

        user=user,

        observaciones=
            observaciones,
    )


    return activo











# ============================================================
# ACTUALIZAR CONFIGURACIÓN DEL ACTIVO
# ============================================================

@transaction.atomic
def actualizar_configuracion_activo(
    *,
    activo_id,
    hostname,
    mac_address,
    sistema_operativo_id,
    user,
):
    """
    Actualiza únicamente datos de configuración
    que pueden cambiar durante la vida útil del activo:

        - hostname
        - dirección MAC
        - sistema operativo

    No modifica:

        - estado
        - sector
        - equipo de trabajo
        - código de inventario
        - tipo de activo

    El cambio queda registrado en MovimientoActivo.
    """

    activo = (
        _obtener_activo_bloqueado(
            activo_id
        )
    )

    if (
        activo.estado
        == EstadoActivo.BAJA
    ):
        raise ValidationError(
            "No se puede modificar la configuración "
            "de un activo dado de baja."
        )

    # --------------------------------------------------------
    # VALORES ANTERIORES
    # --------------------------------------------------------

    hostname_anterior = (
        activo.hostname or ""
    )

    mac_anterior = (
        activo.mac_address or ""
    )

    sistema_operativo_anterior = (
        activo.sistema_operativo
    )

    sistema_operativo_anterior_nombre = (
        getattr(
            sistema_operativo_anterior,
            "nombre",
            "",
        )
        if sistema_operativo_anterior
        else ""
    )

    # --------------------------------------------------------
    # NORMALIZAR HOSTNAME
    # --------------------------------------------------------

    hostname_nuevo = (
        hostname or ""
    ).strip().upper()

    # --------------------------------------------------------
    # NORMALIZAR MAC
    # --------------------------------------------------------

    mac_nueva = (
        mac_address or ""
    ).strip().upper().replace(
        "-",
        ":",
    )

    # --------------------------------------------------------
    # VALIDAR MAC SEGÚN TIPO DE ACTIVO
    # --------------------------------------------------------

    if (
        mac_nueva
        and not activo.tipo_activo.tiene_mac
    ):
        raise ValidationError(
            "Este tipo de activo no admite "
            "dirección MAC."
        )

    # --------------------------------------------------------
    # RESOLVER NUEVO SISTEMA OPERATIVO
    # --------------------------------------------------------

    sistema_operativo_nuevo = None

    if sistema_operativo_id:
        modelo_so = (
            Activo._meta
            .get_field(
                "sistema_operativo"
            )
            .remote_field
            .model
        )

        try:
            sistema_operativo_nuevo = (
                modelo_so.objects.get(
                    pk=sistema_operativo_id
                )
            )
        except modelo_so.DoesNotExist:
            raise ValidationError(
                "El sistema operativo seleccionado "
                "no existe."
            )

    if (
        sistema_operativo_nuevo
        and not activo.tipo_activo.tiene_sistema_operativo
    ):
        raise ValidationError(
            "Este tipo de activo no admite "
            "sistema operativo."
        )

    sistema_operativo_nuevo_nombre = (
        getattr(
            sistema_operativo_nuevo,
            "nombre",
            "",
        )
        if sistema_operativo_nuevo
        else ""
    )

    # --------------------------------------------------------
    # DETECTAR CAMBIOS
    # --------------------------------------------------------

    cambios = []

    if (
        hostname_anterior
        != hostname_nuevo
    ):
        cambios.append(
            "Hostname: "
            f"{hostname_anterior or 'Sin hostname'} "
            "→ "
            f"{hostname_nuevo or 'Sin hostname'}"
        )

    if (
        mac_anterior
        != mac_nueva
    ):
        cambios.append(
            "MAC: "
            f"{mac_anterior or 'Sin MAC'} "
            "→ "
            f"{mac_nueva or 'Sin MAC'}"
        )

    sistema_operativo_anterior_id = (
        sistema_operativo_anterior.id
        if sistema_operativo_anterior
        else None
    )

    sistema_operativo_nuevo_id = (
        sistema_operativo_nuevo.id
        if sistema_operativo_nuevo
        else None
    )

    if (
        sistema_operativo_anterior_id
        != sistema_operativo_nuevo_id
    ):
        cambios.append(
            "Sistema operativo: "
            f"{sistema_operativo_anterior_nombre or 'Sin sistema operativo'} "
            "→ "
            f"{sistema_operativo_nuevo_nombre or 'Sin sistema operativo'}"
        )

    if not cambios:
        raise ValidationError(
            "No se detectaron cambios en la configuración."
        )

    # --------------------------------------------------------
    # SITUACIÓN ACTUAL
    # --------------------------------------------------------

    ubicacion = (
        _determinar_ubicacion_actual_activo(
            activo
        )
    )

    sector = activo.sector

    equipo = (
        activo.equipo_trabajo
    )

    estado = (
        activo.estado
    )

    # --------------------------------------------------------
    # ACTUALIZAR ACTIVO
    # --------------------------------------------------------

    activo.hostname = (
        hostname_nuevo
    )

    activo.mac_address = (
        mac_nueva
    )

    activo.sistema_operativo = (
        sistema_operativo_nuevo
    )

    _guardar_activo(
        activo,
        user=user,
        campos=[
            "hostname",
            "mac_address",
            "sistema_operativo",
        ],
    )

    # --------------------------------------------------------
    # REGISTRAR HISTORIAL
    # --------------------------------------------------------

    _crear_movimiento_activo(
        activo=activo,

        tipo_movimiento=(
            TipoMovimientoActivo
            .ACTUALIZACION_CONFIGURACION
        ),

        ubicacion_origen=
            ubicacion,

        ubicacion_destino=
            ubicacion,

        sector_origen=
            sector,

        sector_destino=
            sector,

        equipo_origen=
            equipo,

        equipo_destino=
            equipo,

        estado_anterior=
            estado,

        estado_nuevo=
            estado,

        user=user,

        observaciones="\n".join(
            cambios
        ),
    )

    return activo


# ============================================================
# DAR DE BAJA ACTIVO
# ============================================================












@transaction.atomic
def dar_baja_activo(
    *,
    activo_id,
    user,
    observaciones="",
):
    """
    Baja definitiva.

    El registro permanece en la base.

    Resultado:

        sector = None
        equipo_trabajo = None
        estado = BAJA

    Su ubicación anterior queda preservada
    en MovimientoActivo.
    """

    activo = (
        _obtener_activo_bloqueado(
            activo_id
        )
    )


    if (
        activo.estado
        == EstadoActivo.BAJA
    ):
        raise ValidationError(
            "El activo ya está dado de baja."
        )


    sector_origen = (
        activo.sector
    )

    equipo_origen = (
        activo.equipo_trabajo
    )

    estado_anterior = (
        activo.estado
    )

    ubicacion_origen = (
        _determinar_ubicacion_actual_activo(
            activo
        )
    )


    activo.sector = None

    activo.equipo_trabajo = None

    activo.estado = (
        EstadoActivo.BAJA
    )


    _guardar_activo(
        activo,
        user=user,
        campos=[
            "sector",
            "equipo_trabajo",
            "estado",
        ],
    )


    _crear_movimiento_activo(
        activo=activo,

        tipo_movimiento=(
            TipoMovimientoActivo.BAJA
        ),

        ubicacion_origen=
            ubicacion_origen,

        ubicacion_destino=(
            UbicacionActivo.BAJA
        ),

        sector_origen=
            sector_origen,

        sector_destino=None,

        equipo_origen=
            equipo_origen,

        equipo_destino=None,

        estado_anterior=
            estado_anterior,

        estado_nuevo=(
            EstadoActivo.BAJA
        ),

        user=user,

        observaciones=
            observaciones,
    )


    return activo



@transaction.atomic
def crear_componente_stock(
    *,
    validated_data,
    user,
):
    """
    Crea un componente nuevo directamente en stock.

    Resultado:
        activo = None
        estado = DISPONIBLE
    """

    validated_data = validated_data.copy()

    validated_data["activo"] = None

    validated_data["estado"] = (
        EstadoComponente.DISPONIBLE
    )

    componente = Componente(
        **validated_data
    )

    usuario = _usuario_autenticado(
        user
    )

    if usuario:
        componente.user_created = usuario
        componente.user_updated = usuario

    componente.full_clean()

    componente.save()

    return componente