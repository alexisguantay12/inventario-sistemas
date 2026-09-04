const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "/api";

  
export async function apiGet<T>(
  endpoint: string,
): Promise<T> {
  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      `Error ${response.status}: ${response.statusText}`,
    );
  }

  return response.json();
}

export async function apiPost<T>(
  endpoint: string,
  data: unknown,
): Promise<T> {
  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(JSON.stringify(error));
  }

  return response.json();
}

export async function apiPatch<T>(
  endpoint: string,
  data: unknown,
): Promise<T> {
  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      method: "PATCH",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(JSON.stringify(error));
  }

  return response.json();
}

export async function apiDelete(
  endpoint: string,
): Promise<void> {
  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      method: "DELETE",
    },
  );

  if (!response.ok && response.status !== 204) {
    const error = await response.text();

    throw new Error(error);
  }
}






export async function apiPostForm<T>(
  endpoint: string,
  data: FormData,
): Promise<T> {
  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      method: "POST",
      body: data,
    },
  );

  if (!response.ok) {
    const error = await response.json();

    throw new Error(
      JSON.stringify(error),
    );
  }

  return response.json();
}


export async function apiPatchForm<T>(
  endpoint: string,
  data: FormData,
): Promise<T> {
  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      method: "PATCH",
      body: data,
    },
  );

  if (!response.ok) {
    const error = await response.json();

    throw new Error(
      JSON.stringify(error),
    );
  }

  return response.json();
}