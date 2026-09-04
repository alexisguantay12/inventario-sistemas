"use client";

import Link from "next/link";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  useState,
} from "react";

import {
  useAuth,
} from "@/contexts/AuthContext";


type SidebarProps = {
  onNavigate?: () => void;

  collapsed?: boolean;

  onToggle?: () => void;

  showToggle?: boolean;
};


const menuItems = [
  {
    label: "Áreas",
    shortLabel: "AR",
    href: "/estructura/areas",
  },
  {
    label: "Sectores",
    shortLabel: "SE",
    href: "/estructura/sectores",
  },
  {
    label: "Equipos de trabajo",
    shortLabel: "EQ",
    href: "/inventario/equipos",
  },
  {
    label: "Activos",
    shortLabel: "AC",
    href: "/inventario/activos",
  },
  {
    label: "Componentes",
    shortLabel: "CO",
    href: "/inventario/componentes",
  },
];


export default function Sidebar({
  onNavigate,
  collapsed = false,
  onToggle,
  showToggle = false,
}: SidebarProps) {
  const pathname =
    usePathname();

  const router =
    useRouter();

  const {
    user,
    logout,
  } = useAuth();

  const [
    cerrandoSesion,
    setCerrandoSesion,
  ] = useState(false);


  /* ============================================================
     ACTIVO
  ============================================================ */

  function isActive(
    href: string,
  ) {
    if (href === "/") {
      return pathname === href;
    }

    return pathname.startsWith(
      href,
    );
  }


  /* ============================================================
     INICIALES
  ============================================================ */

  function getInitials() {
    if (!user) {
      return "?";
    }

    const nombre =
      user.nombre_completo ||
      user.username;

    const partes =
      nombre
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (
      partes.length === 1
    ) {
      return partes[0]
        .slice(0, 2)
        .toUpperCase();
    }

    return (
      partes[0]
        .charAt(0)
        .toUpperCase() +
      partes[
        partes.length - 1
      ]
        .charAt(0)
        .toUpperCase()
    );
  }


  /* ============================================================
     LOGOUT
  ============================================================ */

  async function handleLogout() {
    if (cerrandoSesion) {
      return;
    }

    try {
      setCerrandoSesion(
        true,
      );

      await logout();

      onNavigate?.();

      router.replace(
        "/login",
      );

      router.refresh();

    } catch (error) {
      console.error(
        "Error cerrando sesión:",
        error,
      );

      router.replace(
        "/login",
      );

    } finally {
      setCerrandoSesion(
        false,
      );
    }
  }


  return (
    <div className="flex h-full flex-col bg-white">


     {/* ======================================================
          MARCA
      ====================================================== */}

      <div
        className={`border-b border-slate-200 transition-all duration-200 ${
          collapsed
            ? "px-2 py-4"
            : "px-4 py-4"
        }`}
      >
        {collapsed ? (

          <div className="flex flex-col items-center gap-3">

            {/* LOGO COMPACTO */}
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

              <img
                src="/logo-santa-clara.jpg"
                alt="Hospital Privado Santa Clara de Asís"
                className="h-full w-full object-contain p-1"
              />

            </div>

            {/* EXPANDIR */}
            {showToggle && onToggle && (

              <button
                type="button"
                onClick={onToggle}
                aria-label="Expandir menú"
                title="Expandir menú"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
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
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>

            )}

          </div>

        ) : (

          <div className="min-w-0">

            {/* IDENTIDAD INSTITUCIONAL */}
            <div className="flex items-center justify-between gap-3">

              <div className="flex min-w-0 items-center gap-3">

                {/* LOGO */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

                  <img
                    src="/logo-santa-clara.jpg"
                    alt="Hospital Privado Santa Clara de Asís"
                    className="h-full w-full object-contain p-1"
                  />

                </div>

                {/* NOMBRE HOSPITAL */}
                <div className="min-w-0">

                  <p className="text-[13px] font-semibold uppercase tracking-[0.18em]  text-sky-600">
                    Hospital
                  </p>

                  <p className="text-[13px] font-semibold uppercase tracking-[0.18em]  text-sky-600">
                    Santa Clara
                  </p>

                </div>

              </div>

              {/* CONTRAER */}
              {showToggle && onToggle && (

                <button
                  type="button"
                  onClick={onToggle}
                  aria-label="Contraer menú"
                  title="Contraer menú"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
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
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>

              )}

            </div>

            {/* NOMBRE DEL SISTEMA */}
            <div className="mt-3 border-t border-slate-100 pt-3">

              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-black-600">
                Inventario de Sistemas
              </p>

            </div>

          </div>

        )}
      </div>

      {/* ======================================================
          NAVEGACIÓN
      ====================================================== */}

      <nav
        className={`flex-1 overflow-y-auto py-4 transition-all duration-200 ${
          collapsed
            ? "px-2"
            : "px-3"
        }`}
      >

        {!collapsed && (

          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">

            Navegación

          </p>

        )}


        <div className="space-y-1">

          {menuItems.map(
            (item) => {
              const active =
                isActive(
                  item.href,
                );


              return (

                <Link
                  key={
                    item.href
                  }
                  href={
                    item.href
                  }
                  onClick={
                    onNavigate
                  }
                  title={
                    collapsed
                      ? item.label
                      : undefined
                  }
                  className={`group relative flex items-center rounded-xl text-sm font-medium transition ${
                    collapsed
                      ? "justify-center px-2 py-2.5"
                      : "gap-3 px-3 py-2.5"
                  } ${
                    active
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >

                  {/* ACTIVO LATERAL */}

                  {!collapsed &&
                    active && (

                    <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-sky-400" />

                  )}


                  {/* IDENTIFICADOR */}

                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold tracking-wide transition ${
                      active
                        ? "bg-white/10 text-white"
                        : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-slate-800"
                    }`}
                  >

                    {
                      item.shortLabel
                    }

                  </span>


                  {/* TEXTO */}

                  {!collapsed && (

                    <span className="min-w-0 truncate">

                      {
                        item.label
                      }

                    </span>

                  )}

                </Link>

              );
            },
          )}

        </div>

      </nav>


      {/* ======================================================
          USUARIO
      ====================================================== */}

      <div
        className={`border-t border-slate-200 transition-all duration-200 ${
          collapsed
            ? "px-2 py-3"
            : "px-3 py-3"
        }`}
      >

        {collapsed ? (

          <div className="flex flex-col items-center gap-2">

            {/* AVATAR */}

            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sm font-bold text-sky-700 ring-1 ring-inset ring-sky-200"
              title={
                user?.nombre_completo ||
                user?.username ||
                "Usuario"
              }
            >

              {
                getInitials()
              }

            </div>


            {/* LOGOUT */}

            <button
              type="button"
              onClick={
                handleLogout
              }
              disabled={
                cerrandoSesion
              }
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {cerrandoSesion ? (

                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />

              ) : (

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10 17l5-5-5-5" />
                  <path d="M15 12H3" />
                  <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
                </svg>

              )}

            </button>

          </div>

        ) : (

          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">

            {/* PERFIL */}

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sm font-bold text-sky-700 ring-1 ring-inset ring-sky-200">

                {
                  getInitials()
                }

              </div>


              <div className="min-w-0 flex-1">

                <p className="truncate text-sm font-semibold text-slate-900">

                  {
                    user?.nombre_completo ||
                    user?.username ||
                    "Usuario"
                  }

                </p>


                <p className="mt-0.5 truncate text-xs text-slate-500">

                  Sistemas

                </p>

              </div>

            </div>


            {/* CERRAR SESIÓN */}

            <button
              type="button"
              onClick={
                handleLogout
              }
              disabled={
                cerrandoSesion
              }
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {cerrandoSesion ? (

                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />

                  Cerrando...

                </>

              ) : (

                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M10 17l5-5-5-5" />
                    <path d="M15 12H3" />
                    <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
                  </svg>

                  Cerrar sesión
                </>

              )}

            </button>

          </div>

        )}

      </div>

    </div>
  );
}