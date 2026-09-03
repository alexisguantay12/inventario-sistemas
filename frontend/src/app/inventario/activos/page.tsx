"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  apiGet,
} from "@/lib/api";

import type {
  Activo,
} from "@/types";


/* ============================================================
   TIPOS
============================================================ */

type FiltroEstado =
  | "TODOS"
  | "DISPONIBLE"
  | "EN_REPARACION";


/* ============================================================
   HELPERS
============================================================ */

function estadoLabel(
  estado: string,
) {
  const labels: Record<string, string> = {
    DISPONIBLE: "Disponible",
    EN_REPARACION: "En reparación",
  };

  return labels[estado] ?? estado;
}


function estadoClasses(
  estado: string,
) {
  switch (estado) {
    case "DISPONIBLE":
      return (
        "border-emerald-100 " +
        "bg-emerald-50 " +
        "text-emerald-700"
      );

    case "EN_REPARACION":
      return (
        "border-orange-100 " +
        "bg-orange-50 " +
        "text-orange-700"
      );

    default:
      return (
        "border-slate-200 " +
        "bg-slate-100 " +
        "text-slate-600"
      );
  }
}


function activoDescripcion(
  activo: Activo,
) {
  const valores = [
    activo.marca,
    activo.modelo,
  ].filter(Boolean);

  if (!valores.length) {
    return "Sin marca / modelo informado";
  }

  return valores.join(" ");
}


/* ============================================================
   PAGE
============================================================ */

