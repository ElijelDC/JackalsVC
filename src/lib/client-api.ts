const JSON_HEADERS = { "Content-Type": "application/json" };

type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

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
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data.error ?? fallbackError };
    }
    return { ok: true, data: data as T };
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
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data.error ?? fallbackError };
    }
    return { ok: true, data: data as { success: boolean } };
  } catch {
    return { ok: false, error: fallbackError };
  }
}
