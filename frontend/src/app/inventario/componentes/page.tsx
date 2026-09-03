"use client";

import Link from "next/link";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  apiGet,
  apiPost,
} from "@/lib/api";

import type {
  Componente,
  TipoComponente,
} from "@/types";


/* ============================================================
   TIPOS
============================================================ */

type FiltroEstado =
  | "TODOS"
  | "DISPONIBLE"
  | "EN_REPARACION";


type NuevoComponenteForm = {
  tipo_componente: string;
  marca: string;
  modelo: string;
  capacidad_valor: string;
  capacidad_unidad: string;
  fecha_adquisicion: string;
};


/* ============================================================
   HELPERS
============================================================ */

function fechaHoyLocal() {
  const hoy = new Date();

  const year =
    hoy.getFullYear();

  const month =
    String(
      hoy.getMonth() + 1,
    ).padStart(2, "0");

  const day =
    String(
      hoy.getDate(),
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function nuevoFormInicial(): NuevoComponenteForm {
  return {
    tipo_componente: "",
    marca: "",
    modelo: "",
    capacidad_valor: "",
    capacidad_unidad: "",
    fecha_adquisicion:
      fechaHoyLocal(),
  };
}


function estadoLabel(
  estado: string,
) {
  const labels: Record<
    string,
    string
  > = {
    DISPONIBLE: "Disponible",
    EN_REPARACION: "En reparación",
  };

  return labels[estado] ?? estado;
}


function estadoClasses(
  estado: string,
) {
  if (
    estado === "DISPONIBLE"
  ) {
    return (
      "border-emerald-100 " +
      "bg-emerald-50 " +
      "text-emerald-700"
    );
  }

  if (
    estado === "EN_REPARACION"
  ) {
    return (
      "border-orange-100 " +
      "bg-orange-50 " +
      "text-orange-700"
    );
  }

  return (
    "border-slate-200 " +
    "bg-slate-100 " +
    "text-slate-600"
  );
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

  const valorTexto =
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
      `${valorTexto} ` +
      componente.capacidad_unidad
    );
  }

  return valorTexto;
}