export default function ActivosPage() {
  const [
    activos,
    setActivos,
  ] = useState<Activo[]>([]);

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
     CARGA
  ========================================================== */

  useEffect(() => {
    async function cargar() {
      try {
        setLoading(true);
        setError(null);

        const [
          disponibles,
          reparacion,
        ] = await Promise.all([
          apiGet<Activo[]>(
            "/inventario/activos/?estado=DISPONIBLE",
          ),

          apiGet<Activo[]>(
            "/inventario/activos/?estado=EN_REPARACION",
          ),
        ]);

        setActivos([
          ...disponibles,
          ...reparacion,
        ]);

      } catch (err) {
        console.error(err);

        setError(
          "No se pudieron cargar los activos.",
        );

      } finally {
        setLoading(false);
      }
    }

    cargar();
  }, []);


  /* ==========================================================
     RESÚMENES
  ========================================================== */

  const cantidadDisponibles =
    useMemo(() => {
      return activos.filter(
        (activo) =>
          activo.estado ===
          "DISPONIBLE",
      ).length;
    }, [activos]);


  const cantidadReparacion =
    useMemo(() => {
      return activos.filter(
        (activo) =>
          activo.estado ===
          "EN_REPARACION",
      ).length;
    }, [activos]);


  /* ==========================================================
     FILTRADO
  ========================================================== */

  const activosFiltrados =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      return activos.filter(
        (activo) => {
          if (
            filtroEstado !== "TODOS" &&
            activo.estado !==
              filtroEstado
          ) {
            return false;
          }

          if (!texto) {
            return true;
          }

          const contenido = [
            activo.codigo_inventario,
            activo.tipo_activo_nombre,
            activo.marca,
            activo.modelo,
            activo.hostname,
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
      activos,
      busqueda,
      filtroEstado,
    ]);


  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8">

        <div className="mx-auto max-w-[1500px] rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">

          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-sky-600" />

          <p className="mt-4 text-sm text-slate-500">
            Cargando activos...
          </p>

        </div>

      </div>
    );
  }


  /* ==========================================================
     ERROR
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
    <div className="min-h-screen bg-slate-50/70">

      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">

        {/* ====================================================
            ENCABEZADO
        ==================================================== */}

        <section className="relative overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-br from-white via-white to-sky-50 shadow-sm">

          <div className="absolute inset-y-0 left-0 w-1.5 bg-sky-600" />


          <div className="p-5 sm:p-7">

            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

              <div>

                <div className="flex items-center gap-2">

                  <span className="rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-sky-700">
                    Inventario
                  </span>

                  <span className="text-sm text-slate-400">
                    Gestión operativa
                  </span>

                </div>


                <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Activos
                </h1>


                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">

                  Activos actualmente sin asignación
                  o que se encuentran en reparación.

                </p>

              </div>


              <Link
                href="/inventario/activos/nuevo"
                className="inline-flex w-full items-center justify-center rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-800 lg:w-auto"
              >
                + Nuevo activo
              </Link>

            </div>


            {/* ==================================================
                RESUMEN
            ================================================== */}

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
                    Taller
                  </span>

                </div>

              </button>

            </div>

          </div>

        </section>


        {/* ====================================================
            FILTROS
        ==================================================== */}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div className="relative flex-1">

              <input
                type="search"
                value={busqueda}
                onChange={(event) =>
                  setBusqueda(
                    event.target.value,
                  )
                }
                placeholder="Buscar por código, tipo, marca, modelo o hostname..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 sm:text-sm"
              />

            </div>


            <div className="grid grid-cols-3 gap-2 lg:flex">

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
                {activosFiltrados.length} resultado(s)
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


        {/* ====================================================
            LISTADO
        ==================================================== */}

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 bg-gradient-to-r from-white to-sky-50/50 p-5">

            <div className="flex items-center gap-2">

              <h2 className="text-lg font-bold text-slate-900">
                Activos sin asignación
              </h2>

              <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700">
                {activosFiltrados.length}
              </span>

            </div>


            <p className="mt-1 text-sm text-slate-500">

              Equipos disponibles para asignar
              o actualmente fuera de servicio
              por reparación.

            </p>

          </div>


          {activosFiltrados.length ===
          0 ? (

            <div className="px-5 py-14 text-center">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-xl text-sky-700">
                ◫
              </div>


              <h3 className="mt-4 text-sm font-semibold text-slate-800">
                No hay activos para mostrar
              </h3>


              <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">

                No encontramos activos que coincidan
                con los filtros seleccionados.

              </p>

            </div>

          ) : (

            <>
              {/* ==============================================
                  MOBILE
              ============================================== */}

              <div className="divide-y divide-slate-100 md:hidden">

                {activosFiltrados.map(
                  (activo) => (

                    <article
                      key={activo.id}
                      className="p-4"
                    >

                      <div className="flex items-start justify-between gap-3">

                        <div className="min-w-0">

                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-sky-600">
                            {activo.tipo_activo_nombre}
                          </p>


                          <h3 className="mt-1 font-mono text-lg font-bold text-slate-900">
                            {activo.codigo_inventario}
                          </h3>

                        </div>


                        <span
                          className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${estadoClasses(
                            activo.estado,
                          )}`}
                        >
                          {estadoLabel(
                            activo.estado,
                          )}
                        </span>

                      </div>


                      <div className="mt-4">

                        <p className="text-sm font-semibold text-slate-700">
                          {activoDescripcion(
                            activo,
                          )}
                        </p>


                        {activo.hostname && (

                          <p className="mt-1 font-mono text-xs text-slate-400">
                            {activo.hostname}
                          </p>

                        )}

                      </div>


                      <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3">

                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          Ubicación actual
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">

                          {activo.estado ===
                          "EN_REPARACION"
                            ? "En reparación"
                            : "Stock / Sin asignación"}

                        </p>

                      </div>


                      <div className="mt-4 grid grid-cols-1 gap-2">

                        <Link
                          href={`/inventario/activos/${activo.id}`}
                          className="rounded-xl bg-sky-700 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-sky-800"
                        >
                          Ver activo
                        </Link>

                      </div>

                    </article>

                  ),
                )}

              </div>


              {/* ==============================================
                  DESKTOP
              ============================================== */}

              <div className="hidden overflow-x-auto md:block">

                <table className="min-w-full text-sm">

                  <thead className="bg-slate-50/70">

                    <tr className="text-slate-500">

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                        Código
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                        Tipo
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                        Marca / Modelo
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                        Hostname
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

                    {activosFiltrados.map(
                      (activo) => (

                        <tr
                          key={activo.id}
                          className="border-t border-slate-100 transition hover:bg-sky-50/30"
                        >

                          <td className="px-5 py-4">

                            <Link
                              href={`/inventario/activos/${activo.id}`}
                              className="font-mono font-bold text-sky-700 transition hover:text-sky-800"
                            >
                              {activo.codigo_inventario}
                            </Link>

                          </td>


                          <td className="px-5 py-4 font-medium text-slate-700">
                            {activo.tipo_activo_nombre}
                          </td>


                          <td className="px-5 py-4 text-slate-600">
                            {activoDescripcion(
                              activo,
                            )}
                          </td>


                          <td className="px-5 py-4 font-mono text-xs text-slate-500">
                            {activo.hostname ||
                              "—"}
                          </td>


                          <td className="px-5 py-4">

                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${estadoClasses(
                                activo.estado,
                              )}`}
                            >
                              {estadoLabel(
                                activo.estado,
                              )}
                            </span>

                          </td>


                          <td className="px-5 py-4 text-right">

                            <Link
                              href={`/inventario/activos/${activo.id}`}
                              className="inline-flex rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-100"
                            >
                              Ver activo
                            </Link>

                          </td>

                        </tr>

                      ),
                    )}

                  </tbody>

                </table>

              </div>

            </>
          )}

        </section>

      </div>

    </div>
  );
}


/* ============================================================
   COMPONENTES UI
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