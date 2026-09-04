"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  ApiError,
  apiGet,
  apiPost,
  ensureCsrf,
} from "@/lib/api";


export type UsuarioActual = {
  id: number;

  username: string;

  first_name: string;

  last_name: string;

  email: string;

  nombre_completo: string;

  is_staff: boolean;

  is_superuser: boolean;
};


type LoginData = {
  username: string;
  password: string;
};


type AuthContextType = {
  user: UsuarioActual | null;

  loading: boolean;

  authenticated: boolean;

  login: (
    username: string,
    password: string,
  ) => Promise<UsuarioActual>;

  logout: () => Promise<void>;

  refreshUser: () => Promise<void>;
};


const AuthContext =
  createContext<
    AuthContextType | undefined
  >(undefined);


export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [
    user,
    setUser,
  ] =
    useState<UsuarioActual | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);


  /* ============================================================
     USUARIO ACTUAL
  ============================================================ */

  const refreshUser =
    useCallback(
      async () => {
        try {
          const data =
            await apiGet<UsuarioActual>(
              "/auth/me/",
            );

          setUser(data);

        } catch (error) {
          if (
            error instanceof
              ApiError &&
            (
              error.status === 401 ||
              error.status === 403
            )
          ) {
            setUser(null);

            return;
          }

          console.error(
            "Error consultando sesión:",
            error,
          );

          setUser(null);
        }
      },
      [],
    );


  /* ============================================================
     INICIALIZAR
  ============================================================ */

  useEffect(() => {
    async function initialize() {
      try {
        /*
         * Generamos la cookie CSRF.
         *
         * No importa si el usuario
         * todavía no está autenticado.
         */
        await ensureCsrf();

        await refreshUser();

      } catch (error) {
        console.error(
          "Error inicializando autenticación:",
          error,
        );

        setUser(null);

      } finally {
        setLoading(false);
      }
    }

    initialize();

  }, [refreshUser]);


  /* ============================================================
     LOGIN
  ============================================================ */

  async function login(
    username: string,
    password: string,
  ): Promise<UsuarioActual> {
    await ensureCsrf();

    const payload: LoginData = {
      username,
      password,
    };

    const data =
      await apiPost<UsuarioActual>(
        "/auth/login/",
        payload,
      );

    setUser(data);

    return data;
  }


  /* ============================================================
     LOGOUT
  ============================================================ */

  async function logout() {
    try {
      await apiPost<{
        detail: string;
      }>(
        "/auth/logout/",
        {},
      );

    } finally {
      setUser(null);
    }
  }


  /* ============================================================
     PROVIDER
  ============================================================ */

  return (
    <AuthContext.Provider
      value={{
        user,

        loading,

        authenticated:
          Boolean(user),

        login,

        logout,

        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth debe utilizarse dentro de AuthProvider.",
    );
  }

  return context;
}