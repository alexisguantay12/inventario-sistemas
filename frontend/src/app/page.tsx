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

import {
  useAuth,
} from "@/contexts/AuthContext";


/* ============================================================
   TIPOS
============================================================ */

type Activo = {
  id: number;
  codigo_inventario: string;
  estado: string;
};


type EquipoTrabajo = {
  id: number;
  nombre: string;
  estado: string;
};


type Componente = {
  id: number;
  estado: string;
};


type MovimientoActivo = {
  id: number;
  activo_codigo?: string | null;
  tipo_movimiento_nombre?: string | null;
  usuario_nombre?: string | null;
  created_at: string;
};


type MovimientoComponente = {
  id: number;
  componente_nombre?: string | null;
  tipo_movimiento_nombre?: string | null;
  usuario_nombre?: string | null;
  created_at: string;
};


type MovimientoDashboard = {
  id: string;
  tipo: "ACTIVO" | "COMPONENTE";
  titulo: string;
  movimiento: string;
  usuario: string | null;
  fecha: string;
};


/* ============================================================
   HELPERS
============================================================ */

function formatFecha(
  value: string,
) {
  try {
    return new Intl.DateTimeFormat(
      "es-AR",
      {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      },
    ).format(
      new Date(value),
    );
  } catch {
    return "";
  }
}


/* ============================================================
   PAGE
============================================================ */

