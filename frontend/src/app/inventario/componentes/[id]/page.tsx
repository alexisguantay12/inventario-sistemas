"use client";

import Link from "next/link";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import type {
  ReactNode,
} from "react";

import {
  useParams,
} from "next/navigation";

import {
  apiGet,
  apiPatch,
  apiPost,
} from "@/lib/api";

import type {
  Componente,
} from "@/types";


/* ============================================================
   TIPOS
============================================================ */

type VistaGestion =
  | "MENU"
  | "DEFECTUOSO"
  | "OPERATIVO"
  | "STOCK"
  | "REPARACION"
  | "RETORNO_REPARACION"
  | "BAJA";


type MovimientoComponente = {
  id: number;

  componente: number;

  componente_nombre?: string | null;

  tipo_movimiento: string;
  tipo_movimiento_nombre: string;

  ubicacion_origen: string;
  ubicacion_origen_nombre: string;

  activo_origen: number | null;
  activo_origen_codigo: string | null;

  ubicacion_destino: string;
  ubicacion_destino_nombre: string;

  activo_destino: number | null;
  activo_destino_codigo: string | null;

  estado_anterior: string;
  estado_nuevo: string;

  observaciones?: string | null;

  usuario_nombre?: string | null;

  created_at: string;
};


type FormEdicion = {
  marca: string;
  modelo: string;
  capacidad_valor: string;
  capacidad_unidad: string;
  fecha_adquisicion: string;
};


/* ============================================================
   HELPERS
============================================================ */

function estadoLabel(
  estado: string,
) {
  const labels: Record<
    string,
    string
  > = {
    INSTALADO: "Instalado",
    DISPONIBLE: "Disponible",
    RESERVADO: "Reservado",
    EN_REPARACION:
      "En reparación",
    DEFECTUOSO: "Defectuoso",
    BAJA: "Dado de baja",
  };

  return (
    labels[estado] ??
    estado
  );
}


