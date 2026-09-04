"use client";

import {
  ReactNode,
  useEffect,
} from "react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  useAuth,
} from "@/contexts/AuthContext";


export default function AuthGuard({
  children,
}: {
  children: ReactNode;
}) {
  const router =
    useRouter();

  const pathname =
    usePathname();

  const {
    user,
    loading,
  } = useAuth();


  const esLogin =
    pathname === "/login";


  useEffect(() => {
    if (loading) {
      return;
    }

    /*
     * No autenticado:
     * cualquier página salvo /login
     * manda al login.
     */
    if (
      !user &&
      !esLogin
    ) {
      router.replace(
        `/login?next=${encodeURIComponent(
          pathname,
        )}`,
      );

      return;
    }

    /*
     * Ya autenticado:
     * no tiene sentido permanecer
     * en /login.
     */
    if (
      user &&
      esLogin
    ) {
      router.replace("/");
    }

  }, [
    user,
    loading,
    pathname,
    esLogin,
    router,
  ]);


  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">

        <div className="text-center">

          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-sky-600" />

          <p className="mt-4 text-sm font-medium text-slate-500">
            Cargando sistema...
          </p>

        </div>

      </div>
    );
  }


  if (
    !user &&
    !esLogin
  ) {
    return null;
  }


  if (
    user &&
    esLogin
  ) {
    return null;
  }


  return children;
}