"use client";

import type {
  ReactNode,
} from "react";

import {
  useEffect,
  useState,
} from "react";

import {
  usePathname,
} from "next/navigation";

import Sidebar from "@/components/layout/Sidebar";

import {
  AuthProvider,
} from "@/contexts/AuthContext";

import AuthGuard from "@/components/auth/AuthGuard";

import ServiceWorkerRegister
 from "@/components/pwa/ServiceWorkerRegister";

import InstallPrompt from "@/components/pwa/InstallPrompt"; 

import "./globals.css";


type RootLayoutProps = {
  children: ReactNode;
};


const SIDEBAR_STORAGE_KEY =
  "inventario-sidebar-expanded";


function AppShell({
  children,
}: RootLayoutProps) {
  const pathname =
    usePathname();

  const esLogin =
    pathname === "/login";


  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false);


  const [
    desktopSidebarExpanded,
    setDesktopSidebarExpanded,
  ] = useState(false);


  const [
    sidebarReady,
    setSidebarReady,
  ] = useState(false);


  /* ============================================================
     ESTADO INICIAL DEL SIDEBAR
  ============================================================ */

  useEffect(() => {
    const guardado =
      window.localStorage.getItem(
        SIDEBAR_STORAGE_KEY,
      );


    if (
      guardado === "true"
    ) {
      setDesktopSidebarExpanded(
        true,
      );

    } else if (
      guardado === "false"
    ) {
      setDesktopSidebarExpanded(
        false,
      );

    } else {
      /*
       * Sin preferencia guardada:
       *
       * Pantalla realmente amplia:
       * sidebar expandido.
       *
       * Notebook / monitor mediano:
       * sidebar compacto.
       */

      setDesktopSidebarExpanded(
        window.innerWidth >= 1600,
      );
    }


    setSidebarReady(
      true,
    );
  }, []);


  /* ============================================================
     MOBILE
  ============================================================ */

  function openMobileMenu() {
    setMobileMenuOpen(
      true,
    );
  }


  function closeMobileMenu() {
    setMobileMenuOpen(
      false,
    );
  }


  /* ============================================================
     DESKTOP
  ============================================================ */

  function toggleDesktopSidebar() {
    setDesktopSidebarExpanded(
      (actual) => {
        const nuevoEstado =
          !actual;


        window.localStorage.setItem(
          SIDEBAR_STORAGE_KEY,
          String(
            nuevoEstado,
          ),
        );


        return nuevoEstado;
      },
    );
  }


  /* ============================================================
     LOGIN
  ============================================================ */

  if (esLogin) {
    return (
      <main className="min-h-screen bg-slate-50">
        {children}
      </main>
    );
  }


  /* ============================================================
     APP
  ============================================================ */

  return (
    <div className="min-h-screen">


      {/* ======================================================
          SIDEBAR DESKTOP
      ====================================================== */}

      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden border-r border-slate-200 bg-white transition-[width] duration-200 ease-out lg:block ${
          desktopSidebarExpanded
            ? "w-64"
            : "w-[72px]"
        } ${
          sidebarReady
            ? ""
            : "lg:w-[72px]"
        }`}
      >
        <Sidebar
          collapsed={
            !desktopSidebarExpanded
          }
          onToggle={
            toggleDesktopSidebar
          }
          showToggle
        />
      </aside>


      {/* ======================================================
          HEADER MOBILE
      ====================================================== */}

      <header className="sticky top-0 z-40 flex h-14 items-center border-b border-slate-200 bg-white px-4 lg:hidden">

        <button
          type="button"
          onClick={
            openMobileMenu
          }
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-50"
          aria-label="Abrir menú"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line
              x1="4"
              x2="20"
              y1="6"
              y2="6"
            />

            <line
              x1="4"
              x2="20"
              y1="12"
              y2="12"
            />

            <line
              x1="4"
              x2="20"
              y1="18"
              y2="18"
            />
          </svg>
        </button>


        <div className="ml-3 min-w-0">

          <p className="truncate text-sm font-semibold text-slate-900">

            Inventario Sistemas

          </p>


          <p className="truncate text-xs text-slate-400">

            Hospital Privado Santa Clara de Asís

          </p>

        </div>

      </header>


      {/* ======================================================
          CONTENIDO
      ====================================================== */}

      <main
        className={`min-w-0 transition-[padding] duration-200 ease-out ${
          desktopSidebarExpanded
            ? "lg:pl-64"
            : "lg:pl-[72px]"
        }`}
      >
        {children}
      </main>


      {/* ======================================================
          DRAWER MOBILE
      ====================================================== */}

      {mobileMenuOpen && (

        <div className="fixed inset-0 z-50 lg:hidden">

          {/* FONDO */}
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={
              closeMobileMenu
            }
            className="absolute inset-0 h-full w-full bg-black/40"
          />


          {/* PANEL */}
          <aside className="relative h-full w-[82%] max-w-[300px] border-r border-slate-200 bg-white shadow-xl">

            <div className="absolute right-3 top-3 z-10">

              <button
                type="button"
                onClick={
                  closeMobileMenu
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Cerrar menú"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>

            </div>


            <Sidebar
              onNavigate={
                closeMobileMenu
              }
              collapsed={
                false
              }
              showToggle={
                false
              }
            />

          </aside>

        </div>

      )}

    </div>
  );
}


export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    <html
      lang="es"
      style={{
        colorScheme:
          "light",
      }}
    >

      <head>

        <title>
          Inventario Sistemas
        </title>

        <meta
          name="description"
          content="Sistema de gestión de inventario e infraestructura informática del Hospital Privado Santa Clara de Asís"
        />

        <meta
          name="theme-color"
          content="#ffffff"
        />

        <link
          rel="icon"
          href="/logo-santa-clara.jpg"
        />

        <link
          rel="shortcut icon"
          href="/logo-santa-clara.jpg"
        />

        <link
          rel="apple-touch-icon"
          href="/logo-santa-clara.jpg"
        />
        <link
          rel="manifest"
          href="/manifest.webmanifest"
        />

        <meta
          name="mobile-web-app-capable"
          content="yes"
        />

        <meta
          name="apple-mobile-web-app-capable"
          content="yes"
        />

        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="default"
        />

        <meta
          name="apple-mobile-web-app-title"
          content="Inventario Sistemas"
        />

      </head>


      <body className="bg-slate-50 text-slate-900">

        <AuthProvider>
          <ServiceWorkerRegister />

          <InstallPrompt />

          <AuthGuard>

            <AppShell>

              {children}

            </AppShell>

          </AuthGuard>

        </AuthProvider>

      </body>

    </html>
  );
}