from django.db import transaction

from .models import (
    Activo,
    Componente,
    EstadoComponente,
    TipoActivo,
)


@transaction.atomic
def crear_activo(*, validated_data, user):

    # --------------------------------------------------------
    # COMPONENTES
    # --------------------------------------------------------

    componentes_data = validated_data.pop(
        "componentes",
        [],
    )

    # --------------------------------------------------------
    # TIPO DE ACTIVO
    # --------------------------------------------------------

    tipo_activo_recibido = validated_data[
        "tipo_activo"
    ]

    tipo_activo = (
        TipoActivo.objects
        .select_for_update()
        .get(
            pk=tipo_activo_recibido.pk
        )
    )

    prefijo = (
        tipo_activo.prefijo
        .strip()
        .upper()
    )

    # --------------------------------------------------------
    # GENERAR CÓDIGO DE INVENTARIO
    # --------------------------------------------------------

    ultimo_numero = 0

    codigos = (
        Activo.objects
        .filter(
            codigo_inventario__startswith=(
                f"{prefijo}-"
            ),
        )
        .values_list(
            "codigo_inventario",
            flat=True,
        )
    )

    for codigo in codigos:

        try:
            parte_numerica = (
                codigo.rsplit(
                    "-",
                    1,
                )[1]
            )

            numero = int(
                parte_numerica
            )

            if numero > ultimo_numero:
                ultimo_numero = numero

        except (
            ValueError,
            IndexError,
        ):
            continue

    siguiente_numero = (
        ultimo_numero + 1
    )

    codigo_inventario = (
        f"{prefijo}-"
        f"{siguiente_numero:03d}"
    )

    # --------------------------------------------------------
    # CREAR ACTIVO
    # --------------------------------------------------------

    datos = {
        key: value
        for key, value
        in validated_data.items()
        if key != "tipo_activo"
    }

    activo = Activo(
        codigo_inventario=(
            codigo_inventario
        ),
        tipo_activo=tipo_activo,
        **datos,
    )

    if (
        user
        and user.is_authenticated
    ):
        activo.user_made = user

    activo.full_clean()
    activo.save()

    # --------------------------------------------------------
    # CREAR COMPONENTES ASOCIADOS
    # --------------------------------------------------------

    for componente_data in componentes_data:

        tipo_componente = (
            componente_data[
                "tipo_componente"
            ]
        )

        componente = Componente(
            tipo_componente=(
                tipo_componente
            ),

            activo=activo,

            marca=(
                componente_data.get(
                    "marca",
                    "",
                )
            ),

            modelo=(
                componente_data.get(
                    "modelo",
                    "",
                )
            ),

            numero_serie=(
                componente_data.get(
                    "numero_serie",
                    "",
                )
            ),

            capacidad_valor=(
                componente_data.get(
                    "capacidad_valor"
                )
            ),

            capacidad_unidad=(
                componente_data.get(
                    "capacidad_unidad",
                    "",
                )
            ),

            fecha_adquisicion=(
                componente_data.get(
                    "fecha_adquisicion"
                )
            ),

            estado=(
                EstadoComponente.INSTALADO
            ),

            observaciones=(
                componente_data.get(
                    "observaciones",
                    "",
                )
            ),
        )

        if (
            user
            and user.is_authenticated
        ):
            componente.user_made = user

        componente.full_clean()
        componente.save()

    return activo