export default function Home() {
  const {
    user,
  } = useAuth();


  const [
    activos,
    setActivos,
  ] =
    useState<Activo[]>([]);


  const [
    equipos,
    setEquipos,
  ] =
    useState<EquipoTrabajo[]>([]);


  const [
    componentesDisponibles,
    setComponentesDisponibles,
  ] =
    useState<Componente[]>([]);


  const [
    activosReparacion,
    setActivosReparacion,
  ] =
    useState<Activo[]>([]);


  const [
    componentesReparacion,
    setComponentesReparacion,
  ] =
    useState<Componente[]>([]);


  const [
    movimientosActivo,
    setMovimientosActivo,
  ] =
    useState<MovimientoActivo[]>([]);


  const [
    movimientosComponente,
    setMovimientosComponente,
  ] =
    useState<MovimientoComponente[]>([]);


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );


  /* ==========================================================
     CARGAR DASHBOARD
  ========================================================== */

  useEffect(() => {
    async function cargarDashboard() {
      try {
        setLoading(
          true,
        );

        setError(
          null,
        );


        const [
          activosData,
          equiposData,
          componentesDisponiblesData,
          activosReparacionData,
          componentesReparacionData,
          movimientosActivoData,
          movimientosComponenteData,
        ] =
          await Promise.all([
            apiGet<Activo[]>(
              "/inventario/activos/",
            ),

            apiGet<EquipoTrabajo[]>(
              "/inventario/equipos-trabajo/?estado=ACTIVO",
            ),

            apiGet<Componente[]>(
              "/inventario/componentes/?estado=DISPONIBLE",
            ),

            apiGet<Activo[]>(
              "/inventario/activos/?estado=EN_REPARACION",
            ),

            apiGet<Componente[]>(
              "/inventario/componentes/?estado=EN_REPARACION",
            ),

            apiGet<MovimientoActivo[]>(
              "/operaciones/movimientos-activos/",
            ),

            apiGet<MovimientoComponente[]>(
              "/operaciones/movimientos-componentes/",
            ),
          ]);


        setActivos(
          activosData,
        );

        setEquipos(
          equiposData,
        );

        setComponentesDisponibles(
          componentesDisponiblesData,
        );

        setActivosReparacion(
          activosReparacionData,
        );

        setComponentesReparacion(
          componentesReparacionData,
        );

        setMovimientosActivo(
          movimientosActivoData,
        );

        setMovimientosComponente(
          movimientosComponenteData,
        );

      } catch (err) {
        console.error(
          "Error cargando dashboard:",
          err,
        );

        setError(
          "No se pudo cargar la información del inventario.",
        );

      } finally {
        setLoading(
          false,
        );
      }
    }


    cargarDashboard();

  }, []);


  /* ==========================================================
     MOVIMIENTOS COMBINADOS
  ========================================================== */

  const movimientos =
    useMemo<
      MovimientoDashboard[]
    >(() => {

      const activosMap =
        movimientosActivo.map(
          (movimiento) => ({
            id:
              `activo-${movimiento.id}`,

            tipo:
              "ACTIVO" as const,

            titulo:
              movimiento
                .activo_codigo ||
              "Activo",

            movimiento:
              movimiento
                .tipo_movimiento_nombre ||
              "Movimiento",

            usuario:
              movimiento
                .usuario_nombre ||
              null,

            fecha:
              movimiento.created_at,
          }),
        );


      const componentesMap =
        movimientosComponente.map(
          (movimiento) => ({
            id:
              `componente-${movimiento.id}`,

            tipo:
              "COMPONENTE" as const,

            titulo:
              movimiento
                .componente_nombre ||
              "Componente",

            movimiento:
              movimiento
                .tipo_movimiento_nombre ||
              "Movimiento",

            usuario:
              movimiento
                .usuario_nombre ||
              null,

            fecha:
              movimiento.created_at,
          }),
        );


      return [
        ...activosMap,
        ...componentesMap,
      ]
        .sort(
          (a, b) =>
            new Date(
              b.fecha,
            ).getTime() -
            new Date(
              a.fecha,
            ).getTime(),
        )
        .slice(
          0,
          6,
        );

    }, [
      movimientosActivo,
      movimientosComponente,
    ]);


  const totalReparacion =
    activosReparacion.length +
    componentesReparacion.length;


  const nombreUsuario =
    user?.first_name ||
    user?.nombre_completo ||
    user?.username ||
    "Sistemas";


  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <main className="min-h-screen bg-slate-100/70">

      <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">


        {/* ====================================================
            HERO
        ==================================================== */}

        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          <div className="absolute inset-y-0 left-0 w-1.5 bg-sky-500" />


          <div className="relative p-5 sm:p-7 lg:p-8">

            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

              <div>

                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.17em] text-sky-700">

                  <span className="h-2 w-2 rounded-full bg-sky-500" />

                  Sistemas

                </div>


                <p className="text-sm font-medium text-slate-500">

                  Hola, {nombreUsuario}

                </p>


                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">

                  Inventario de infraestructura

                </h1>


                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">

                  Vista general del equipamiento,
                  activos y componentes informáticos
                  del Hospital Privado Santa Clara de Asís.

                </p>

              </div>


              <div className="flex flex-col gap-2 sm:flex-row">

                <Link
                  href="/inventario/equipos"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >

                  Ver equipos

                </Link>


                <Link
                  href="/inventario/activos/nuevo"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
                >

                  <span className="text-lg leading-none">
                    +
                  </span>

                  Nuevo activo

                </Link>

              </div>

            </div>

          </div>

        </section>


        {/* ====================================================
            ERROR
        ==================================================== */}

        {error && (

          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

            {error}

          </div>

        )}


        {/* ====================================================
            RESUMEN
        ==================================================== */}

        <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            label="Activos"
            value={
              activos.length
            }
            loading={
              loading
            }
            description="Registrados en inventario"
            href="/inventario/activos"
            icon={
              <MonitorIcon />
            }
          />


          <StatCard
            label="Equipos de trabajo"
            value={
              equipos.length
            }
            loading={
              loading
            }
            description="Puestos actualmente activos"
            href="/inventario/equipos"
            icon={
              <WorkstationIcon />
            }
          />


          <StatCard
            label="Componentes en stock"
            value={
              componentesDisponibles.length
            }
            loading={
              loading
            }
            description="Disponibles para instalar"
            href="/inventario/componentes"
            icon={
              <ChipIcon />
            }
            accent
          />


          <StatCard
            label="En reparación"
            value={
              totalReparacion
            }
            loading={
              loading
            }
            description={`${activosReparacion.length} activos · ${componentesReparacion.length} componentes`}
            href="/inventario/activos"
            icon={
              <ToolIcon />
            }
            warning={
              totalReparacion > 0
            }
          />

        </section>


        {/* ====================================================
            CONTENIDO SECUNDARIO
        ==================================================== */}

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">


          {/* ==================================================
              ÚLTIMOS MOVIMIENTOS
          ================================================== */}

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">

              <div>

                <h2 className="font-semibold text-slate-900">

                  Últimos movimientos

                </h2>

                <p className="mt-1 text-xs text-slate-500">

                  Actividad reciente registrada en el inventario.

                </p>

              </div>


              <div className="hidden h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 sm:flex">

                <HistoryIcon />

              </div>

            </div>


            {loading ? (

              <div className="space-y-3 p-5">

                {Array.from({
                  length: 4,
                }).map(
                  (_, index) => (

                  <div
                    key={index}
                    className="h-16 animate-pulse rounded-xl bg-slate-100"
                  />

                ))}

              </div>

            ) : movimientos.length === 0 ? (

              <div className="px-6 py-12 text-center">

                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">

                  <HistoryIcon />

                </div>


                <p className="mt-3 text-sm font-medium text-slate-700">

                  Todavía no hay movimientos

                </p>


                <p className="mt-1 text-xs text-slate-400">

                  Las operaciones sobre activos y componentes aparecerán acá.

                </p>

              </div>

            ) : (

              <div className="divide-y divide-slate-100">

                {movimientos.map(
                  (movimiento) => (

                  <div
                    key={
                      movimiento.id
                    }
                    className="flex items-start gap-3 px-5 py-4 transition hover:bg-slate-50/70 sm:px-6"
                  >

                    <div
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        movimiento.tipo ===
                        "ACTIVO"
                          ? "bg-sky-50 text-sky-600"
                          : "bg-violet-50 text-violet-600"
                      }`}
                    >

                      {movimiento.tipo ===
                      "ACTIVO" ? (
                        <MonitorIcon />
                      ) : (
                        <ChipIcon />
                      )}

                    </div>


                    <div className="min-w-0 flex-1">

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">

                        <p className="truncate text-sm font-semibold text-slate-900">

                          {
                            movimiento.titulo
                          }

                        </p>


                        <span className="text-xs text-slate-400">

                          {
                            movimiento.movimiento
                          }

                        </span>

                      </div>


                      <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-slate-400">

                        <span>
                          {
                            formatFecha(
                              movimiento.fecha,
                            )
                          }
                        </span>


                        {movimiento.usuario && (
                          <>
                            <span>
                              ·
                            </span>

                            <span>
                              {
                                movimiento.usuario
                              }
                            </span>
                          </>
                        )}

                      </div>

                    </div>

                  </div>

                ))}

              </div>

            )}

          </div>


          {/* ==================================================
              ACCESOS RÁPIDOS
          ================================================== */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

            <div className="mb-5">

              <h2 className="font-semibold text-slate-900">

                Accesos rápidos

              </h2>


              <p className="mt-1 text-xs text-slate-500">

                Operaciones frecuentes del inventario.

              </p>

            </div>


            <div className="space-y-2">

              <QuickLink
                href="/inventario/equipos"
                title="Equipos de trabajo"
                description="Gestionar puestos y equipamiento"
                icon={
                  <WorkstationIcon />
                }
              />


              <QuickLink
                href="/inventario/activos"
                title="Activos"
                description="Consultar y administrar activos"
                icon={
                  <MonitorIcon />
                }
              />


              <QuickLink
                href="/inventario/componentes"
                title="Componentes"
                description="Stock, instalación y reparación"
                icon={
                  <ChipIcon />
                }
              />


              <QuickLink
                href="/estructura/areas"
                title="Áreas y sectores"
                description="Administrar estructura hospitalaria"
                icon={
                  <BuildingIcon />
                }
              />

            </div>


            {/* ALERTA REPARACIÓN */}

            {!loading &&
              totalReparacion > 0 && (

              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">

                <div className="flex items-start gap-3">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600">

                    <ToolIcon />

                  </div>


                  <div>

                    <p className="text-sm font-semibold text-amber-900">

                      Equipamiento en reparación

                    </p>


                    <p className="mt-1 text-xs leading-5 text-amber-700">

                      Actualmente hay{" "}
                      <strong>
                        {totalReparacion}
                      </strong>{" "}
                      elementos en proceso de reparación.

                    </p>

                  </div>

                </div>

              </div>

            )}

          </div>

        </section>

      </div>

    </main>
  );
}


/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  label,
  value,
  description,
  href,
  icon,
  loading,
  accent = false,
  warning = false,
}: {
  label: string;
  value: number;
  description: string;
  href: string;
  icon: React.ReactNode;
  loading: boolean;
  accent?: boolean;
  warning?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >

      <div
        className={`absolute inset-x-0 top-0 h-1 ${
          warning
            ? "bg-amber-400"
            : accent
              ? "bg-emerald-400"
              : "bg-sky-500"
        }`}
      />


      <div className="flex items-start justify-between gap-4">

        <div>

          <p className="text-sm font-medium text-slate-500">

            {label}

          </p>


          {loading ? (

            <div className="mt-3 h-9 w-16 animate-pulse rounded-lg bg-slate-100" />

          ) : (

            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">

              {value}

            </p>

          )}

        </div>


        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
            warning
              ? "bg-amber-50 text-amber-600"
              : accent
                ? "bg-emerald-50 text-emerald-600"
                : "bg-sky-50 text-sky-600"
          }`}
        >

          {icon}

        </div>

      </div>


      <p className="mt-3 text-xs text-slate-400">

        {description}

      </p>

    </Link>
  );
}


/* ============================================================
   QUICK LINK
============================================================ */

function QuickLink({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-transparent p-3 transition hover:border-slate-200 hover:bg-slate-50"
    >

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition group-hover:bg-sky-50 group-hover:text-sky-600">

        {icon}

      </div>


      <div className="min-w-0 flex-1">

        <p className="text-sm font-semibold text-slate-800">

          {title}

        </p>


        <p className="mt-0.5 truncate text-xs text-slate-400">

          {description}

        </p>

      </div>


      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>

    </Link>
  );
}


/* ============================================================
   ICONOS
============================================================ */

function MonitorIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect
        width="18"
        height="12"
        x="3"
        y="4"
        rx="2"
      />
      <path d="M8 20h8" />
      <path d="M12 16v4" />
    </svg>
  );
}


function WorkstationIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect
        x="2"
        y="3"
        width="14"
        height="10"
        rx="2"
      />
      <path d="M6 17h6" />
      <path d="M9 13v4" />
      <rect
        x="18"
        y="6"
        width="4"
        height="11"
        rx="1"
      />
    </svg>
  );
}


function ChipIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect
        x="7"
        y="7"
        width="10"
        height="10"
        rx="1"
      />
      <path d="M9 2v3" />
      <path d="M15 2v3" />
      <path d="M9 19v3" />
      <path d="M15 19v3" />
      <path d="M2 9h3" />
      <path d="M2 15h3" />
      <path d="M19 9h3" />
      <path d="M19 15h3" />
    </svg>
  );
}


function ToolIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.7 6.3a4 4 0 0 0-5-5L7.5 3.5l3 3L12.7 4.3" />
      <path d="m10.5 6.5-8 8a2.1 2.1 0 0 0 3 3l8-8" />
      <path d="m16 12 5 5" />
    </svg>
  );
}


function HistoryIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v6h6" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}


function BuildingIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 21h18" />
      <path d="M6 21V5h12v16" />
      <path d="M9 9h2" />
      <path d="M13 9h2" />
      <path d="M9 13h2" />
      <path d="M13 13h2" />
      <path d="M10 21v-4h4v4" />
    </svg>
  );
}