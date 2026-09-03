"use client";

import Link from "next/link";

import { usePathname } from "next/navigation";


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
  const pathname = usePathname();


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


  return (
    <div className="flex h-full flex-col bg-white">


      {/* ====================================================
          MARCA
      ==================================================== */}

      <div
        className={`relative border-b border-slate-200 transition-all duration-200 ${
          collapsed
            ? "px-3 py-5"
            : "px-5 py-5"
        }`}
      >

        {collapsed ? (

          <div className="flex flex-col items-center">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold tracking-wide text-white">
              IS
            </div>

          </div>

        ) : (

          <div className="pr-8">

            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Hospital Privado
            </p>

            <h1 className="mt-1 whitespace-nowrap text-base font-semibold text-slate-900">
              Inventario Sistemas
            </h1>

          </div>

        )}


        {/* BOTÓN EXPANDIR / CONTRAER */}

        {showToggle &&
          onToggle && (

            <button
              type="button"
              onClick={onToggle}
              aria-label={
                collapsed
                  ? "Expandir menú"
                  : "Contraer menú"
              }
              title={
                collapsed
                  ? "Expandir menú"
                  : "Contraer menú"
              }
              className={`absolute top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 ${
                collapsed
                  ? "-right-4"
                  : "right-3"
              }`}
            >

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
                className={`transition-transform duration-200 ${
                  collapsed
                    ? ""
                    : "rotate-180"
                }`}
              >
                <path d="m9 18 6-6-6-6" />
              </svg>

            </button>

          )}

      </div>


      {/* ====================================================
          NAVEGACIÓN
      ==================================================== */}

      <nav
        className={`flex-1 overflow-y-auto py-4 transition-all duration-200 ${
          collapsed
            ? "px-2"
            : "px-3"
        }`}
      >

        <div className="space-y-1">

          {menuItems.map(
            (item) => {

              const active =
                isActive(
                  item.href,
                );


              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={
                    onNavigate
                  }
                  title={
                    collapsed
                      ? item.label
                      : undefined
                  }
                  className={`group flex items-center rounded-lg text-sm font-medium transition ${
                    collapsed
                      ? "justify-center px-2 py-2.5"
                      : "gap-3 px-3 py-2.5"
                  } ${
                    active
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >

                  {/* IDENTIFICADOR COMPACTO */}

                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold tracking-wide transition ${
                      active
                        ? "bg-white/10 text-white"
                        : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-slate-800"
                    }`}
                  >
                    {item.shortLabel}
                  </span>


                  {/* TEXTO */}

                  {!collapsed && (

                    <span className="min-w-0 truncate">
                      {item.label}
                    </span>

                  )}

                </Link>
              );
            },
          )}

        </div>

      </nav>


      {/* ====================================================
          FOOTER
      ==================================================== */}

      <div
        className={`border-t border-slate-200 transition-all duration-200 ${
          collapsed
            ? "px-2 py-4"
            : "px-5 py-4"
        }`}
      >

        {collapsed ? (

          <div
            className="mx-auto h-2 w-2 rounded-full bg-sky-500"
            title="Gestión de infraestructura"
          />

        ) : (

          <p className="whitespace-nowrap text-xs text-slate-400">
            Gestión de infraestructura
          </p>

        )}

      </div>

    </div>
  );
}