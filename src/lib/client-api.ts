const JSON_HEADERS = { "Content-Type": "application/json" };

type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function parseResponse<T>(
  res: Response,
  fallbackError: string,
): Promise<ApiResult<T>> {
  const text = await res.text();
  if (!text.trim()) {
    return {
      ok: false,
      error: res.ok
        ? fallbackError
        : `${fallbackError} (HTTP ${res.status})`,
    };
  }

  try {
    const data = JSON.parse(text) as T & { error?: string };
    if (!res.ok) {
      return {
        ok: false,
        error:
          typeof data === "object" &&
          data &&
          "error" in data &&
          typeof data.error === "string"
            ? data.error
            : fallbackError,
      };
    }
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, error: fallbackError };
  }
}

export async function apiGet<T>(
  url: string,
  fallbackError = "Failed to load data",
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url);
    return parseResponse<T>(res, fallbackError);
  } catch {
    return { ok: false, error: fallbackError };
  }
}

export async function apiPost<T>(
  url: string,
  body: unknown,
  fallbackError = "Something went wrong. Please try again.",
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(body),
    });
    return parseResponse<T>(res, fallbackError);
  } catch {
    return { ok: false, error: fallbackError };
  }
}

export async function apiPut<T>(
  url: string,
  body: unknown,
  fallbackError = "Something went wrong. Please try again.",
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: JSON_HEADERS,
      body: JSON.stringify(body),
    });
    return parseResponse<T>(res, fallbackError);
  } catch {
    return { ok: false, error: fallbackError };
  }
}

export async function apiDelete(
  url: string,
  fallbackError = "Something went wrong. Please try again.",
): Promise<ApiResult<{ success: boolean }>> {
  try {
    const res = await fetch(url, { method: "DELETE" });
    return parseResponse<{ success: boolean }>(res, fallbackError);
  } catch {
    return { ok: false, error: fallbackError };
  }
}