function estadoClasses(
  estado: string,
) {
  switch (estado) {
    case "INSTALADO":
      return "border-emerald-100 bg-emerald-50 text-emerald-700";

    case "DISPONIBLE":
      return "border-blue-100 bg-blue-50 text-blue-700";

    case "RESERVADO":
      return "border-amber-100 bg-amber-50 text-amber-700";

    case "EN_REPARACION":
      return "border-orange-100 bg-orange-50 text-orange-700";

    case "DEFECTUOSO":
      return "border-red-100 bg-red-50 text-red-700";

    case "BAJA":
      return "border-slate-200 bg-slate-100 text-slate-500";

    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}


function formatCapacidad(
  componente: Componente,
) {
  if (
    componente.capacidad_valor ==
    null
  ) {
    return null;
  }

  const valor = Number(
    componente.capacidad_valor,
  );

  const valorFormateado =
    Number.isInteger(valor)
      ? String(valor)
      : String(valor).replace(
          ".",
          ",",
        );

  if (
    componente.capacidad_unidad
  ) {
    return (
      `${valorFormateado} ` +
      componente.capacidad_unidad
    );
  }

  return valorFormateado;
}


function formatFecha(
  value?: string | null,
) {
  if (!value) {
    return null;
  }

  const fecha =
    new Date(value);

  return new Intl.DateTimeFormat(
    "es-AR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    },
  ).format(fecha);
}


function formatFechaHora(
  value: string,
) {
  const fecha =
    new Date(value);

  return new Intl.DateTimeFormat(
    "es-AR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(fecha);
}


function obtenerMensajeError(
  err: unknown,
  fallback: string,
) {
  if (
    typeof err === "object" &&
    err !== null
  ) {
    const objeto =
      err as {
        message?: string;
      };

    if (objeto.message) {
      try {
        const parsed =
          JSON.parse(
            objeto.message,
          );

        if (
          typeof parsed.detail ===
          "string"
        ) {
          return parsed.detail;
        }

        if (
          Array.isArray(
            parsed.detail,
          )
        ) {
          return parsed.detail.join(
            " ",
          );
        }

        if (
          typeof parsed ===
            "object" &&
          parsed !== null
        ) {
          const mensajes =
            Object.values(parsed)
              .flat()
              .map(String);

          if (
            mensajes.length > 0
          ) {
            return mensajes.join(
              " ",
            );
          }
        }

      } catch {
        return objeto.message;
      }
    }
  }

  return fallback;
}


function ubicacionActual(
  componente: Componente,
) {
  if (
    componente.estado ===
    "EN_REPARACION"
  ) {
    return "En reparación";
  }

  if (
    componente.estado ===
    "BAJA"
  ) {
    return "Dado de baja";
  }

  if (
    componente.activo
  ) {
    return (
      componente.activo_codigo ??
      "Activo asociado"
    );
  }

  return "Stock / Sin asignación";
}


/* ============================================================
   PAGE
============================================================ */

export default function ComponenteDetallePage() {
  const params =
    useParams();

  const id =
    Number(params.id);


  const [
    componente,
    setComponente,
  ] = useState<
    Componente | null
  >(null);

  const [
    movimientos,
    setMovimientos,
  ] = useState<
    MovimientoComponente[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);


  /* ==========================================================
     GESTIÓN
  ========================================================== */

  const [
    gestionOpen,
    setGestionOpen,
  ] = useState(false);

  const [
    vistaGestion,
    setVistaGestion,
  ] =
    useState<VistaGestion>(
      "MENU",
    );

  const [
    observacion,
    setObservacion,
  ] = useState("");

  const [
    operando,
    setOperando,
  ] = useState(false);

  const [
    errorOperacion,
    setErrorOperacion,
  ] = useState<
    string | null
  >(null);


  /* ==========================================================
     EDICIÓN
  ========================================================== */

  const [
    editarOpen,
    setEditarOpen,
  ] = useState(false);

  const [
    editando,
    setEditando,
  ] = useState(false);

  const [
    errorEdicion,
    setErrorEdicion,
  ] = useState<
    string | null
  >(null);

  const [
    formEdicion,
    setFormEdicion,
  ] = useState<FormEdicion>({
    marca: "",
    modelo: "",
    capacidad_valor: "",
    capacidad_unidad: "",
    fecha_adquisicion: "",
  });


  /* ==========================================================
     CARGA
  ========================================================== */

  const cargarDatos =
    useCallback(async () => {
      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        setError(
          "El identificador del componente no es válido.",
        );

        setLoading(false);

        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [
          componenteData,
          movimientosData,
        ] = await Promise.all([
          apiGet<Componente>(
            `/inventario/componentes/${id}/`,
          ),

          apiGet<
            MovimientoComponente[]
          >(
            `/operaciones/movimientos-componentes/?componente=${id}`,
          ),
        ]);

        setComponente(
          componenteData,
        );

        setMovimientos(
          movimientosData,
        );

      } catch (err) {
        console.error(err);

        setError(
          "No se pudo cargar el componente.",
        );

      } finally {
        setLoading(false);
      }
    }, [id]);


  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);


  /* ==========================================================
     GESTIÓN MODAL
  ========================================================== */

  function abrirGestion() {
    setVistaGestion(
      "MENU",
    );

    setObservacion("");

    setErrorOperacion(
      null,
    );

    setGestionOpen(
      true,
    );
  }


  function cerrarGestion() {
    if (operando) {
      return;
    }

    setGestionOpen(
      false,
    );

    setVistaGestion(
      "MENU",
    );

    setObservacion("");

    setErrorOperacion(
      null,
    );
  }


  function volverGestion() {
    setVistaGestion(
      "MENU",
    );

    setObservacion("");

    setErrorOperacion(
      null,
    );
  }


  /* ==========================================================
     EDICIÓN MODAL
  ========================================================== */

  function abrirEditar() {
    if (!componente) {
      return;
    }

    setFormEdicion({
      marca:
        componente.marca ?? "",

      modelo:
        componente.modelo ?? "",

      capacidad_valor:
        componente.capacidad_valor != null
          ? String(
              componente.capacidad_valor,
            )
          : "",

      capacidad_unidad:
        componente.capacidad_unidad ??
        "",

      fecha_adquisicion:
        componente.fecha_adquisicion ??
        "",
    });

    setErrorEdicion(null);

    setEditarOpen(true);
  }


  function cerrarEditar() {
    if (editando) {
      return;
    }

    setEditarOpen(false);

    setErrorEdicion(null);
  }


  function cambiarCampoEdicion(
    campo: keyof FormEdicion,
    valor: string,
  ) {
    setFormEdicion(
      (actual) => ({
        ...actual,
        [campo]: valor,
      }),
    );
  }


  async function guardarEdicion() {
    if (!componente) {
      return;
    }

    try {
      setEditando(true);

      setErrorEdicion(null);

      await apiPatch<Componente>(
        `/inventario/componentes/${componente.id}/`,
        {
          marca:
            formEdicion.marca.trim(),

          modelo:
            formEdicion.modelo.trim(),

          capacidad_valor:
            formEdicion.capacidad_valor
              ? Number(
                  formEdicion.capacidad_valor,
                )
              : null,

          capacidad_unidad:
            formEdicion.capacidad_valor
              ? formEdicion
                  .capacidad_unidad
              : "",

          fecha_adquisicion:
            formEdicion.fecha_adquisicion ||
            null,
        },
      );

      setEditarOpen(false);

      await cargarDatos();

    } catch (err) {
      console.error(err);

      setErrorEdicion(
        obtenerMensajeError(
          err,
          "No se pudo actualizar el componente.",
        ),
      );

    } finally {
      setEditando(false);
    }
  }


  /* ==========================================================
     OPERACIONES
  ========================================================== */

  async function ejecutarOperacion(
    accion:
      | "marcar-defectuoso"
      | "marcar-operativo"
      | "enviar-stock"
      | "enviar-reparacion"
      | "retornar-reparacion-stock"
      | "dar-baja",
  ) {
    if (!componente) {
      return;
    }

    try {
      setOperando(true);

      setErrorOperacion(
        null,
      );

      await apiPost(
        `/operaciones/componentes/${componente.id}/${accion}/`,
        {
          observaciones:
            observacion.trim(),
        },
      );

      setGestionOpen(
        false,
      );

      setVistaGestion(
        "MENU",
      );

      setObservacion("");

      await cargarDatos();

    } catch (err) {
      console.error(err);

      setErrorOperacion(
        obtenerMensajeError(
          err,
          "No se pudo realizar la operación.",
        ),
      );

    } finally {
      setOperando(false);
    }
  }


  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8">

        <div className="mx-auto max-w-[1500px] rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">

          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-sky-600" />

          <p className="mt-4 text-sm text-slate-500">
            Cargando componente...
          </p>

        </div>

      </div>
    );
  }


  if (
    error ||
    !componente
  ) {
    return (
      <div className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8">

        <div className="mx-auto max-w-[1500px]">

          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error ??
              "Componente no encontrado."}
          </div>


          <Link
            href="/inventario/componentes"
            className="mt-4 inline-flex text-sm font-semibold text-sky-700 hover:text-sky-800"
          >
            ← Volver a componentes
          </Link>

        </div>

      </div>
    );
  }


  const capacidad =
    formatCapacidad(
      componente,
    );

  const fechaAdquisicion =
    formatFecha(
      componente.fecha_adquisicion,
    );

  const ubicacion =
    ubicacionActual(
      componente,
    );


  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <>
      <div className="min-h-screen bg-slate-50/70">

        <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">

          {/* NAVEGACIÓN */}

          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <Link
              href="/inventario/componentes"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-sky-700"
            >
              ← Volver a componentes
            </Link>


            <div className="flex w-full gap-2 sm:w-auto">

              <button
                type="button"
                onClick={abrirEditar}
                className="flex-1 rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-700 shadow-sm transition hover:bg-sky-50 sm:flex-none"
              >
                Editar
              </button>


              {componente.estado !==
                "BAJA" && (

                <button
                  type="button"
                  onClick={
                    abrirGestion
                  }
                  className="flex-1 rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-800 sm:flex-none"
                >
                  Gestionar componente
                </button>

              )}

            </div>

          </div>


          {/* CABECERA */}

          <section className="relative overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-br from-white via-white to-sky-50 shadow-sm">

            <div className="absolute inset-y-0 left-0 w-1.5 bg-sky-600" />


            <div className="p-5 sm:p-7">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                <div className="min-w-0">

                  <div className="flex flex-wrap items-center gap-2">

                    <span className="rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-sky-700">
                      Componente
                    </span>

                    <span className="text-sm font-medium text-slate-400">
                      {ubicacion}
                    </span>

                  </div>


                  <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    {componente.tipo_componente_nombre}
                  </h1>


                  {(componente.marca ||
                    componente.modelo) && (

                    <p className="mt-2 text-base font-medium text-slate-600 sm:text-lg">

                      {[
                        componente.marca,
                        componente.modelo,
                      ]
                        .filter(Boolean)
                        .join(" ")}

                    </p>

                  )}

                </div>


                <span
                  className={`inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-xs font-semibold ${estadoClasses(
                    componente.estado,
                  )}`}
                >
                  {estadoLabel(
                    componente.estado,
                  )}
                </span>

              </div>


              <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">

                {capacidad && (

                  <InfoCard
                    titulo="Capacidad"
                    valor={capacidad}
                    destacado
                  />

                )}


                {componente.marca && (

                  <InfoCard
                    titulo="Marca"
                    valor={componente.marca}
                  />

                )}


                {componente.modelo && (

                  <InfoCard
                    titulo="Modelo"
                    valor={componente.modelo}
                  />

                )}


                {componente.numero_serie && (

                  <InfoCard
                    titulo="Número de serie"
                    valor={componente.numero_serie}
                    mono
                  />

                )}


                {fechaAdquisicion && (

                  <InfoCard
                    titulo="Adquisición"
                    valor={fechaAdquisicion}
                  />

                )}


                <InfoCard
                  titulo="Ubicación"
                  valor={ubicacion}
                  destacado={
                    !componente.activo
                  }
                />

              </div>


              {componente.activo && (

                <div className="mt-5 border-t border-sky-100 pt-5">

                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Instalado actualmente en
                  </p>


                  <Link
                    href={`/inventario/activos/${componente.activo}`}
                    className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-sky-100 bg-white p-4 shadow-sm transition hover:border-sky-200 hover:bg-sky-50/50"
                  >

                    <div>

                      <p className="font-mono text-base font-bold text-sky-700">
                        {componente.activo_codigo ??
                          `Activo #${componente.activo}`}
                      </p>


                      {componente.activo_hostname && (

                        <p className="mt-1 font-mono text-xs text-slate-500">
                          {componente.activo_hostname}
                        </p>

                      )}

                    </div>


                    <span className="text-xl text-sky-400">
                      →
                    </span>

                  </Link>

                </div>

              )}


              {componente.observaciones && (

                <div className="mt-5 border-t border-sky-100 pt-5">

                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Observaciones
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {componente.observaciones}
                  </p>

                </div>

              )}

            </div>

          </section>


          {/* ==================================================
              HISTORIAL
          ================================================== */}

          <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 bg-gradient-to-r from-white to-sky-50/50 p-5">

              <div className="flex items-center gap-2">

                <h2 className="text-lg font-bold text-slate-900">
                  Historial del componente
                </h2>

                <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700">
                  {movimientos.length}
                </span>

              </div>


              <p className="mt-1 text-sm text-slate-500">
                Trazabilidad de movimientos, cambios de estado y responsables.
              </p>

            </div>


            {movimientos.length === 0 ? (

              <div className="px-5 py-12 text-center">

                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-xl text-sky-700">
                  ↻
                </div>

                <h3 className="mt-4 text-sm font-semibold text-slate-800">
                  Sin movimientos registrados
                </h3>

                <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
                  Los cambios de estado, instalaciones,
                  retiros y movimientos aparecerán acá.
                </p>

              </div>

            ) : (

              <div className="p-4 sm:p-6">

                <div className="relative">

                  <div className="absolute bottom-5 left-[19px] top-5 w-px bg-slate-200 sm:left-[23px]" />


                  <div className="space-y-6">

                    {movimientos.map(
                      (movimiento) => {

                        const origen =
                          movimiento.activo_origen_codigo ??
                          movimiento.ubicacion_origen_nombre;

                        const destino =
                          movimiento.activo_destino_codigo ??
                          movimiento.ubicacion_destino_nombre;


                        return (
                          <article
                            key={movimiento.id}
                            className="relative flex gap-4 sm:gap-5"
                          >

                            {/* PUNTO */}

                            <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-white bg-sky-100 shadow-sm sm:h-12 sm:w-12">

                              <div className="h-2.5 w-2.5 rounded-full bg-sky-600" />

                            </div>


                            {/* MOVIMIENTO */}

                            <div className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                              <div className="p-4 sm:p-5">

                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                                  <div>

                                    <p className="text-base font-bold text-slate-900">
                                      {movimiento.tipo_movimiento_nombre}
                                    </p>

                                    <p className="mt-1 text-xs font-medium text-slate-400">
                                      {formatFechaHora(
                                        movimiento.created_at,
                                      )}
                                    </p>

                                  </div>


                                  <span
                                    className={`w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${estadoClasses(
                                      movimiento.estado_nuevo,
                                    )}`}
                                  >
                                    {estadoLabel(
                                      movimiento.estado_nuevo,
                                    )}
                                  </span>

                                </div>


                                {/* ORIGEN DESTINO */}

                                <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:gap-4">

                                  <div className="min-w-0">

                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                      Origen
                                    </p>

                                    <p className="mt-1 break-words text-sm font-semibold text-slate-700">
                                      {origen || "—"}
                                    </p>

                                  </div>


                                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sky-600 shadow-sm">
                                    →
                                  </div>


                                  <div className="min-w-0 text-right">

                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                      Destino
                                    </p>

                                    <p className="mt-1 break-words text-sm font-semibold text-slate-700">
                                      {destino || "—"}
                                    </p>

                                  </div>

                                </div>


                                {/* ESTADO */}

                                {movimiento.estado_anterior !==
                                  movimiento.estado_nuevo && (

                                  <div className="mt-4">

                                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                      Cambio de estado
                                    </p>


                                    <div className="flex flex-wrap items-center gap-2">

                                      <span
                                        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${estadoClasses(
                                          movimiento.estado_anterior,
                                        )}`}
                                      >
                                        {estadoLabel(
                                          movimiento.estado_anterior,
                                        )}
                                      </span>


                                      <span className="text-sm text-slate-300">
                                        →
                                      </span>


                                      <span
                                        className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${estadoClasses(
                                          movimiento.estado_nuevo,
                                        )}`}
                                      >
                                        {estadoLabel(
                                          movimiento.estado_nuevo,
                                        )}
                                      </span>

                                    </div>

                                  </div>

                                )}


                                {/* OBSERVACIÓN */}

                                {movimiento.observaciones && (

                                  <div className="mt-4 border-t border-slate-100 pt-4">

                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                      Detalle
                                    </p>

                                    <p className="mt-1.5 text-sm leading-6 text-slate-600">
                                      {movimiento.observaciones}
                                    </p>

                                  </div>

                                )}

                              </div>


                              {/* RESPONSABLE */}

                              {movimiento.usuario_nombre &&
                                movimiento.usuario_nombre.trim() && (

                                <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-5">

                                  <div className="flex items-center gap-3">

                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold uppercase text-sky-700">
                                      {movimiento.usuario_nombre
                                        .trim()
                                        .charAt(0)}
                                    </div>


                                    <div>

                                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                        Realizado por
                                      </p>

                                      <p className="mt-0.5 text-sm font-semibold text-slate-700">
                                        {movimiento.usuario_nombre}
                                      </p>

                                    </div>

                                  </div>

                                </div>

                              )}

                            </div>

                          </article>
                        );
                      },
                    )}

                  </div>

                </div>

              </div>

            )}

          </section>

        </div>

      </div>


      {/* ======================================================
          MODAL EDITAR
      ====================================================== */}

      {editarOpen && componente && (

        <ModalShell
          titulo="Editar componente"
          subtitulo={
            componente.tipo_componente_nombre ??
            "Componente"
          }
          onClose={cerrarEditar}
          disabled={editando}
        >

          <div className="p-5">

            <div className="mb-5 rounded-2xl border border-sky-100 bg-sky-50/70 p-4">

              <p className="text-sm font-semibold text-sky-800">
                Datos del componente
              </p>

              <p className="mt-1 text-xs leading-5 text-sky-700/80">
                El estado, ubicación y activo asociado se modifican desde Gestionar componente para conservar la trazabilidad.
              </p>

            </div>


            {errorEdicion && (

              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {errorEdicion}
              </div>

            )}


            <div className="grid gap-5 sm:grid-cols-2">

              <CampoEdicion label="Marca">

                <input
                  type="text"
                  value={formEdicion.marca}
                  disabled={editando}
                  onChange={(event) =>
                    cambiarCampoEdicion(
                      "marca",
                      event.target.value,
                    )
                  }
                  placeholder="Ej. Kingston"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 sm:text-sm"
                />

              </CampoEdicion>


              <CampoEdicion label="Modelo">

                <input
                  type="text"
                  value={formEdicion.modelo}
                  disabled={editando}
                  onChange={(event) =>
                    cambiarCampoEdicion(
                      "modelo",
                      event.target.value,
                    )
                  }
                  placeholder="Ej. Fury Beast"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 sm:text-sm"
                />

              </CampoEdicion>


              {componente.capacidad_valor != null && (

                <CampoEdicion
                  label="Capacidad"
                  className="sm:col-span-2"
                >

                  <div className="grid grid-cols-[1fr_110px] gap-2">

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        formEdicion.capacidad_valor
                      }
                      disabled={editando}
                      onChange={(event) =>
                        cambiarCampoEdicion(
                          "capacidad_valor",
                          event.target.value,
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-base text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 sm:text-sm"
                    />


                    <select
                      value={
                        formEdicion.capacidad_unidad
                      }
                      disabled={editando}
                      onChange={(event) =>
                        cambiarCampoEdicion(
                          "capacidad_unidad",
                          event.target.value,
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 sm:text-sm"
                    >

                      <option value="MB">
                        MB
                      </option>

                      <option value="GB">
                        GB
                      </option>

                      <option value="TB">
                        TB
                      </option>

                    </select>

                  </div>

                </CampoEdicion>

              )}


              <CampoEdicion
                label="Fecha de adquisición"
                className="sm:col-span-2"
              >

                <input
                  type="date"
                  value={
                    formEdicion.fecha_adquisicion
                  }
                  disabled={editando}
                  onChange={(event) =>
                    cambiarCampoEdicion(
                      "fecha_adquisicion",
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-base text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 sm:text-sm"
                />

              </CampoEdicion>

            </div>

          </div>


          <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:justify-end">

            <button
              type="button"
              disabled={editando}
              onClick={cerrarEditar}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
            >
              Cancelar
            </button>


            <button
              type="button"
              disabled={editando}
              onClick={guardarEdicion}
              className="rounded-xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {editando
                ? "Guardando..."
                : "Guardar cambios"}
            </button>

          </div>

        </ModalShell>

      )}


      {/* ======================================================
          MODAL GESTIÓN
      ====================================================== */}

      {gestionOpen && componente && (

        <ModalShell
          titulo={
            vistaGestion === "MENU"
              ? "Gestionar componente"
              : componente.tipo_componente_nombre ??
                "Componente"
          }
          subtitulo={
            componente.tipo_componente_nombre ??
            "Componente"
          }
          onClose={
            cerrarGestion
          }
          onBack={
            vistaGestion !== "MENU"
              ? volverGestion
              : undefined
          }
          disabled={operando}
        >

          {vistaGestion === "MENU" && (

            <GestionMenu
              componente={componente}
              onSeleccionar={
                setVistaGestion
              }
            />

          )}


          {vistaGestion === "DEFECTUOSO" && (

            <ConfirmarOperacion
              titulo="Marcar como defectuoso"
              descripcion={`El componente continuará instalado en ${componente.activo_codigo ?? "el activo actual"}.`}
              observacion={observacion}
              setObservacion={setObservacion}
              error={errorOperacion}
              operando={operando}
              textoConfirmar="Marcar defectuoso"
              observacionRequerida
              peligro
              onConfirmar={() =>
                ejecutarOperacion(
                  "marcar-defectuoso",
                )
              }
            />

          )}


          {vistaGestion === "OPERATIVO" && (

            <ConfirmarOperacion
              titulo="Marcar nuevamente operativo"
              descripcion="El componente volverá al estado Instalado y continuará asociado al activo actual."
              observacion={observacion}
              setObservacion={setObservacion}
              error={errorOperacion}
              operando={operando}
              textoConfirmar="Marcar operativo"
              onConfirmar={() =>
                ejecutarOperacion(
                  "marcar-operativo",
                )
              }
            />

          )}


          {vistaGestion === "STOCK" && (

            <ConfirmarOperacion
              titulo="Enviar a stock"
              descripcion={`El componente será retirado de ${componente.activo_codigo ?? "su activo actual"} y quedará Disponible y sin asociación.`}
              observacion={observacion}
              setObservacion={setObservacion}
              error={errorOperacion}
              operando={operando}
              textoConfirmar="Enviar a stock"
              onConfirmar={() =>
                ejecutarOperacion(
                  "enviar-stock",
                )
              }
            />

          )}


          {vistaGestion === "REPARACION" && (

            <ConfirmarOperacion
              titulo="Enviar a reparación"
              descripcion={
                componente.activo
                  ? `El componente será retirado de ${componente.activo_codigo ?? "su activo actual"} y pasará al estado En reparación.`
                  : "El componente pasará al estado En reparación."
              }
              observacion={observacion}
              setObservacion={setObservacion}
              error={errorOperacion}
              operando={operando}
              textoConfirmar="Enviar a reparación"
              observacionRequerida
              onConfirmar={() =>
                ejecutarOperacion(
                  "enviar-reparacion",
                )
              }
            />

          )}


          {vistaGestion === "RETORNO_REPARACION" && (

            <ConfirmarOperacion
              titulo="Retornar de reparación"
              descripcion="El componente volverá a estado Disponible y quedará nuevamente en stock."
              observacion={observacion}
              setObservacion={setObservacion}
              error={errorOperacion}
              operando={operando}
              textoConfirmar="Retornar a stock"
              onConfirmar={() =>
                ejecutarOperacion(
                  "retornar-reparacion-stock",
                )
              }
            />

          )}


          {vistaGestion === "BAJA" && (

            <ConfirmarOperacion
              titulo="Dar de baja definitivamente"
              descripcion="El componente dejará de formar parte del inventario operativo. El registro y todo su historial permanecerán disponibles."
              observacion={observacion}
              setObservacion={setObservacion}
              error={errorOperacion}
              operando={operando}
              textoConfirmar="Dar de baja"
              observacionRequerida
              peligro
              onConfirmar={() =>
                ejecutarOperacion(
                  "dar-baja",
                )
              }
            />

          )}

        </ModalShell>

      )}

    </>
  );
}


/* ============================================================
   MENÚ DE GESTIÓN
============================================================ */

function GestionMenu({
  componente,
  onSeleccionar,
}: {
  componente: Componente;

  onSeleccionar: (
    vista: VistaGestion,
  ) => void;
}) {
  const instalado =
    componente.estado ===
    "INSTALADO";

  const defectuoso =
    componente.estado ===
    "DEFECTUOSO";

  const disponible =
    componente.estado ===
    "DISPONIBLE";

  const reparacion =
    componente.estado ===
    "EN_REPARACION";


  return (
    <div className="p-4 sm:p-5">

      <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">

        <div className="flex items-start justify-between gap-3">

          <div>

            <p className="text-xs text-slate-400">
              Estado actual
            </p>

            <p className="mt-1 font-semibold text-slate-800">
              {estadoLabel(
                componente.estado,
              )}
            </p>


            <p className="mt-3 text-xs text-slate-400">
              Ubicación
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-700">
              {ubicacionActual(
                componente,
              )}
            </p>

          </div>


          <span
            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${estadoClasses(
              componente.estado,
            )}`}
          >
            {estadoLabel(
              componente.estado,
            )}
          </span>

        </div>

      </div>


      <div className="space-y-2">

        {instalado && (

          <AccionGestion
            icono="!"
            titulo="Marcar como defectuoso"
            descripcion="Registrar una falla manteniéndolo instalado."
            onClick={() =>
              onSeleccionar(
                "DEFECTUOSO",
              )
            }
          />

        )}


        {defectuoso && (

          <AccionGestion
            icono="✓"
            titulo="Marcar nuevamente operativo"
            descripcion="Volver a indicar que funciona correctamente."
            onClick={() =>
              onSeleccionar(
                "OPERATIVO",
              )
            }
          />

        )}


        {(instalado ||
          defectuoso) && (

          <AccionGestion
            icono="↓"
            titulo="Enviar a stock"
            descripcion="Retirar del activo y dejar disponible."
            onClick={() =>
              onSeleccionar(
                "STOCK",
              )
            }
          />

        )}


        {(instalado ||
          defectuoso) && (

          <AccionGestion
            icono="⌁"
            titulo="Enviar a reparación"
            descripcion="Retirar del activo y registrar su reparación."
            onClick={() =>
              onSeleccionar(
                "REPARACION",
              )
            }
          />

        )}


        {reparacion && (

          <AccionGestion
            icono="↩"
            titulo="Retornar de reparación"
            descripcion="Volver a dejar disponible en stock."
            onClick={() =>
              onSeleccionar(
                "RETORNO_REPARACION",
              )
            }
          />

        )}


        {disponible && (

          <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">

            <p className="text-sm font-semibold text-sky-800">
              Disponible en stock
            </p>

            <p className="mt-1 text-xs leading-5 text-sky-700/80">
              Este componente puede instalarse desde la ficha de un activo compatible.
            </p>

          </div>

        )}

      </div>


      <div className="my-4 border-t border-slate-200" />


      <AccionGestion
        icono="×"
        titulo="Dar de baja"
        descripcion="Baja definitiva del inventario operativo."
        peligro
        onClick={() =>
          onSeleccionar(
            "BAJA",
          )
        }
      />

    </div>
  );
}


/* ============================================================
   UI
============================================================ */

function InfoCard({
  titulo,
  valor,
  mono = false,
  destacado = false,
}: {
  titulo: string;
  valor: string;
  mono?: boolean;
  destacado?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 shadow-sm ${
        destacado
          ? "border-sky-100 bg-sky-50/70"
          : "border-slate-100 bg-white/90"
      }`}
    >

      <p
        className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${
          destacado
            ? "text-sky-500"
            : "text-slate-400"
        }`}
      >
        {titulo}
      </p>


      <p
        className={`mt-1.5 break-words text-sm font-semibold ${
          destacado
            ? "text-sky-800"
            : "text-slate-700"
        } ${
          mono
            ? "font-mono"
            : ""
        }`}
      >
        {valor}
      </p>

    </div>
  );
}


function CampoEdicion({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>

      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      {children}

    </div>
  );
}


function ModalShell({
  titulo,
  subtitulo,
  children,
  onClose,
  onBack,
  disabled = false,
}: {
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
  onClose: () => void;
  onBack?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 backdrop-blur-[2px] sm:items-center sm:p-4">

      <div className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-2xl">

        <div className="flex justify-center pt-2 sm:hidden">
          <div className="h-1.5 w-12 rounded-full bg-slate-200" />
        </div>


        <div className="relative shrink-0 border-b border-slate-200 bg-gradient-to-r from-sky-50 to-white p-5">

          <div className="absolute inset-y-0 left-0 hidden w-1.5 bg-sky-600 sm:block" />


          <div className="pr-12">

            {onBack && (

              <button
                type="button"
                disabled={disabled}
                onClick={onBack}
                className="mb-2 text-sm font-semibold text-sky-700 transition hover:text-sky-800 disabled:opacity-50"
              >
                ← Volver
              </button>

            )}


            {subtitulo && (

              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-sky-600">
                {subtitulo}
              </p>

            )}


            <h2 className="mt-1 text-xl font-bold text-slate-900">
              {titulo}
            </h2>

          </div>


          <button
            type="button"
            disabled={disabled}
            onClick={onClose}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-xl text-slate-400 transition hover:bg-slate-50 disabled:opacity-40"
          >
            ×
          </button>

        </div>


        <div className="min-h-0 flex flex-1 flex-col overflow-y-auto">
          {children}
        </div>

      </div>

    </div>
  );
}


function AccionGestion({
  icono,
  titulo,
  descripcion,
  peligro = false,
  onClick,
}: {
  icono: string;
  titulo: string;
  descripcion: string;
  peligro?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
        peligro
          ? "border-red-100 hover:border-red-200 hover:bg-red-50"
          : "border-transparent hover:border-sky-100 hover:bg-sky-50"
      }`}
    >

      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${
          peligro
            ? "bg-red-50 text-red-600"
            : "bg-sky-50 text-sky-700"
        }`}
      >
        {icono}
      </span>


      <span className="min-w-0 flex-1">

        <span
          className={`block text-sm font-semibold ${
            peligro
              ? "text-red-700"
              : "text-slate-800"
          }`}
        >
          {titulo}
        </span>

        <span className="mt-0.5 block text-xs leading-5 text-slate-500">
          {descripcion}
        </span>

      </span>


      <span className="text-xl text-slate-300">
        ›
      </span>

    </button>
  );
}


function ConfirmarOperacion({
  titulo,
  descripcion,
  observacion,
  setObservacion,
  error,
  operando,
  textoConfirmar,
  onConfirmar,
  peligro = false,
  observacionRequerida = false,
}: {
  titulo: string;
  descripcion: string;

  observacion: string;

  setObservacion: (
    value: string,
  ) => void;

  error: string | null;

  operando: boolean;

  textoConfirmar: string;

  onConfirmar: () => void;

  peligro?: boolean;

  observacionRequerida?: boolean;
}) {
  const invalido =
    observacionRequerida &&
    !observacion.trim();


  return (
    <div className="p-5">

      <h3 className="text-lg font-bold text-slate-900">
        {titulo}
      </h3>


      <p className="mt-2 text-sm leading-6 text-slate-500">
        {descripcion}
      </p>


      <div className="mt-5">

        <label className="text-sm font-semibold text-slate-700">

          Observaciones

          {observacionRequerida
            ? " *"
            : ""}

        </label>


        <textarea
          value={observacion}
          onChange={(event) =>
            setObservacion(
              event.target.value,
            )
          }
          rows={4}
          placeholder="Motivo o aclaración..."
          className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-3.5 py-3 text-base text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 sm:text-sm"
        />

      </div>


      {error && (

        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>

      )}


      <button
        type="button"
        disabled={
          operando ||
          invalido
        }
        onClick={
          onConfirmar
        }
        className={`mt-5 w-full rounded-xl px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${
          peligro
            ? "bg-red-600 hover:bg-red-700"
            : "bg-sky-700 hover:bg-sky-800"
        }`}
      >
        {operando
          ? "Procesando..."
          : textoConfirmar}
      </button>

    </div>
  );
}