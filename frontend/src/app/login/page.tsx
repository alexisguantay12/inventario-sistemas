"use client";

import {
  FormEvent,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!username.trim() || !password) {
      setError(
        "Ingresá tu usuario y contraseña.",
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      await login(
        username.trim(),
        password,
      );

      router.replace("/");
      router.refresh();
    } catch (err) {
      console.error(
        "Error iniciando sesión:",
        err,
      );

      if (err instanceof ApiError) {
        if (
          err.status === 400 ||
          err.status === 401 ||
          err.status === 403
        ) {
          setError(
            "Usuario o contraseña incorrectos.",
          );
        } else {
          setError(
            "No se pudo iniciar sesión. Intentá nuevamente.",
          );
        }
      } else {
        setError(
          "No se pudo conectar con el servidor.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen">

        {/* =====================================================
            SECTOR VISUAL
        ====================================================== */}
        <section className="relative hidden overflow-hidden lg:flex lg:w-[56%] xl:w-[60%]">

          {/* Imagen de fondo */}
          <img
            src="https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1800&q=90"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />

          {/* Oscurecido */}
          <div className="absolute inset-0 bg-slate-950/65" />

          {/* Degradado */}
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/90 via-slate-900/30 to-sky-900/20" />

          {/* Decoración */}
          <div className="absolute -left-32 bottom-20 h-80 w-80 rounded-full bg-sky-400/10 blur-3xl" />
          <div className="absolute right-10 top-10 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl" />

          <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">

            {/* Marca */}
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/20 bg-white/10 backdrop-blur-md">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-6 w-6 text-white"
                >
                  <rect
                    x="3"
                    y="4"
                    width="18"
                    height="12"
                    rx="2"
                  />
                  <path d="M8 20h8" />
                  <path d="M12 16v4" />
                </svg>
              </div>

              <div>
                <p className="text-sm font-semibold tracking-wide text-white">
                  Hospital Privado
                </p>

                <p className="text-sm text-slate-300">
                  Santa Clara de Asís
                </p>
              </div>
            </div>

            {/* Texto principal */}
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-medium text-slate-200 backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                Infraestructura · Sistemas
              </div>

              <h1 className="max-w-xl text-4xl font-semibold leading-tight tracking-tight text-white xl:text-5xl">
                Inventario de
                <span className="block text-sky-300">
                  Sistemas
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 xl:text-lg">
                Gestión centralizada de equipos,
                activos, componentes e
                infraestructura informática del
                hospital.
              </p>

              {/* Indicadores */}
              <div className="mt-10 flex flex-wrap gap-3">
                <FeatureBadge
                  icon={<ComputerIcon />}
                  text="Equipamiento"
                />

                <FeatureBadge
                  icon={<CpuIcon />}
                  text="Componentes"
                />

                <FeatureBadge
                  icon={<HistoryIcon />}
                  text="Trazabilidad"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Sistema de gestión de infraestructura
              informática
            </div>
          </div>
        </section>

        {/* =====================================================
            LOGIN
        ====================================================== */}
        <section className="flex min-h-screen flex-1 items-center justify-center bg-white px-6 py-10 sm:px-10 lg:px-14">

          <div className="w-full max-w-[420px]">

            {/* Logo mobile */}
            <div className="mb-10 lg:hidden">
              <div className="mb-7 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500 shadow-sm shadow-sky-500/20">
                  <ComputerIcon className="h-5 w-5 text-white" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Hospital Privado
                  </p>

                  <p className="text-xs text-slate-500">
                    Santa Clara de Asís
                  </p>
                </div>
              </div>

              <div className="h-px bg-slate-200" />
            </div>

            {/* Encabezado */}
            <div>
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600 ring-1 ring-sky-100">
                <LockIcon />
              </div>

              <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                Iniciar sesión
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Ingresá con tu usuario para acceder
                al sistema de inventario.
              </p>
            </div>

            {/* Formulario */}
            <form
              onSubmit={handleSubmit}
              className="mt-9 space-y-5"
            >
              {/* Usuario */}
              <div>
                <label
                  htmlFor="username"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Usuario
                </label>

                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <UserIcon />
                  </div>

                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    autoFocus
                    value={username}
                    onChange={(e) =>
                      setUsername(e.target.value)
                    }
                    disabled={loading}
                    placeholder="Ingresá tu usuario"
                    className="
                      h-12 w-full rounded-xl
                      border border-slate-200
                      bg-white
                      pl-11 pr-4
                      text-sm text-slate-900
                      outline-none
                      transition
                      placeholder:text-slate-400
                      hover:border-slate-300
                      focus:border-sky-500
                      focus:ring-4
                      focus:ring-sky-500/10
                      disabled:cursor-not-allowed
                      disabled:bg-slate-50
                    "
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Contraseña
                </label>

                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <PasswordIcon />
                  </div>

                  <input
                    id="password"
                    name="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    disabled={loading}
                    placeholder="Ingresá tu contraseña"
                    className="
                      h-12 w-full rounded-xl
                      border border-slate-200
                      bg-white
                      pl-11 pr-12
                      text-sm text-slate-900
                      outline-none
                      transition
                      placeholder:text-slate-400
                      hover:border-slate-300
                      focus:border-sky-500
                      focus:ring-4
                      focus:ring-sky-500/10
                      disabled:cursor-not-allowed
                      disabled:bg-slate-50
                    "
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (value) => !value,
                      )
                    }
                    tabIndex={-1}
                    className="
                      absolute inset-y-0 right-0
                      flex w-12 items-center
                      justify-center
                      text-slate-400
                      transition
                      hover:text-slate-700
                    "
                    aria-label={
                      showPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                  >
                    {showPassword ? (
                      <EyeOffIcon />
                    ) : (
                      <EyeIcon />
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <div className="mt-0.5 shrink-0 text-red-500">
                    <AlertIcon />
                  </div>

                  <p className="text-sm leading-5 text-red-700">
                    {error}
                  </p>
                </div>
              )}

              {/* Botón */}
              <button
                type="submit"
                disabled={loading}
                className="
                  flex h-12 w-full
                  items-center justify-center
                  gap-2 rounded-xl
                  bg-sky-500
                  px-5
                  text-sm font-semibold
                  text-white
                  shadow-sm
                  shadow-sky-500/20
                  transition
                  hover:bg-sky-600
                  focus:outline-none
                  focus:ring-4
                  focus:ring-sky-500/20
                  disabled:cursor-not-allowed
                  disabled:opacity-70
                "
              >
                {loading ? (
                  <>
                    <Spinner />
                    Ingresando...
                  </>
                ) : (
                  <>
                    Ingresar al sistema
                    <ArrowIcon />
                  </>
                )}
              </button>
            </form>

            {/* Seguridad */}
            <div className="mt-8 flex items-center justify-center gap-2 border-t border-slate-100 pt-6 text-xs text-slate-400">
              <SmallLockIcon />
              Acceso exclusivo para personal
              autorizado
            </div>

            <p className="mt-3 text-center text-[11px] text-slate-400">
              Hospital Privado Santa Clara de Asís
              · Sistemas
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

/* ============================================================
   COMPONENTES
============================================================ */

function FeatureBadge({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-xs font-medium text-slate-200 backdrop-blur-sm">
      <span className="text-sky-300">
        {icon}
      </span>

      {text}
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-25"
      />

      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ============================================================
   ICONOS
============================================================ */

function ComputerIcon({
  className = "h-4 w-4",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <rect
        x="3"
        y="4"
        width="18"
        height="12"
        rx="2"
      />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}

function CpuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
    >
      <rect
        x="7"
        y="7"
        width="10"
        height="10"
        rx="1"
      />
      <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
    >
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v6h6M12 7v5l3 2" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c.8-4 3.5-6 8-6s7.2 2 8 6" />
    </svg>
  );
}

function PasswordIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <rect
        x="4"
        y="10"
        width="16"
        height="11"
        rx="2"
      />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-6 w-6"
    >
      <rect
        x="4"
        y="10"
        width="16"
        height="11"
        rx="2"
      />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function SmallLockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-3.5 w-3.5"
    >
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2"
      />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path d="m3 3 18 18" />
      <path d="M10.6 6.2A10 10 0 0 1 12 6c6.5 0 10 6 10 6a18 18 0 0 1-2.1 2.8" />
      <path d="M6.2 6.2C3.5 8 2 12 2 12s3.5 6 10 6a10 10 0 0 0 4-.8" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6M12 17h.01" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
    >
      <path d="M5 12h14M14 7l5 5-5 5" />
    </svg>
  );
}