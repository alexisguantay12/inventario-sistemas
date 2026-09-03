"use client";

import Link from "next/link";

import {
  useCallback,
  useEffect,
  useMemo,
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
  apiPost,
} from "@/lib/api";

import type {
  Activo,
  Componente,
  TipoComponente,
} from "@/types";


/* ============================================================
   TIPOS LOCALES
============================================================ */

type EquipoTrabajoOpcion = {
  id: number;
  nombre: string;
  sector: number;
  sector_nombre?: string | null;
  area_nombre?: string | null;
  estado?: string;
};


type SistemaOperativoOpcion = {
  id: number;
  nombre: string;
  activo?: boolean;
};


type VistaGestionActivo =
  | "MENU"
  | "CONFIGURACION"
  | "MOVER"
  | "STOCK"
  | "DEFECTUOSO"
  | "OPERATIVO"
  | "REPARACION"
  | "RETORNO_REPARACION"
  | "BAJA";


type VistaGestionComponente =
  | "MENU"
  | "DEFECTUOSO"
  | "OPERATIVO"
  | "STOCK"
  | "REPARACION"
  | "BAJA";


/* ============================================================
   HELPERS
============================================================ */

function estadoActivoLabel(
  estado: string,
) {
  const estados: Record<string, string> = {
    EN_USO: "En uso",
    DISPONIBLE: "Disponible",
    RESERVADO: "Reservado",
    EN_REPARACION: "En reparación",
    DEFECTUOSO: "Defectuoso",
    BAJA: "Dado de baja",
  };

  return estados[estado] ?? estado;
}


