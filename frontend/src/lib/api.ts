const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "/api";


/* ============================================================
   TIPOS
============================================================ */

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(
    status: number,
    message: string,
    data: unknown = null,
  ) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}


/* ============================================================
   COOKIE
============================================================ */

function getCookie(
  name: string,
): string | null {
  if (
    typeof document === "undefined"
  ) {
    return null;
  }

  const cookies =
    document.cookie.split(";");

  for (const cookie of cookies) {
    const [key, ...valueParts] =
      cookie.trim().split("=");

    if (key === name) {
      return decodeURIComponent(
        valueParts.join("="),
      );
    }
  }

  return null;
}


/* ============================================================
   CSRF
============================================================ */

export async function ensureCsrf(): Promise<void> {
  const response = await fetch(
    `${API_URL}/auth/csrf/`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new ApiError(
      response.status,
      "No se pudo obtener el token CSRF.",
    );
  }
}


async function getCsrfToken(): Promise<string> {
  let token =
    getCookie("csrftoken");

  if (!token) {
    await ensureCsrf();

    token =
      getCookie("csrftoken");
  }

  if (!token) {
    throw new Error(
      "No se pudo obtener la cookie CSRF.",
    );
  }

  return token;
}


/* ============================================================
   RESPUESTA
============================================================ */

async function parseResponse<T>(
  response: Response,
): Promise<T> {
  if (
    response.status === 204
  ) {
    return undefined as T;
  }

  const contentType =
    response.headers.get(
      "content-type",
    ) ?? "";

  let data: unknown = null;

  if (
    contentType.includes(
      "application/json",
    )
  ) {
    data =
      await response.json();
  } else {
    data =
      await response.text();
  }

  if (!response.ok) {
    let message =
      `Error ${response.status}`;

    if (
      data &&
      typeof data === "object" &&
      "detail" in data
    ) {
      message =
        String(
          (
            data as {
              detail: unknown;
            }
          ).detail,
        );
    } else if (
      typeof data === "string" &&
      data.trim()
    ) {
      message = data;
    }

    throw new ApiError(
      response.status,
      message,
      data,
    );
  }

  return data as T;
}


/* ============================================================
   GET
============================================================ */

export async function apiGet<T>(
  endpoint: string,
): Promise<T> {
  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      method: "GET",

      credentials: "include",

      cache: "no-store",

      headers: {
        Accept:
          "application/json",
      },
    },
  );

  return parseResponse<T>(
    response,
  );
}


/* ============================================================
   POST JSON
============================================================ */

export async function apiPost<T>(
  endpoint: string,
  data: unknown,
): Promise<T> {
  const csrfToken =
    await getCsrfToken();

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      method: "POST",

      credentials: "include",

      headers: {
        Accept:
          "application/json",

        "Content-Type":
          "application/json",

        "X-CSRFToken":
          csrfToken,
      },

      body:
        JSON.stringify(data),
    },
  );

  return parseResponse<T>(
    response,
  );
}


/* ============================================================
   PATCH JSON
============================================================ */

export async function apiPatch<T>(
  endpoint: string,
  data: unknown,
): Promise<T> {
  const csrfToken =
    await getCsrfToken();

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      method: "PATCH",

      credentials: "include",

      headers: {
        Accept:
          "application/json",

        "Content-Type":
          "application/json",

        "X-CSRFToken":
          csrfToken,
      },

      body:
        JSON.stringify(data),
    },
  );

  return parseResponse<T>(
    response,
  );
}


/* ============================================================
   DELETE
============================================================ */

export async function apiDelete(
  endpoint: string,
): Promise<void> {
  const csrfToken =
    await getCsrfToken();

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      method: "DELETE",

      credentials: "include",

      headers: {
        Accept:
          "application/json",

        "X-CSRFToken":
          csrfToken,
      },
    },
  );

  await parseResponse<void>(
    response,
  );
}


/* ============================================================
   POST FORMDATA
============================================================ */

export async function apiPostForm<T>(
  endpoint: string,
  data: FormData,
): Promise<T> {
  const csrfToken =
    await getCsrfToken();

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      method: "POST",

      credentials: "include",

      headers: {
        Accept:
          "application/json",

        "X-CSRFToken":
          csrfToken,
      },

      body: data,
    },
  );

  return parseResponse<T>(
    response,
  );
}


/* ============================================================
   PATCH FORMDATA
============================================================ */

export async function apiPatchForm<T>(
  endpoint: string,
  data: FormData,
): Promise<T> {
  const csrfToken =
    await getCsrfToken();

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      method: "PATCH",

      credentials: "include",

      headers: {
        Accept:
          "application/json",

        "X-CSRFToken":
          csrfToken,
      },

      body: data,
    },
  );

  return parseResponse<T>(
    response,
  );
}