function descripcionComponente(
  componente: Componente,
) {
  const descripcion = [
    componente.marca,
    componente.modelo,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    descripcion ||
    "Sin marca / modelo informado"
  );
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


/* ============================================================
   PAGE
============================================================ */

export default function ComponentesPage() {
  /* ==========================================================
     LISTADO
  ========================================================== */

  const [
    componentes,
    setComponentes,
  ] =
    useState<Componente[]>(
      [],
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    busqueda,
    setBusqueda,
  ] = useState("");

  const [
    filtroEstado,
    setFiltroEstado,
  ] =
    useState<FiltroEstado>(
      "TODOS",
    );


  /* ==========================================================
     NUEVO COMPONENTE
  ========================================================== */

  const [
    nuevoModalOpen,
    setNuevoModalOpen,
  ] = useState(false);

  const [
    tiposComponente,
    setTiposComponente,
  ] =
    useState<
      TipoComponente[]
    >([]);

  const [
    loadingTipos,
    setLoadingTipos,
  ] = useState(false);

  const [
    formNuevo,
    setFormNuevo,
  ] =
    useState<NuevoComponenteForm>(
      nuevoFormInicial(),
    );

  const [
    guardandoNuevo,
    setGuardandoNuevo,
  ] = useState(false);

  const [
    errorNuevo,
    setErrorNuevo,
  ] =
    useState<string | null>(
      null,
    );


  /* ==========================================================
     CARGAR LISTADO
  ========================================================== */

  const cargarComponentes =
    useCallback(async () => {
      try {
        setLoading(true);

        setError(null);

        const [
          disponibles,
          reparacion,
        ] = await Promise.all([
          apiGet<
            Componente[]
          >(
            "/inventario/componentes/?estado=DISPONIBLE",
          ),

          apiGet<
            Componente[]
          >(
            "/inventario/componentes/?estado=EN_REPARACION",
          ),
        ]);

        setComponentes([
          ...disponibles,
          ...reparacion,
        ]);

      } catch (err) {
        console.error(err);

        setError(
          "No se pudieron cargar los componentes.",
        );

      } finally {
        setLoading(false);
      }
    }, []);


  useEffect(() => {
    cargarComponentes();
  }, [cargarComponentes]);


  /* ==========================================================
     RESUMEN
  ========================================================== */

  const cantidadDisponibles =
    useMemo(() => {
      return componentes.filter(
        (componente) =>
          componente.estado ===
          "DISPONIBLE",
      ).length;
    }, [componentes]);


  const cantidadReparacion =
    useMemo(() => {
      return componentes.filter(
        (componente) =>
          componente.estado ===
          "EN_REPARACION",
      ).length;
    }, [componentes]);


  /* ==========================================================
     FILTRADO
  ========================================================== */

  const componentesFiltrados =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      return componentes.filter(
        (componente) => {
          if (
            filtroEstado !==
              "TODOS" &&
            componente.estado !==
              filtroEstado
          ) {
            return false;
          }

          if (!texto) {
            return true;
          }

          const capacidad =
            formatCapacidad(
              componente,
            );

          const contenido = [
            componente
              .tipo_componente_nombre,

            componente.marca,

            componente.modelo,

            capacidad,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return contenido.includes(
            texto,
          );
        },
      );
    }, [
      componentes,
      busqueda,
      filtroEstado,
    ]);


  /* ==========================================================
     TIPO SELECCIONADO
  ========================================================== */

  const tipoSeleccionado =
    useMemo(() => {
      if (
        !formNuevo.tipo_componente
      ) {
        return null;
      }

      return (
        tiposComponente.find(
          (tipo) =>
            tipo.id ===
            Number(
              formNuevo
                .tipo_componente,
            ),
        ) ?? null
      );
    }, [
      tiposComponente,
      formNuevo.tipo_componente,
    ]);


  const usaCapacidad =
    Boolean(
      tipoSeleccionado
        ?.tiene_capacidad,
    );


  /* ==========================================================
     ABRIR / CERRAR MODAL
  ========================================================== */

  async function abrirNuevoComponente() {
    setFormNuevo(
      nuevoFormInicial(),
    );

    setErrorNuevo(null);

    setNuevoModalOpen(true);


    if (
      tiposComponente.length >
      0
    ) {
      return;
    }


    try {
      setLoadingTipos(true);

      const data =
        await apiGet<
          TipoComponente[]
        >(
          "/inventario/tipos-componentes/",
        );


      setTiposComponente(
        data.filter(
          (tipo) =>
            tipo.activo,
        ),
      );

    } catch (err) {
      console.error(err);

      setErrorNuevo(
        "No se pudieron cargar los tipos de componente.",
      );

    } finally {
      setLoadingTipos(false);
    }
  }


  function cerrarNuevoComponente() {
    if (guardandoNuevo) {
      return;
    }

    setNuevoModalOpen(false);

    setErrorNuevo(null);

    setFormNuevo(
      nuevoFormInicial(),
    );
  }


  /* ==========================================================
     FORM
  ========================================================== */

  function actualizarCampoNuevo(
    campo:
      keyof NuevoComponenteForm,

    valor: string,
  ) {
    setFormNuevo(
      (actual) => ({
        ...actual,
        [campo]: valor,
      }),
    );
  }


  function cambiarTipo(
    value: string,
  ) {
    const nuevoTipo =
      tiposComponente.find(
        (tipo) =>
          tipo.id ===
          Number(value),
      );


    setFormNuevo(
      (actual) => ({
        ...actual,

        tipo_componente:
          value,

        capacidad_valor:
          nuevoTipo
            ?.tiene_capacidad
            ? actual
                .capacidad_valor
            : "",

        capacidad_unidad:
          nuevoTipo
            ?.tiene_capacidad
            ? (
                actual
                  .capacidad_unidad ||
                "GB"
              )
            : "",
      }),
    );

    setErrorNuevo(null);
  }


  /* ==========================================================
     CREAR
  ========================================================== */

  async function crearComponente() {
    if (
      !formNuevo.tipo_componente
    ) {
      setErrorNuevo(
        "Seleccioná el tipo de componente.",
      );

      return;
    }


    if (
      usaCapacidad &&
      !formNuevo.capacidad_valor
    ) {
      setErrorNuevo(
        "Ingresá la capacidad del componente.",
      );

      return;
    }


    if (
      usaCapacidad &&
      !formNuevo.capacidad_unidad
    ) {
      setErrorNuevo(
        "Seleccioná la unidad de capacidad.",
      );

      return;
    }


    if (
      !formNuevo.fecha_adquisicion
    ) {
      setErrorNuevo(
        "Ingresá la fecha de adquisición.",
      );

      return;
    }


    try {
      setGuardandoNuevo(
        true,
      );

      setErrorNuevo(null);


      await apiPost<Componente>(
        "/operaciones/componentes/crear-stock/",
        {
          tipo_componente:
            Number(
              formNuevo
                .tipo_componente,
            ),

          marca:
            formNuevo.marca.trim(),

          modelo:
            formNuevo.modelo.trim(),

          capacidad_valor:
            usaCapacidad
              ? Number(
                  formNuevo
                    .capacidad_valor,
                )
              : null,

          capacidad_unidad:
            usaCapacidad
              ? formNuevo
                  .capacidad_unidad
              : "",

          fecha_adquisicion:
            formNuevo
              .fecha_adquisicion,
        },
      );


      setNuevoModalOpen(
        false,
      );

      setFormNuevo(
        nuevoFormInicial(),
      );


      await cargarComponentes();


      setFiltroEstado(
        "DISPONIBLE",
      );

    } catch (err) {
      console.error(err);

      setErrorNuevo(
        obtenerMensajeError(
          err,
          "No se pudo crear el componente.",
        ),
      );

    } finally {
      setGuardandoNuevo(
        false,
      );
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
            Cargando componentes...
          </p>

        </div>

      </div>
    );
  }


  /* ==========================================================
     ERROR LISTADO
  ========================================================== */

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8">

        <div className="mx-auto max-w-[1500px]">

          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>

        </div>

      </div>
    );
  }


  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <>
      <div className="min-h-screen bg-slate-50/70">

        <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">

          {/* ==================================================
              CABECERA
          ================================================== */}

          <section className="relative overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-br from-white via-white to-sky-50 shadow-sm">

            <div className="absolute inset-y-0 left-0 w-1.5 bg-sky-600" />


            <div className="p-5 sm:p-7">

              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                <div>

                  <div className="flex flex-wrap items-center gap-2">

                    <span className="rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-sky-700">
                      Inventario
                    </span>

                    <span className="text-sm text-slate-400">
                      Gestión operativa
                    </span>

                  </div>


                  <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    Componentes
                  </h1>


                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                    Componentes internos disponibles
                    para instalar o actualmente
                    enviados a reparación.
                  </p>

                </div>


                <button
                  type="button"
                  onClick={
                    abrirNuevoComponente
                  }
                  className="inline-flex w-full items-center justify-center rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-800 lg:w-auto"
                >
                  + Nuevo componente
                </button>

              </div>


              {/* RESUMEN */}

              <div className="mt-6 grid grid-cols-2 gap-3 sm:max-w-xl">

                <button
                  type="button"
                  onClick={() =>
                    setFiltroEstado(
                      "DISPONIBLE",
                    )
                  }
                  className={`rounded-2xl border p-4 text-left transition ${
                    filtroEstado ===
                    "DISPONIBLE"
                      ? "border-emerald-200 bg-emerald-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-emerald-200"
                  }`}
                >

                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Disponibles
                  </p>


                  <div className="mt-2 flex items-end justify-between gap-2">

                    <p className="text-2xl font-bold text-slate-900 sm:text-3xl">
                      {cantidadDisponibles}
                    </p>

                    <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      Stock
                    </span>

                  </div>

                </button>


                <button
                  type="button"
                  onClick={() =>
                    setFiltroEstado(
                      "EN_REPARACION",
                    )
                  }
                  className={`rounded-2xl border p-4 text-left transition ${
                    filtroEstado ===
                    "EN_REPARACION"
                      ? "border-orange-200 bg-orange-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-orange-200"
                  }`}
                >

                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    En reparación
                  </p>


                  <div className="mt-2 flex items-end justify-between gap-2">

                    <p className="text-2xl font-bold text-slate-900 sm:text-3xl">
                      {cantidadReparacion}
                    </p>

                    <span className="rounded-full border border-orange-100 bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
                      Reparación
                    </span>

                  </div>

                </button>

              </div>

            </div>

          </section>


          {/* ==================================================
              FILTROS
          ================================================== */}

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              <input
                type="search"
                value={busqueda}
                onChange={(event) =>
                  setBusqueda(
                    event.target.value,
                  )
                }
                placeholder="Buscar por tipo, marca, modelo o capacidad..."
                className="w-full flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 sm:text-sm"
              />


              <div className="grid grid-cols-3 gap-2">

                <FiltroButton
                  activo={
                    filtroEstado ===
                    "TODOS"
                  }
                  onClick={() =>
                    setFiltroEstado(
                      "TODOS",
                    )
                  }
                >
                  Todos
                </FiltroButton>


                <FiltroButton
                  activo={
                    filtroEstado ===
                    "DISPONIBLE"
                  }
                  onClick={() =>
                    setFiltroEstado(
                      "DISPONIBLE",
                    )
                  }
                >
                  Disponibles
                </FiltroButton>


                <FiltroButton
                  activo={
                    filtroEstado ===
                    "EN_REPARACION"
                  }
                  onClick={() =>
                    setFiltroEstado(
                      "EN_REPARACION",
                    )
                  }
                >
                  Reparación
                </FiltroButton>

              </div>

            </div>


            {(busqueda ||
              filtroEstado !==
                "TODOS") && (

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">

                <p className="text-xs text-slate-500">
                  {componentesFiltrados.length} resultado(s)
                </p>


                <button
                  type="button"
                  onClick={() => {
                    setBusqueda("");

                    setFiltroEstado(
                      "TODOS",
                    );
                  }}
                  className="text-xs font-semibold text-sky-700 hover:text-sky-800"
                >
                  Limpiar filtros
                </button>

              </div>

            )}

          </section>


          {/* ==================================================
              LISTADO
          ================================================== */}

          <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 bg-gradient-to-r from-white to-sky-50/50 p-5">

              <div className="flex items-center gap-2">

                <h2 className="text-lg font-bold text-slate-900">
                  Componentes sin instalar
                </h2>

                <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700">
                  {componentesFiltrados.length}
                </span>

              </div>


              <p className="mt-1 text-sm text-slate-500">
                Stock de componentes y elementos
                actualmente en reparación.
              </p>

            </div>


            {componentesFiltrados.length ===
            0 ? (

              <div className="px-5 py-14 text-center">

                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-xl text-sky-700">
                  ◫
                </div>

                <h3 className="mt-4 text-sm font-semibold text-slate-800">
                  No hay componentes para mostrar
                </h3>

                <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
                  No encontramos componentes que
                  coincidan con los filtros seleccionados.
                </p>

              </div>

            ) : (

              <>
                {/* MOBILE */}

                <div className="divide-y divide-slate-100 md:hidden">

                  {componentesFiltrados.map(
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

                              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-sky-600">
                                Componente
                              </p>

                              <h3 className="mt-1 text-lg font-bold text-slate-900">
                                {
                                  componente
                                    .tipo_componente_nombre
                                }
                              </h3>

                            </div>


                            <span
                              className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${estadoClasses(
                                componente.estado,
                              )}`}
                            >
                              {estadoLabel(
                                componente.estado,
                              )}
                            </span>

                          </div>


                          <div className="mt-4">

                            <p className="text-sm font-semibold text-slate-700">
                              {descripcionComponente(
                                componente,
                              )}
                            </p>


                            {capacidad && (

                              <span className="mt-3 inline-flex rounded-lg bg-sky-50 px-2.5 py-1 text-sm font-bold text-sky-700">
                                {capacidad}
                              </span>

                            )}

                          </div>


                          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3">

                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                              Ubicación actual
                            </p>

                            <p className="mt-1 text-sm font-semibold text-slate-700">
                              {componente.estado ===
                              "EN_REPARACION"
                                ? "En reparación"
                                : "Stock / Sin asignación"}
                            </p>

                          </div>


                          <Link
                            href={`/inventario/componentes/${componente.id}`}
                            className="mt-4 block w-full rounded-xl bg-sky-700 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-sky-800"
                          >
                            Ver componente
                          </Link>

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
                          Tipo
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

                      {componentesFiltrados.map(
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

                              <td className="px-5 py-4">

                                <Link
                                  href={`/inventario/componentes/${componente.id}`}
                                  className="font-semibold text-sky-700 hover:text-sky-800"
                                >
                                  {
                                    componente
                                      .tipo_componente_nombre
                                  }
                                </Link>

                              </td>


                              <td className="px-5 py-4 text-slate-600">
                                {descripcionComponente(
                                  componente,
                                )}
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
                                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${estadoClasses(
                                    componente.estado,
                                  )}`}
                                >
                                  {estadoLabel(
                                    componente.estado,
                                  )}
                                </span>

                              </td>


                              <td className="px-5 py-4 text-right">

                                <Link
                                  href={`/inventario/componentes/${componente.id}`}
                                  className="inline-flex rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-100"
                                >
                                  Ver componente
                                </Link>

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
          MODAL NUEVO COMPONENTE
      ====================================================== */}

      {nuevoModalOpen && (

        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 backdrop-blur-[2px] sm:items-center sm:p-4">

          <div className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-xl sm:rounded-2xl">

            {/* HANDLE MOBILE */}

            <div className="flex justify-center pt-2 sm:hidden">

              <div className="h-1.5 w-12 rounded-full bg-slate-200" />

            </div>


            {/* HEADER */}

            <div className="relative shrink-0 border-b border-slate-200 bg-gradient-to-r from-sky-50 to-white p-5">

              <div className="absolute inset-y-0 left-0 hidden w-1.5 bg-sky-600 sm:block" />


              <div className="pr-12">

                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-sky-600">
                  Stock
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  Nuevo componente
                </h2>

                <p className="mt-1 text-sm leading-5 text-slate-500">
                  Se incorporará automáticamente
                  como componente disponible.
                </p>

              </div>


              <button
                type="button"
                disabled={
                  guardandoNuevo
                }
                onClick={
                  cerrarNuevoComponente
                }
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-xl text-slate-400 transition hover:bg-slate-50 disabled:opacity-40"
                aria-label="Cerrar"
              >
                ×
              </button>

            </div>


            {/* BODY */}

            <div className="min-h-0 flex-1 overflow-y-auto p-5">

              {errorNuevo && (

                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {errorNuevo}
                </div>

              )}


              <div className="grid gap-5 sm:grid-cols-2">

                {/* TIPO */}

                <Campo
                  label="Tipo de componente"
                  requerido
                  className="sm:col-span-2"
                >

                  <select
                    value={
                      formNuevo
                        .tipo_componente
                    }
                    disabled={
                      loadingTipos ||
                      guardandoNuevo
                    }
                    onChange={(event) =>
                      cambiarTipo(
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-base text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 sm:text-sm"
                  >

                    <option value="">
                      {loadingTipos
                        ? "Cargando tipos..."
                        : "Seleccionar tipo..."}
                    </option>


                    {tiposComponente.map(
                      (tipo) => (

                        <option
                          key={tipo.id}
                          value={tipo.id}
                        >
                          {tipo.nombre}
                        </option>

                      ),
                    )}

                  </select>

                </Campo>


                {/* MARCA */}

                <Campo label="Marca">

                  <input
                    type="text"
                    value={
                      formNuevo.marca
                    }
                    disabled={
                      guardandoNuevo
                    }
                    onChange={(event) =>
                      actualizarCampoNuevo(
                        "marca",
                        event.target.value,
                      )
                    }
                    placeholder="Ej. Kingston"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 sm:text-sm"
                  />

                </Campo>


                {/* MODELO */}

                <Campo label="Modelo">

                  <input
                    type="text"
                    value={
                      formNuevo.modelo
                    }
                    disabled={
                      guardandoNuevo
                    }
                    onChange={(event) =>
                      actualizarCampoNuevo(
                        "modelo",
                        event.target.value,
                      )
                    }
                    placeholder="Ej. Fury Beast"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 sm:text-sm"
                  />

                </Campo>


                {/* CAPACIDAD */}

                {usaCapacidad && (

                  <Campo
                    label="Capacidad"
                    requerido
                    className="sm:col-span-2"
                  >

                    <div className="grid grid-cols-[1fr_110px] gap-2">

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          formNuevo
                            .capacidad_valor
                        }
                        disabled={
                          guardandoNuevo
                        }
                        onChange={(event) =>
                          actualizarCampoNuevo(
                            "capacidad_valor",
                            event.target.value,
                          )
                        }
                        placeholder="Ej. 8"
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 sm:text-sm"
                      />


                      <select
                        value={
                          formNuevo
                            .capacidad_unidad
                        }
                        disabled={
                          guardandoNuevo
                        }
                        onChange={(event) =>
                          actualizarCampoNuevo(
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

                  </Campo>

                )}


                {/* FECHA */}

                <Campo
                  label="Fecha de adquisición"
                  requerido
                  className="sm:col-span-2"
                >

                  <input
                    type="date"
                    value={
                      formNuevo
                        .fecha_adquisicion
                    }
                    disabled={
                      guardandoNuevo
                    }
                    onChange={(event) =>
                      actualizarCampoNuevo(
                        "fecha_adquisicion",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-base text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 sm:text-sm"
                  />

                  <p className="mt-1.5 text-xs text-slate-400">
                    Se completa con la fecha de hoy,
                    pero podés modificarla.
                  </p>

                </Campo>

              </div>


              {/* RESULTADO */}

              <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">

                <div className="flex items-start gap-3">

                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm">
                    ✓
                  </span>


                  <div>

                    <p className="text-sm font-semibold text-emerald-800">
                      Ingreso a stock
                    </p>

                    <p className="mt-1 text-xs leading-5 text-emerald-700/80">
                      Al crear el componente quedará
                      Disponible y sin activo asociado.
                    </p>

                  </div>

                </div>

              </div>

            </div>


            {/* FOOTER */}

            <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:justify-end">

              <button
                type="button"
                disabled={
                  guardandoNuevo
                }
                onClick={
                  cerrarNuevoComponente
                }
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
              >
                Cancelar
              </button>


              <button
                type="button"
                disabled={
                  guardandoNuevo ||
                  loadingTipos
                }
                onClick={
                  crearComponente
                }
                className="rounded-xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {guardandoNuevo
                  ? "Creando..."
                  : "Crear componente"}
              </button>

            </div>

          </div>

        </div>

      )}

    </>
  );
}


/* ============================================================
   UI
============================================================ */

function FiltroButton({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition sm:text-sm ${
        activo
          ? "border-sky-700 bg-sky-700 text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
      }`}
    >
      {children}
    </button>
  );
}


function Campo({
  label,
  requerido = false,
  children,
  className = "",
}: {
  label: string;
  requerido?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>

      <label className="mb-2 block text-sm font-semibold text-slate-700">

        {label}

        {requerido && (
          <span className="ml-1 text-sky-700">
            *
          </span>
        )}

      </label>

      {children}

    </div>
  );
}