function estadoActivoClasses(
  estado: string,
) {
  switch (estado) {
    case "EN_USO":
      return "bg-blue-50 text-blue-700 border-blue-100";

    case "DISPONIBLE":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";

    case "RESERVADO":
      return "bg-amber-50 text-amber-700 border-amber-100";

    case "EN_REPARACION":
      return "bg-orange-50 text-orange-700 border-orange-100";

    case "DEFECTUOSO":
      return "bg-red-50 text-red-700 border-red-100";

    case "BAJA":
      return "bg-slate-100 text-slate-500 border-slate-200";

    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}


function estadoComponenteLabel(
  estado: string,
) {
  const estados: Record<string, string> = {
    INSTALADO: "Instalado",
    DISPONIBLE: "Disponible",
    RESERVADO: "Reservado",
    EN_REPARACION: "En reparación",
    DEFECTUOSO: "Defectuoso",
    BAJA: "Dado de baja",
  };

  return estados[estado] ?? estado;
}


function estadoComponenteClasses(
  estado: string,
) {
  switch (estado) {
    case "INSTALADO":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";

    case "DISPONIBLE":
      return "bg-blue-50 text-blue-700 border-blue-100";

    case "RESERVADO":
      return "bg-amber-50 text-amber-700 border-amber-100";

    case "EN_REPARACION":
      return "bg-orange-50 text-orange-700 border-orange-100";

    case "DEFECTUOSO":
      return "bg-red-50 text-red-700 border-red-100";

    case "BAJA":
      return "bg-slate-100 text-slate-500 border-slate-200";

    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}


function formatFecha(
  value?: string | null,
) {
  if (!value) {
    return null;
  }

  const fecha = new Date(
    `${value}T00:00:00`,
  );

  return new Intl.DateTimeFormat(
    "es-AR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    },
  ).format(fecha);
}


function formatCapacidad(
  componente: Componente,
) {
  if (
    componente.capacidad_valor == null
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
    return `${valorFormateado} ${componente.capacidad_unidad}`;
  }

  return valorFormateado;
}


function obtenerMensajeError(
  err: unknown,
  fallback: string,
) {
  if (
    typeof err === "object" &&
    err !== null
  ) {
    const objeto = err as {
      message?: string;
      detail?: string;
    };

    if (objeto.detail) {
      return objeto.detail;
    }

    if (objeto.message) {
      return objeto.message;
    }
  }

  return fallback;
}


function ubicacionActivoTitulo(
  activo: Activo,
) {
  if (
    activo.estado ===
    "EN_REPARACION"
  ) {
    return "En reparación";
  }

  if (
    activo.estado === "BAJA"
  ) {
    return "Dado de baja";
  }

  if (
    !activo.sector &&
    !activo.equipo_trabajo
  ) {
    return "Stock / Sin asignación";
  }

  if (
    activo.area_nombre ||
    activo.sector_nombre
  ) {
    return [
      activo.area_nombre,
      activo.sector_nombre,
    ]
      .filter(Boolean)
      .join(" / ");
  }

  return "Sin asignación";
}


/* ============================================================
   PÁGINA
============================================================ */

export default function ActivoDetallePage() {
  const params = useParams();

  const id = Number(params.id);


  /* ==========================================================
     DATOS PRINCIPALES
  ========================================================== */

  const [
    activo,
    setActivo,
  ] = useState<Activo | null>(
    null,
  );

  const [
    componentes,
    setComponentes,
  ] = useState<Componente[]>(
    [],
  );

  const [
    tiposComponente,
    setTiposComponente,
  ] = useState<TipoComponente[]>(
    [],
  );

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
     AGREGAR COMPONENTE
  ========================================================== */

  const [
    componenteModalOpen,
    setComponenteModalOpen,
  ] = useState(false);

  const [
    componentesDisponibles,
    setComponentesDisponibles,
  ] = useState<Componente[]>(
    [],
  );

  const [
    componenteSeleccionado,
    setComponenteSeleccionado,
  ] = useState<
    Componente | null
  >(null);

  const [
    loadingComponentes,
    setLoadingComponentes,
  ] = useState(false);

  const [
    errorComponentes,
    setErrorComponentes,
  ] = useState<
    string | null
  >(null);

  const [
    asociando,
    setAsociando,
  ] = useState(false);


  /* ==========================================================
     GESTIÓN ACTIVO
  ========================================================== */

  const [
    gestionActivoOpen,
    setGestionActivoOpen,
  ] = useState(false);

  const [
    vistaGestionActivo,
    setVistaGestionActivo,
  ] =
    useState<VistaGestionActivo>(
      "MENU",
    );

  const [
    observacionActivo,
    setObservacionActivo,
  ] = useState("");

  const [
    operandoActivo,
    setOperandoActivo,
  ] = useState(false);

  const [
    errorOperacionActivo,
    setErrorOperacionActivo,
  ] = useState<
    string | null
  >(null);

  const [
    equiposTrabajo,
    setEquiposTrabajo,
  ] = useState<
    EquipoTrabajoOpcion[]
  >([]);

  const [
    equipoDestinoId,
    setEquipoDestinoId,
  ] = useState("");

  const [
    loadingDestinos,
    setLoadingDestinos,
  ] = useState(false);


  /* ==========================================================
     CONFIGURACIÓN ACTIVO
  ========================================================== */

  const [
    sistemasOperativos,
    setSistemasOperativos,
  ] = useState<
    SistemaOperativoOpcion[]
  >([]);

  const [
    loadingSistemasOperativos,
    setLoadingSistemasOperativos,
  ] = useState(false);

  const [
    hostnameConfiguracion,
    setHostnameConfiguracion,
  ] = useState("");

  const [
    sistemaOperativoId,
    setSistemaOperativoId,
  ] = useState("");


  /* ==========================================================
     GESTIÓN COMPONENTE
  ========================================================== */

  const [
    gestionComponenteOpen,
    setGestionComponenteOpen,
  ] = useState(false);

  const [
    componenteGestionado,
    setComponenteGestionado,
  ] = useState<
    Componente | null
  >(null);

  const [
    vistaGestionComponente,
    setVistaGestionComponente,
  ] =
    useState<VistaGestionComponente>(
      "MENU",
    );

  const [
    observacionComponente,
    setObservacionComponente,
  ] = useState("");

  const [
    operandoComponente,
    setOperandoComponente,
  ] = useState(false);

  const [
    errorOperacionComponente,
    setErrorOperacionComponente,
  ] = useState<
    string | null
  >(null);


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
          "El identificador del activo no es válido.",
        );

        setLoading(false);

        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [
          activoData,
          componentesData,
          tiposData,
        ] = await Promise.all([
          apiGet<Activo>(
            `/inventario/activos/${id}/`,
          ),

          apiGet<Componente[]>(
            `/inventario/componentes/?activo=${id}`,
          ),

          apiGet<
            TipoComponente[]
          >(
            "/inventario/tipos-componentes/",
          ),
        ]);

        setActivo(
          activoData,
        );

        setComponentes(
          componentesData,
        );

        setTiposComponente(
          tiposData.filter(
            (tipo) =>
              tipo.activo,
          ),
        );

      } catch (err) {
        console.error(err);

        setError(
          "No se pudo cargar el activo.",
        );

      } finally {
        setLoading(false);
      }
    }, [id]);


  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);


  /* ==========================================================
     COMPONENTES FÍSICAMENTE ASOCIADOS

     DEFECTUOSO sigue físicamente instalado.
  ========================================================== */

  const componentesEnActivo =
    useMemo(() => {
      return componentes.filter(
        (componente) =>
          componente.estado ===
            "INSTALADO" ||
          componente.estado ===
            "DEFECTUOSO",
      );
    }, [componentes]);


  const resumenCapacidades =
    useMemo(() => {
      return componentesEnActivo
        .filter(
          (componente) =>
            componente.capacidad_valor !=
            null,
        )
        .map(
          (componente) => ({
            id:
              componente.id,

            tipo:
              componente
                .tipo_componente_nombre,

            capacidad:
              formatCapacidad(
                componente,
              ),
          }),
        )
        .filter(
          (item) =>
            item.capacidad,
        );
    }, [
      componentesEnActivo,
    ]);


  /* ==========================================================
     AGREGAR COMPONENTE
  ========================================================== */

  async function abrirAgregarComponente() {
    if (!activo) {
      return;
    }

    setComponenteSeleccionado(
      null,
    );

    setErrorComponentes(
      null,
    );

    setComponenteModalOpen(
      true,
    );

    try {
      setLoadingComponentes(
        true,
      );

      const disponibles =
        await apiGet<
          Componente[]
        >(
          "/inventario/componentes/?estado=DISPONIBLE",
        );

      const compatibles =
        disponibles.filter(
          (componente) => {
            const tipo =
              tiposComponente.find(
                (item) =>
                  item.id ===
                  componente.tipo_componente,
              );

            if (!tipo) {
              return false;
            }

            if (
              !tipo
                .tipos_activo_permitidos
                ?.length
            ) {
              return false;
            }

            return tipo
              .tipos_activo_permitidos
              .includes(
                activo.tipo_activo,
              );
          },
        );

      setComponentesDisponibles(
        compatibles,
      );

    } catch (err) {
      console.error(err);

      setErrorComponentes(
        "No se pudieron cargar los componentes disponibles.",
      );

    } finally {
      setLoadingComponentes(
        false,
      );
    }
  }


  function cerrarComponenteModal() {
    if (asociando) {
      return;
    }

    setComponenteModalOpen(
      false,
    );

    setComponenteSeleccionado(
      null,
    );

    setErrorComponentes(
      null,
    );
  }


  async function asociarComponente() {
    if (
      !activo ||
      !componenteSeleccionado
    ) {
      return;
    }

    try {
      setAsociando(true);

      setErrorComponentes(
        null,
      );

      await apiPost<Componente>(
        `/operaciones/componentes/${componenteSeleccionado.id}/instalar/`,
        {
          activo_id:
            activo.id,

          observaciones:
            "Instalado desde la ficha del activo.",
        },
      );

      setComponenteModalOpen(
        false,
      );

      setComponenteSeleccionado(
        null,
      );

      await cargarDatos();

    } catch (err) {
      console.error(err);

      setErrorComponentes(
        obtenerMensajeError(
          err,
          "No se pudo instalar el componente en el activo.",
        ),
      );

    } finally {
      setAsociando(false);
    }
  }


  /* ==========================================================
     GESTIÓN ACTIVO
  ========================================================== */

  function abrirGestionActivo() {
    setVistaGestionActivo(
      "MENU",
    );

    setObservacionActivo("");

    setEquipoDestinoId("");

    setErrorOperacionActivo(
      null,
    );

    setGestionActivoOpen(
      true,
    );
  }


  function cerrarGestionActivo() {
    if (operandoActivo) {
      return;
    }

    setGestionActivoOpen(
      false,
    );

    setVistaGestionActivo(
      "MENU",
    );

    setObservacionActivo("");

    setEquipoDestinoId("");

    setErrorOperacionActivo(
      null,
    );
  }


  function volverGestionActivo() {
    setVistaGestionActivo(
      "MENU",
    );

    setObservacionActivo("");

    setEquipoDestinoId("");

    setErrorOperacionActivo(
      null,
    );
  }


  async function seleccionarVistaActivo(
    vista: VistaGestionActivo,
  ) {
    setVistaGestionActivo(
      vista,
    );

    setObservacionActivo("");

    setEquipoDestinoId("");

    setErrorOperacionActivo(
      null,
    );


    /* ========================================================
       CONFIGURACIÓN
    ======================================================== */

    if (
      vista === "CONFIGURACION"
    ) {
      setHostnameConfiguracion(
        activo?.hostname ?? "",
      );

      setSistemaOperativoId(
        activo?.sistema_operativo
          ? String(
              activo.sistema_operativo,
            )
          : "",
      );


      if (
        sistemasOperativos.length >
        0
      ) {
        return;
      }


      try {
        setLoadingSistemasOperativos(
          true,
        );

        const data =
          await apiGet<
            SistemaOperativoOpcion[]
          >(
            "/inventario/sistemas-operativos/",
          );

        setSistemasOperativos(
          data.filter(
            (item) =>
              item.activo !== false,
          ),
        );

      } catch (err) {
        console.error(err);

        setErrorOperacionActivo(
          "No se pudieron cargar los sistemas operativos.",
        );

      } finally {
        setLoadingSistemasOperativos(
          false,
        );
      }

      return;
    }


    /* ========================================================
       MOVER
    ======================================================== */

    if (
      vista !== "MOVER"
    ) {
      return;
    }

    try {
      setLoadingDestinos(
        true,
      );

      const data =
        await apiGet<
          EquipoTrabajoOpcion[]
        >(
          "/inventario/equipos-trabajo/?estado=ACTIVO",
        );

      setEquiposTrabajo(
        data.filter(
          (equipo) =>
            equipo.id !==
            activo
              ?.equipo_trabajo,
        ),
      );

    } catch (err) {
      console.error(err);

      setErrorOperacionActivo(
        "No se pudieron cargar los equipos de trabajo disponibles.",
      );

    } finally {
      setLoadingDestinos(
        false,
      );
    }
  }


  async function actualizarConfiguracionActivo() {
    if (!activo) {
      return;
    }

    try {
      setOperandoActivo(
        true,
      );

      setErrorOperacionActivo(
        null,
      );

      await apiPost(
        `/operaciones/activos/${activo.id}/actualizar-configuracion/`,
        {
          hostname:
            hostnameConfiguracion.trim(),

          sistema_operativo_id:
            sistemaOperativoId
              ? Number(
                  sistemaOperativoId,
                )
              : null,
        },
      );

      setGestionActivoOpen(
        false,
      );

      setVistaGestionActivo(
        "MENU",
      );

      await cargarDatos();

    } catch (err) {
      console.error(err);

      setErrorOperacionActivo(
        obtenerMensajeError(
          err,
          "No se pudo actualizar la configuración del activo.",
        ),
      );

    } finally {
      setOperandoActivo(
        false,
      );
    }
  }


  async function ejecutarOperacionActivoSimple(
    accion:
      | "marcar-defectuoso"
      | "marcar-operativo"
      | "dar-baja",
  ) {
    if (!activo) {
      return;
    }

    try {
      setOperandoActivo(
        true,
      );

      setErrorOperacionActivo(
        null,
      );

      await apiPost(
        `/operaciones/activos/${activo.id}/${accion}/`,
        {
          observaciones:
            observacionActivo.trim(),
        },
      );

      setGestionActivoOpen(
        false,
      );

      await cargarDatos();

    } catch (err) {
      console.error(err);

      setErrorOperacionActivo(
        obtenerMensajeError(
          err,
          "No se pudo realizar la operación.",
        ),
      );

    } finally {
      setOperandoActivo(
        false,
      );
    }
  }


  async function moverActivo() {
    if (
      !activo ||
      !equipoDestinoId
    ) {
      return;
    }

    try {
      setOperandoActivo(
        true,
      );

      setErrorOperacionActivo(
        null,
      );

      await apiPost(
        `/operaciones/activos/${activo.id}/asignar-equipo/`,
        {
          equipo_destino_id:
            Number(
              equipoDestinoId,
            ),

          observaciones:
            observacionActivo.trim(),
        },
      );

      setGestionActivoOpen(
        false,
      );

      await cargarDatos();

    } catch (err) {
      console.error(err);

      setErrorOperacionActivo(
        obtenerMensajeError(
          err,
          "No se pudo mover el activo.",
        ),
      );

    } finally {
      setOperandoActivo(
        false,
      );
    }
  }


  async function enviarActivoStock() {
    if (!activo) {
      return;
    }

    try {
      setOperandoActivo(
        true,
      );

      setErrorOperacionActivo(
        null,
      );

      await apiPost(
        `/operaciones/activos/${activo.id}/enviar-stock/`,
        {
          observaciones:
            observacionActivo.trim(),
        },
      );

      setGestionActivoOpen(
        false,
      );

      await cargarDatos();

    } catch (err) {
      console.error(err);

      setErrorOperacionActivo(
        obtenerMensajeError(
          err,
          "No se pudo enviar el activo a stock.",
        ),
      );

    } finally {
      setOperandoActivo(
        false,
      );
    }
  }


  async function enviarActivoReparacion() {
    if (!activo) {
      return;
    }

    try {
      setOperandoActivo(
        true,
      );

      setErrorOperacionActivo(
        null,
      );

      await apiPost(
        `/operaciones/activos/${activo.id}/enviar-reparacion/`,
        {
          observaciones:
            observacionActivo.trim(),
        },
      );

      setGestionActivoOpen(
        false,
      );

      await cargarDatos();

    } catch (err) {
      console.error(err);

      setErrorOperacionActivo(
        obtenerMensajeError(
          err,
          "No se pudo enviar el activo a reparación.",
        ),
      );

    } finally {
      setOperandoActivo(
        false,
      );
    }
  }


  async function retornarActivoStock() {
    if (!activo) {
      return;
    }

    try {
      setOperandoActivo(
        true,
      );

      setErrorOperacionActivo(
        null,
      );

      await apiPost(
        `/operaciones/activos/${activo.id}/retornar-reparacion-stock/`,
        {
          observaciones:
            observacionActivo.trim(),
        },
      );

      setGestionActivoOpen(
        false,
      );

      await cargarDatos();

    } catch (err) {
      console.error(err);

      setErrorOperacionActivo(
        obtenerMensajeError(
          err,
          "No se pudo retornar el activo a stock.",
        ),
      );

    } finally {
      setOperandoActivo(
        false,
      );
    }
  }


  /* ==========================================================
     GESTIÓN COMPONENTE
  ========================================================== */

  function abrirGestionComponente(
    componente: Componente,
  ) {
    setComponenteGestionado(
      componente,
    );

    setVistaGestionComponente(
      "MENU",
    );

    setObservacionComponente(
      "",
    );

    setErrorOperacionComponente(
      null,
    );

    setGestionComponenteOpen(
      true,
    );
  }


  function cerrarGestionComponente() {
    if (operandoComponente) {
      return;
    }

    setGestionComponenteOpen(
      false,
    );

    setComponenteGestionado(
      null,
    );

    setVistaGestionComponente(
      "MENU",
    );

    setObservacionComponente(
      "",
    );

    setErrorOperacionComponente(
      null,
    );
  }


  function volverGestionComponente() {
    setVistaGestionComponente(
      "MENU",
    );

    setObservacionComponente(
      "",
    );

    setErrorOperacionComponente(
      null,
    );
  }


  async function ejecutarOperacionComponente(
    accion:
      | "marcar-defectuoso"
      | "marcar-operativo"
      | "enviar-stock"
      | "enviar-reparacion"
      | "dar-baja",
  ) {
    if (!componenteGestionado) {
      return;
    }

    try {
      setOperandoComponente(
        true,
      );

      setErrorOperacionComponente(
        null,
      );

      await apiPost(
        `/operaciones/componentes/${componenteGestionado.id}/${accion}/`,
        {
          observaciones:
            observacionComponente.trim(),
        },
      );

      setGestionComponenteOpen(
        false,
      );

      setComponenteGestionado(
        null,
      );

      await cargarDatos();

    } catch (err) {
      console.error(err);

      setErrorOperacionComponente(
        obtenerMensajeError(
          err,
          "No se pudo realizar la operación sobre el componente.",
        ),
      );

    } finally {
      setOperandoComponente(
        false,
      );
    }
  }


  /* ==========================================================
     ESTADOS GENERALES
  ========================================================== */

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8">

        <div className="mx-auto max-w-[1500px] rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">

          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-sky-600" />

          <p className="mt-4 text-sm text-slate-500">
            Cargando activo...
          </p>

        </div>

      </div>
    );
  }


  if (error) {
    return (
      <div className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8">

        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>

        <Link
          href="/inventario/activos"
          className="mt-4 inline-flex text-sm font-medium text-sky-700 hover:text-sky-800"
        >
          ← Volver a activos
        </Link>

      </div>
    );
  }


  if (!activo) {
    return null;
  }


  const fechaAdquisicion =
    formatFecha(
      activo.fecha_adquisicion,
    );

  const ubicacionActual =
    ubicacionActivoTitulo(
      activo,
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
              href={
                activo.equipo_trabajo
                  ? `/inventario/equipos/${activo.equipo_trabajo}`
                  : "/inventario/activos"
              }
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-sky-700"
            >
              ←{" "}
              {activo.equipo_trabajo
                ? "Volver al equipo"
                : "Volver a activos"}
            </Link>


            <div className="flex w-full gap-2 sm:w-auto">

              {activo.estado !==
                "BAJA" && (

                <button
                  type="button"
                  onClick={
                    abrirGestionActivo
                  }
                  className="w-full rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-800 sm:w-auto"
                >
                  Gestionar activo
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
                      {activo.tipo_activo_nombre}
                    </span>


                    <span className="text-sm font-medium text-slate-400">
                      {ubicacionActual}
                    </span>

                  </div>


                  <h1 className="mt-3 break-words font-mono text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    {activo.codigo_inventario}
                  </h1>


                  {(activo.marca ||
                    activo.modelo) && (

                    <p className="mt-2 text-base font-medium text-slate-600 sm:text-lg">

                      {[
                        activo.marca,
                        activo.modelo,
                      ]
                        .filter(Boolean)
                        .join(" ")}

                    </p>

                  )}

                </div>


                <span
                  className={`inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-xs font-semibold ${estadoActivoClasses(
                    activo.estado,
                  )}`}
                >
                  {estadoActivoLabel(
                    activo.estado,
                  )}
                </span>

              </div>


              {/* DATOS PRINCIPALES */}
              <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">

                {activo.hostname && (
                  <InfoCard
                    titulo="Hostname"
                    valor={
                      activo.hostname
                    }
                    mono
                  />
                )}


                {activo.sistema_operativo_nombre && (
                  <InfoCard
                    titulo="Sistema operativo"
                    valor={
                      activo.sistema_operativo_nombre
                    }
                    destacado
                  />
                )}


                {activo.numero_serie && (
                  <InfoCard
                    titulo="Número de serie"
                    valor={
                      activo.numero_serie
                    }
                  />
                )}


                {fechaAdquisicion && (
                  <InfoCard
                    titulo="Adquisición"
                    valor={
                      fechaAdquisicion
                    }
                  />
                )}


                {activo.equipo_trabajo_nombre && (

                  <div className="rounded-xl border border-slate-100 bg-white/90 p-3 shadow-sm">

                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Equipo de trabajo
                    </p>

                    <Link
                      href={`/inventario/equipos/${activo.equipo_trabajo}`}
                      className="mt-1.5 block text-sm font-semibold text-sky-700 hover:text-sky-800"
                    >
                      {activo.equipo_trabajo_nombre}
                    </Link>

                  </div>

                )}


                {!activo.equipo_trabajo &&
                  activo.estado ===
                    "DISPONIBLE" && (

                  <InfoCard
                    titulo="Ubicación"
                    valor="Stock / Sin asignación"
                    destacado
                  />

                )}


                {activo.marca && (
                  <InfoCard
                    titulo="Marca"
                    valor={activo.marca}
                  />
                )}


                {activo.modelo && (
                  <InfoCard
                    titulo="Modelo"
                    valor={
                      activo.modelo
                    }
                  />
                )}

              </div>


              {/* CAPACIDAD */}
              {resumenCapacidades.length >
                0 && (

                <div className="mt-5 border-t border-sky-100 pt-5">

                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Capacidad instalada
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">

                    {resumenCapacidades.map(
                      (item) => (

                        <div
                          key={item.id}
                          className="rounded-xl border border-sky-100 bg-white px-3 py-2 shadow-sm"
                        >
                          <span className="text-xs font-medium text-slate-500">
                            {item.tipo}
                          </span>

                          <span className="ml-2 text-sm font-bold text-sky-700">
                            {item.capacidad}
                          </span>
                        </div>

                      ),
                    )}

                  </div>

                </div>

              )}


              {activo.observaciones && (

                <div className="mt-5 border-t border-sky-100 pt-5">

                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Observaciones
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {activo.observaciones}
                  </p>

                </div>

              )}

            </div>

          </section>


          {/* COMPONENTES */}
          <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="flex flex-col gap-4 border-b border-slate-200 bg-gradient-to-r from-white to-sky-50/50 p-5 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <div className="flex items-center gap-2">

                  <h2 className="text-lg font-bold text-slate-900">
                    Componentes instalados
                  </h2>

                  <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700">
                    {componentesEnActivo.length}
                  </span>

                </div>

                <p className="mt-1 text-sm text-slate-500">
                  Componentes internos actualmente asociados al activo.
                </p>

              </div>


              {activo.estado !==
                "BAJA" &&
                activo.estado !==
                  "EN_REPARACION" && (

                <button
                  type="button"
                  onClick={
                    abrirAgregarComponente
                  }
                  className="w-full rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-800 sm:w-auto"
                >
                  + Agregar componente
                </button>

              )}

            </div>


            {componentesEnActivo.length ===
            0 ? (

              <div className="px-5 py-12 text-center">

                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-xl text-sky-700">
                  ◫
                </div>

                <h3 className="mt-4 text-sm font-semibold text-slate-800">
                  Sin componentes instalados
                </h3>

                <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
                  Este activo todavía no tiene componentes registrados.
                </p>

              </div>

            ) : (

              <>
                {/* MOBILE */}
                <div className="divide-y divide-slate-100 md:hidden">

                  {componentesEnActivo.map(
                    (componente) => {

                      const capacidad =
                        formatCapacidad(
                          componente,
                        );

                      return (
                        <article
                          key={
                            componente.id
                          }
                          className="p-4"
                        >

                          <div className="flex items-start justify-between gap-3">

                            <div className="min-w-0">

                              <h3 className="font-semibold text-slate-900">
                                {componente.tipo_componente_nombre}
                              </h3>

                              {(componente.marca ||
                                componente.modelo) && (

                                <p className="mt-1 text-sm text-slate-500">

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
                              className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${estadoComponenteClasses(
                                componente.estado,
                              )}`}
                            >
                              {estadoComponenteLabel(
                                componente.estado,
                              )}
                            </span>

                          </div>


                          {capacidad && (

                            <div className="mt-4 rounded-xl bg-sky-50 p-3">

                              <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-500">
                                Capacidad
                              </p>

                              <p className="mt-1 text-base font-bold text-sky-700">
                                {capacidad}
                              </p>

                            </div>

                          )}


                          {activo.estado !==
                            "BAJA" && (

                            <button
                              type="button"
                              onClick={() =>
                                abrirGestionComponente(
                                  componente,
                                )
                              }
                              className="mt-4 w-full rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
                            >
                              Gestionar componente
                            </button>

                          )}

                        </article>
                      );
                    },
                  )}

                </div>


                {/* DESKTOP */}
                <div className="hidden overflow-x-auto md:block">

                  <table className="min-w-full text-sm">

                    <thead className="bg-slate-50/70">

                      <tr className="text-slate-500">

                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                          Componente
                        </th>

                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                          Marca / Modelo
                        </th>

                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                          Capacidad
                        </th>

                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                          Estado
                        </th>

                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide">
                          Acciones
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {componentesEnActivo.map(
                        (componente) => {

                          const capacidad =
                            formatCapacidad(
                              componente,
                            );

                          return (
                            <tr
                              key={
                                componente.id
                              }
                              className="border-t border-slate-100 transition hover:bg-sky-50/30"
                            >

                              <td className="px-5 py-4 font-semibold text-slate-900">
                                {componente.tipo_componente_nombre}
                              </td>

                              <td className="px-5 py-4 text-slate-600">
                                {[
                                  componente.marca,
                                  componente.modelo,
                                ]
                                  .filter(Boolean)
                                  .join(" ") ||
                                  "—"}
                              </td>

                              <td className="px-5 py-4">

                                {capacidad ? (

                                  <span className="inline-flex rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700">
                                    {capacidad}
                                  </span>

                                ) : (

                                  <span className="text-slate-400">
                                    —
                                  </span>

                                )}

                              </td>

                              <td className="px-5 py-4">

                                <span
                                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${estadoComponenteClasses(
                                    componente.estado,
                                  )}`}
                                >
                                  {estadoComponenteLabel(
                                    componente.estado,
                                  )}
                                </span>

                              </td>

                              <td className="px-5 py-4 text-right">

                                {activo.estado !==
                                  "BAJA" && (

                                  <button
                                    type="button"
                                    onClick={() =>
                                      abrirGestionComponente(
                                        componente,
                                      )
                                    }
                                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                                  >
                                    Gestionar
                                  </button>

                                )}

                              </td>

                            </tr>
                          );
                        },
                      )}

                    </tbody>

                  </table>

                </div>

              </>
            )}

          </section>

        </div>

      </div>


      {/* ======================================================
          MODAL AGREGAR COMPONENTE
      ====================================================== */}

      {componenteModalOpen && (

        <ModalShell
          onClose={
            cerrarComponenteModal
          }
          disabled={asociando}
          titulo="Agregar componente"
          subtitulo="Componentes"
        >

          <div className="border-b border-slate-100 px-5 pb-4 text-sm text-slate-500">

            Seleccioná un componente disponible compatible con{" "}

            <strong className="text-slate-700">
              {activo.codigo_inventario}
            </strong>
            .

          </div>


          <div className="min-h-0 flex-1 overflow-y-auto">

            {loadingComponentes ? (

              <LoadingBloque
                texto="Cargando componentes..."
              />

            ) : errorComponentes ? (

              <ErrorBloque
                mensaje={
                  errorComponentes
                }
              />

            ) : componentesDisponibles.length ===
              0 ? (

              <div className="p-10 text-center">

                <p className="text-sm font-semibold text-slate-700">
                  No hay componentes compatibles disponibles
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  No encontramos stock disponible para este tipo de activo.
                </p>

              </div>

            ) : (

              <div className="divide-y divide-slate-100">

                {componentesDisponibles.map(
                  (componente) => {

                    const selected =
                      componenteSeleccionado?.id ===
                      componente.id;

                    const capacidad =
                      formatCapacidad(
                        componente,
                      );

                    return (
                      <button
                        type="button"
                        key={
                          componente.id
                        }
                        onClick={() =>
                          setComponenteSeleccionado(
                            componente,
                          )
                        }
                        className={`w-full p-4 text-left transition ${
                          selected
                            ? "bg-sky-50"
                            : "hover:bg-slate-50"
                        }`}
                      >

                        <div className="flex items-start gap-3">

                          <span
                            className={`mt-1 h-4 w-4 shrink-0 rounded-full border ${
                              selected
                                ? "border-[5px] border-sky-600"
                                : "border-slate-300"
                            }`}
                          />


                          <div className="min-w-0 flex-1">

                            <div className="flex flex-wrap items-center gap-2">

                              <span className="font-semibold text-slate-900">
                                {componente.tipo_componente_nombre}
                              </span>

                              {capacidad && (

                                <span className="rounded-lg bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-700">
                                  {capacidad}
                                </span>

                              )}

                            </div>


                            {(componente.marca ||
                              componente.modelo) && (

                              <p className="mt-1 text-sm text-slate-500">

                                {[
                                  componente.marca,
                                  componente.modelo,
                                ]
                                  .filter(Boolean)
                                  .join(" ")}

                              </p>

                            )}

                          </div>

                        </div>

                      </button>
                    );
                  },
                )}

              </div>

            )}

          </div>


          <ModalFooter
            onCancelar={
              cerrarComponenteModal
            }
            onConfirmar={
              asociarComponente
            }
            disabled={
              !componenteSeleccionado ||
              asociando
            }
            procesando={asociando}
            texto="Instalar componente"
            textoProcesando="Instalando..."
          />

        </ModalShell>

      )}


      {/* ======================================================
          MODAL GESTIONAR ACTIVO
      ====================================================== */}

      {gestionActivoOpen && (

        <ModalShell
          onClose={
            cerrarGestionActivo
          }
          disabled={
            operandoActivo
          }
          titulo={
            vistaGestionActivo ===
            "MENU"
              ? "Gestionar activo"
              : activo.codigo_inventario
          }
          subtitulo={
            activo.tipo_activo_nombre
          }
          onBack={
            vistaGestionActivo !==
            "MENU"
              ? volverGestionActivo
              : undefined
          }
        >

          {vistaGestionActivo ===
            "MENU" && (

            <GestionActivoMenu
              activo={activo}
              onSeleccionar={
                seleccionarVistaActivo
              }
            />

          )}


          {/* CONFIGURACIÓN */}
          {vistaGestionActivo ===
            "CONFIGURACION" && (

            <div className="p-5">

              <h3 className="text-lg font-bold text-slate-900">
                Actualizar configuración
              </h3>


              <p className="mt-2 text-sm leading-6 text-slate-500">
                Modificá el hostname o el sistema operativo del activo.
                Su estado, ubicación y asignación no se modificarán.
              </p>


              <div className="mt-5">

                <label className="text-sm font-semibold text-slate-700">
                  Hostname
                </label>


                <input
                  type="text"
                  value={
                    hostnameConfiguracion
                  }
                  disabled={
                    operandoActivo
                  }
                  onChange={(event) =>
                    setHostnameConfiguracion(
                      event.target.value,
                    )
                  }
                  placeholder="Ej. PC-FACTURACION-01"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 font-mono text-base text-slate-800 outline-none transition placeholder:font-sans placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 sm:text-sm"
                />

              </div>


              <div className="mt-5">

                <label className="text-sm font-semibold text-slate-700">
                  Sistema operativo
                </label>


                {loadingSistemasOperativos ? (

                  <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                    Cargando sistemas operativos...
                  </div>

                ) : (

                  <select
                    value={
                      sistemaOperativoId
                    }
                    disabled={
                      operandoActivo
                    }
                    onChange={(event) =>
                      setSistemaOperativoId(
                        event.target.value,
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-base text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 sm:text-sm"
                  >

                    <option value="">
                      Sin sistema operativo
                    </option>


                    {sistemasOperativos.map(
                      (sistema) => (

                        <option
                          key={
                            sistema.id
                          }
                          value={
                            sistema.id
                          }
                        >
                          {sistema.nombre}
                        </option>

                      ),
                    )}

                  </select>

                )}

              </div>


              <div className="mt-5 rounded-xl border border-sky-100 bg-sky-50/70 p-4">

                <p className="text-sm font-semibold text-sky-800">
                  Cambio trazable
                </p>

                <p className="mt-1 text-xs leading-5 text-sky-700/80">
                  La modificación quedará registrada en el historial
                  del activo. Cuando exista un usuario autenticado,
                  también quedará registrado quién realizó el cambio.
                </p>

              </div>


              {errorOperacionActivo && (

                <ErrorBloque
                  mensaje={
                    errorOperacionActivo
                  }
                />

              )}


              <button
                type="button"
                disabled={
                  operandoActivo ||
                  loadingSistemasOperativos
                }
                onClick={
                  actualizarConfiguracionActivo
                }
                className="mt-5 w-full rounded-xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {operandoActivo
                  ? "Guardando..."
                  : "Guardar configuración"}
              </button>

            </div>

          )}


          {/* MOVER / ASIGNAR */}
          {vistaGestionActivo ===
            "MOVER" && (

            <FormularioDestino
              titulo={
                activo.equipo_trabajo
                  ? "Mover a otro equipo"
                  : "Asignar a un equipo"
              }
              descripcion={
                activo.equipo_trabajo
                  ? "Seleccioná el nuevo equipo de trabajo. El sector del activo se actualizará automáticamente según el equipo elegido."
                  : "Seleccioná el equipo de trabajo al que querés asignar este activo. El sector se establecerá automáticamente."
              }
              label="Equipo de trabajo destino"
              value={
                equipoDestinoId
              }
              onChange={
                setEquipoDestinoId
              }
              opciones={
                equiposTrabajo.map(
                  (equipo) => ({
                    id: equipo.id,

                    label: [
                      equipo.area_nombre,
                      equipo.sector_nombre,
                      equipo.nombre,
                    ]
                      .filter(Boolean)
                      .join(" · "),
                  }),
                )
              }
              loading={
                loadingDestinos
              }
              observacion={
                observacionActivo
              }
              setObservacion={
                setObservacionActivo
              }
              error={
                errorOperacionActivo
              }
              operando={
                operandoActivo
              }
              textoConfirmar={
                activo.equipo_trabajo
                  ? "Mover activo"
                  : "Asignar activo"
              }
              onConfirmar={
                moverActivo
              }
            />

          )}


          {/* STOCK */}
          {vistaGestionActivo ===
            "STOCK" && (

            <ConfirmarOperacion
              titulo="Enviar a stock"
              descripcion={
                activo.equipo_trabajo_nombre
                  ? `El activo dejará de estar asociado a ${activo.equipo_trabajo_nombre} y quedará disponible, sin sector ni equipo de trabajo asignado.`
                  : "El activo quedará disponible y sin ubicación asignada."
              }
              aviso={
                componentesEnActivo.length >
                0
                  ? `Los ${componentesEnActivo.length} componente(s) instalados permanecerán asociados a ${activo.codigo_inventario}.`
                  : undefined
              }
              observacion={
                observacionActivo
              }
              setObservacion={
                setObservacionActivo
              }
              error={
                errorOperacionActivo
              }
              operando={
                operandoActivo
              }
              textoConfirmar="Enviar a stock"
              onConfirmar={
                enviarActivoStock
              }
            />

          )}


          {/* REPARACIÓN */}
          {vistaGestionActivo ===
            "REPARACION" && (

            <ConfirmarOperacion
              titulo="Enviar a reparación"
              descripcion={
                activo.equipo_trabajo_nombre
                  ? `El activo será retirado de ${activo.equipo_trabajo_nombre}, quedará sin sector ni equipo asignado y pasará al estado En reparación.`
                  : "El activo quedará sin ubicación asignada y pasará al estado En reparación."
              }
              observacion={
                observacionActivo
              }
              setObservacion={
                setObservacionActivo
              }
              error={
                errorOperacionActivo
              }
              operando={
                operandoActivo
              }
              textoConfirmar="Enviar a reparación"
              onConfirmar={
                enviarActivoReparacion
              }
              observacionRequerida
            />

          )}


          {/* RETORNO REPARACIÓN */}
          {vistaGestionActivo ===
            "RETORNO_REPARACION" && (

            <ConfirmarOperacion
              titulo="Retornar de reparación"
              descripcion="El activo saldrá del estado En reparación y volverá a estar Disponible. Quedará sin sector ni equipo de trabajo hasta que sea asignado nuevamente."
              observacion={
                observacionActivo
              }
              setObservacion={
                setObservacionActivo
              }
              error={
                errorOperacionActivo
              }
              operando={
                operandoActivo
              }
              textoConfirmar="Retornar a stock"
              onConfirmar={
                retornarActivoStock
              }
            />

          )}


          {/* DEFECTUOSO */}
          {vistaGestionActivo ===
            "DEFECTUOSO" && (

            <ConfirmarOperacion
              titulo="Marcar como defectuoso"
              descripcion={
                activo.equipo_trabajo_nombre
                  ? `El activo permanecerá asociado a ${activo.equipo_trabajo_nombre}. Solo cambiará su estado.`
                  : "El activo conservará su situación actual y quedará marcado como defectuoso."
              }
              observacion={
                observacionActivo
              }
              setObservacion={
                setObservacionActivo
              }
              error={
                errorOperacionActivo
              }
              operando={
                operandoActivo
              }
              textoConfirmar="Marcar defectuoso"
              observacionRequerida
              peligro
              onConfirmar={() =>
                ejecutarOperacionActivoSimple(
                  "marcar-defectuoso",
                )
              }
            />

          )}


          {/* OPERATIVO */}
          {vistaGestionActivo ===
            "OPERATIVO" && (

            <ConfirmarOperacion
              titulo="Marcar nuevamente operativo"
              descripcion={
                activo.equipo_trabajo
                  ? "El activo volverá a estado En uso y continuará asociado al equipo de trabajo actual."
                  : "El activo volverá a estado Disponible y continuará sin asignación."
              }
              observacion={
                observacionActivo
              }
              setObservacion={
                setObservacionActivo
              }
              error={
                errorOperacionActivo
              }
              operando={
                operandoActivo
              }
              textoConfirmar="Marcar operativo"
              onConfirmar={() =>
                ejecutarOperacionActivoSimple(
                  "marcar-operativo",
                )
              }
            />

          )}


          {/* BAJA */}
          {vistaGestionActivo ===
            "BAJA" && (

            <ConfirmarOperacion
              titulo="Dar de baja definitivamente"
              descripcion="El activo dejará de formar parte del inventario operativo. Quedará sin sector ni equipo de trabajo, pero el registro y todo su historial se conservarán."
              aviso={
                componentesEnActivo.length >
                0
                  ? `Este activo tiene ${componentesEnActivo.length} componente(s) asociados. La baja del activo no los desmontará automáticamente.`
                  : undefined
              }
              observacion={
                observacionActivo
              }
              setObservacion={
                setObservacionActivo
              }
              error={
                errorOperacionActivo
              }
              operando={
                operandoActivo
              }
              textoConfirmar="Dar de baja"
              observacionRequerida
              peligro
              onConfirmar={() =>
                ejecutarOperacionActivoSimple(
                  "dar-baja",
                )
              }
            />

          )}

        </ModalShell>

      )}


      {/* ======================================================
          MODAL GESTIONAR COMPONENTE
      ====================================================== */}

      {gestionComponenteOpen &&
        componenteGestionado && (

        <ModalShell
          onClose={
            cerrarGestionComponente
          }
          disabled={
            operandoComponente
          }
          titulo={
            vistaGestionComponente ===
            "MENU"
              ? "Gestionar componente"
              : componenteGestionado
                  .tipo_componente_nombre ?? "Componente"
          }
          subtitulo={
            componenteGestionado
              .tipo_componente_nombre
          }
          onBack={
            vistaGestionComponente !==
            "MENU"
              ? volverGestionComponente
              : undefined
          }
        >

          {vistaGestionComponente ===
            "MENU" && (

            <GestionComponenteMenu
              componente={
                componenteGestionado
              }
              activo={activo}
              onSeleccionar={
                setVistaGestionComponente
              }
            />

          )}


          {vistaGestionComponente ===
            "DEFECTUOSO" && (

            <ConfirmarOperacion
              titulo="Marcar como defectuoso"
              descripcion={`El componente permanecerá físicamente asociado a ${activo.codigo_inventario}.`}
              observacion={
                observacionComponente
              }
              setObservacion={
                setObservacionComponente
              }
              error={
                errorOperacionComponente
              }
              operando={
                operandoComponente
              }
              textoConfirmar="Marcar defectuoso"
              observacionRequerida
              peligro
              onConfirmar={() =>
                ejecutarOperacionComponente(
                  "marcar-defectuoso",
                )
              }
            />

          )}


          {vistaGestionComponente ===
            "OPERATIVO" && (

            <ConfirmarOperacion
              titulo="Marcar nuevamente operativo"
              descripcion={`El componente continuará instalado en ${activo.codigo_inventario}.`}
              observacion={
                observacionComponente
              }
              setObservacion={
                setObservacionComponente
              }
              error={
                errorOperacionComponente
              }
              operando={
                operandoComponente
              }
              textoConfirmar="Marcar operativo"
              onConfirmar={() =>
                ejecutarOperacionComponente(
                  "marcar-operativo",
                )
              }
            />

          )}


          {vistaGestionComponente ===
            "STOCK" && (

            <ConfirmarOperacion
              titulo="Retirar y enviar a stock"
              descripcion={`El componente será retirado de ${activo.codigo_inventario}, dejará de estar asociado a este activo y quedará Disponible.`}
              observacion={
                observacionComponente
              }
              setObservacion={
                setObservacionComponente
              }
              error={
                errorOperacionComponente
              }
              operando={
                operandoComponente
              }
              textoConfirmar="Enviar a stock"
              onConfirmar={() =>
                ejecutarOperacionComponente(
                  "enviar-stock",
                )
              }
            />

          )}


          {vistaGestionComponente ===
            "REPARACION" && (

            <ConfirmarOperacion
              titulo="Enviar a reparación"
              descripcion={`El componente será retirado de ${activo.codigo_inventario} y pasará al estado En reparación.`}
              observacion={
                observacionComponente
              }
              setObservacion={
                setObservacionComponente
              }
              error={
                errorOperacionComponente
              }
              operando={
                operandoComponente
              }
              textoConfirmar="Enviar a reparación"
              observacionRequerida
              onConfirmar={() =>
                ejecutarOperacionComponente(
                  "enviar-reparacion",
                )
              }
            />

          )}


          {vistaGestionComponente ===
            "BAJA" && (

            <ConfirmarOperacion
              titulo="Dar de baja componente"
              descripcion={`El componente será retirado de ${activo.codigo_inventario} y quedará dado de baja definitivamente. Su historial se conservará.`}
              observacion={
                observacionComponente
              }
              setObservacion={
                setObservacionComponente
              }
              error={
                errorOperacionComponente
              }
              operando={
                operandoComponente
              }
              textoConfirmar="Dar de baja"
              observacionRequerida
              peligro
              onConfirmar={() =>
                ejecutarOperacionComponente(
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
   COMPONENTES UI
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

        {/* HANDLE MOBILE */}
        <div className="flex justify-center pt-2 sm:hidden">
          <div className="h-1.5 w-12 rounded-full bg-slate-200" />
        </div>


        <div className="relative shrink-0 border-b border-slate-200 bg-gradient-to-r from-sky-50 to-white p-5">

          <div className="absolute inset-y-0 left-0 hidden w-1.5 bg-sky-600 sm:block" />


          <div className="pr-12">

            {onBack && (

              <button
                type="button"
                disabled={
                  disabled
                }
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
            disabled={
              disabled
            }
            onClick={
              onClose
            }
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-xl text-slate-400 transition hover:bg-slate-50 disabled:opacity-40"
            aria-label="Cerrar"
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


function GestionActivoMenu({
  activo,
  onSeleccionar,
}: {
  activo: Activo;
  onSeleccionar: (
    vista: VistaGestionActivo,
  ) => void;
}) {
  const enReparacion =
    activo.estado ===
    "EN_REPARACION";

  const defectuoso =
    activo.estado ===
    "DEFECTUOSO";

  const tieneEquipo =
    Boolean(
      activo.equipo_trabajo,
    );

  const disponible =
    activo.estado ===
    "DISPONIBLE";

  const ubicacion =
    ubicacionActivoTitulo(
      activo,
    );


  return (
    <div className="p-4 sm:p-5">

      {/* SITUACIÓN ACTUAL */}
      <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">

        <div className="flex items-center justify-between gap-3">

          <div>

            <p className="text-xs text-slate-400">
              Estado actual
            </p>

            <p className="mt-1 font-semibold text-slate-800">
              {estadoActivoLabel(
                activo.estado,
              )}
            </p>

          </div>


          <span
            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${estadoActivoClasses(
              activo.estado,
            )}`}
          >
            {estadoActivoLabel(
              activo.estado,
            )}
          </span>

        </div>


        <div className="mt-3 border-t border-slate-200 pt-3">

          <p className="text-xs text-slate-400">
            Ubicación actual
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            {ubicacion}
          </p>

          {activo.equipo_trabajo_nombre && (

            <p className="mt-0.5 text-sm text-slate-500">
              {activo.equipo_trabajo_nombre}
            </p>

          )}

        </div>

      </div>


      <div className="space-y-2">

        {/* CONFIGURACIÓN */}
        {!enReparacion && (

          <AccionGestion
            icono="⚙"
            titulo="Actualizar configuración"
            descripcion="Modificar hostname o sistema operativo."
            onClick={() =>
              onSeleccionar(
                "CONFIGURACION",
              )
            }
          />

        )}


        {/* MOVER */}
        {!enReparacion &&
          tieneEquipo && (

          <AccionGestion
            icono="⇄"
            titulo="Mover a otro equipo"
            descripcion="Cambiar el puesto donde está asignado."
            onClick={() =>
              onSeleccionar(
                "MOVER",
              )
            }
          />

        )}


        {/* ASIGNAR DESDE STOCK */}
        {!enReparacion &&
          !tieneEquipo &&
          disponible && (

          <AccionGestion
            icono="→"
            titulo="Asignar a un equipo"
            descripcion="Asignar este activo disponible a un equipo de trabajo."
            onClick={() =>
              onSeleccionar(
                "MOVER",
              )
            }
          />

        )}


        {/* STOCK */}
        {!enReparacion &&
          tieneEquipo && (

          <AccionGestion
            icono="↓"
            titulo="Enviar a stock"
            descripcion="Retirar del equipo y dejar sin asignación."
            onClick={() =>
              onSeleccionar(
                "STOCK",
              )
            }
          />

        )}


        {/* OPERATIVO */}
        {!enReparacion &&
          defectuoso && (

          <AccionGestion
            icono="✓"
            titulo="Marcar nuevamente operativo"
            descripcion="Indicar que el activo volvió a funcionar correctamente."
            onClick={() =>
              onSeleccionar(
                "OPERATIVO",
              )
            }
          />

        )}


        {/* DEFECTUOSO */}
        {!enReparacion &&
          !defectuoso && (

          <AccionGestion
            icono="!"
            titulo="Marcar como defectuoso"
            descripcion="Registrar la falla sin mover el activo."
            onClick={() =>
              onSeleccionar(
                "DEFECTUOSO",
              )
            }
          />

        )}


        {/* REPARACIÓN */}
        {!enReparacion && (

          <AccionGestion
            icono="⌁"
            titulo="Enviar a reparación"
            descripcion="Retirar de su asignación y registrar su reparación."
            onClick={() =>
              onSeleccionar(
                "REPARACION",
              )
            }
          />

        )}


        {/* RETORNO */}
        {enReparacion && (

          <AccionGestion
            icono="↩"
            titulo="Retornar de reparación"
            descripcion="Dejar nuevamente disponible y sin asignación."
            onClick={() =>
              onSeleccionar(
                "RETORNO_REPARACION",
              )
            }
          />

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


function GestionComponenteMenu({
  componente,
  activo,
  onSeleccionar,
}: {
  componente: Componente;
  activo: Activo;
  onSeleccionar: (
    vista: VistaGestionComponente,
  ) => void;
}) {
  const capacidad =
    formatCapacidad(
      componente,
    );

  const defectuoso =
    componente.estado ===
    "DEFECTUOSO";


  return (
    <div className="p-4 sm:p-5">

      <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">

        <div className="flex items-start justify-between gap-3">

          <div>

            <p className="font-semibold text-slate-800">
              {componente.tipo_componente_nombre}

              {capacidad
                ? ` · ${capacidad}`
                : ""}
            </p>


            {(componente.marca ||
              componente.modelo) && (

              <p className="mt-1 text-sm text-slate-500">

                {[
                  componente.marca,
                  componente.modelo,
                ]
                  .filter(Boolean)
                  .join(" ")}

              </p>

            )}


            <p className="mt-2 text-xs text-slate-400">

              Instalado en{" "}

              <span className="font-mono font-semibold text-slate-600">
                {activo.codigo_inventario}
              </span>

            </p>

          </div>


          <span
            className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${estadoComponenteClasses(
              componente.estado,
            )}`}
          >
            {estadoComponenteLabel(
              componente.estado,
            )}
          </span>

        </div>

      </div>


      <div className="space-y-2">

        {defectuoso ? (

          <AccionGestion
            icono="✓"
            titulo="Marcar nuevamente operativo"
            descripcion="El componente continuará instalado en este activo."
            onClick={() =>
              onSeleccionar(
                "OPERATIVO",
              )
            }
          />

        ) : (

          <AccionGestion
            icono="!"
            titulo="Marcar como defectuoso"
            descripcion="Registrar la falla manteniéndolo instalado."
            onClick={() =>
              onSeleccionar(
                "DEFECTUOSO",
              )
            }
          />

        )}


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

      </div>


      <div className="my-4 border-t border-slate-200" />


      <AccionGestion
        icono="×"
        titulo="Dar de baja"
        descripcion="Retirar y dar de baja definitivamente."
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
  aviso,
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
  aviso?: string;
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


      {aviso && (

        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-5 text-amber-800">
          {aviso}
        </div>

      )}


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

        <ErrorBloque
          mensaje={error}
        />

      )}


      <div className="mt-5">

        <button
          type="button"
          disabled={
            operando ||
            invalido
          }
          onClick={
            onConfirmar
          }
          className={`w-full rounded-xl px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${
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

    </div>
  );
}


function FormularioDestino({
  titulo,
  descripcion,
  aviso,
  label,
  value,
  onChange,
  opciones,
  loading,
  observacion,
  setObservacion,
  error,
  operando,
  textoConfirmar,
  onConfirmar,
  observacionRequerida = false,
}: {
  titulo: string;
  descripcion: string;
  aviso?: string;
  label: string;
  value: string;
  onChange: (
    value: string,
  ) => void;
  opciones: {
    id: number;
    label: string;
  }[];
  loading: boolean;
  observacion: string;
  setObservacion: (
    value: string,
  ) => void;
  error: string | null;
  operando: boolean;
  textoConfirmar: string;
  onConfirmar: () => void;
  observacionRequerida?: boolean;
}) {
  const invalido =
    !value ||
    (
      observacionRequerida &&
      !observacion.trim()
    );


  return (
    <div className="p-5">

      <h3 className="text-lg font-bold text-slate-900">
        {titulo}
      </h3>


      <p className="mt-2 text-sm leading-6 text-slate-500">
        {descripcion}
      </p>


      {aviso && (

        <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm leading-5 text-sky-800">
          {aviso}
        </div>

      )}


      <div className="mt-5">

        <label className="text-sm font-semibold text-slate-700">
          {label} *
        </label>


        {loading ? (

          <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
            Cargando opciones...
          </div>

        ) : (

          <select
            value={value}
            onChange={(event) =>
              onChange(
                event.target.value,
              )
            }
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-base text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 sm:text-sm"
          >

            <option value="">
              Seleccionar...
            </option>


            {opciones.map(
              (opcion) => (

                <option
                  key={opcion.id}
                  value={opcion.id}
                >
                  {opcion.label}
                </option>

              ),
            )}

          </select>

        )}

      </div>


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

        <ErrorBloque
          mensaje={error}
        />

      )}


      <button
        type="button"
        disabled={
          operando ||
          loading ||
          invalido
        }
        onClick={
          onConfirmar
        }
        className="mt-5 w-full rounded-xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {operando
          ? "Procesando..."
          : textoConfirmar}
      </button>

    </div>
  );
}


function ModalFooter({
  onCancelar,
  onConfirmar,
  disabled,
  procesando,
  texto,
  textoProcesando,
}: {
  onCancelar: () => void;
  onConfirmar: () => void;
  disabled: boolean;
  procesando: boolean;
  texto: string;
  textoProcesando: string;
}) {
  return (
    <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 bg-white p-4 sm:flex-row sm:justify-end">

      <button
        type="button"
        disabled={
          procesando
        }
        onClick={
          onCancelar
        }
        className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
      >
        Cancelar
      </button>


      <button
        type="button"
        disabled={
          disabled
        }
        onClick={
          onConfirmar
        }
        className="rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {procesando
          ? textoProcesando
          : texto}
      </button>

    </div>
  );
}


function LoadingBloque({
  texto,
}: {
  texto: string;
}) {
  return (
    <div className="p-10 text-center">

      <div className="mx-auto h-7 w-7 animate-spin rounded-full border-4 border-slate-200 border-t-sky-600" />

      <p className="mt-3 text-sm text-slate-500">
        {texto}
      </p>

    </div>
  );
}


function ErrorBloque({
  mensaje,
}: {
  mensaje: string;
}) {
  return (
    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      {mensaje}
    </div>
  );
}