"use client";

type ClientErrorPayload = {
  message: string;
  url?: string;
  endpoint?: string;
  status?: number;
  stack?: string;
  component?: string;
};

const SKIP_REPORT_STATUSES = new Set([400, 401, 403, 404, 409, 422, 429]);

/** Fire-and-forget — never throws or blocks the UI. */
export function reportClientError(payload: ClientErrorPayload) {
  if (typeof window === "undefined") return;

  const status = payload.status;
  if (status !== undefined && SKIP_REPORT_STATUSES.has(status)) {
    return;
  }

  if (status !== undefined && status < 500) {
    return;
  }

  void fetch("/api/client-errors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: payload.message.slice(0, 500),
      url: payload.url ?? window.location.href,
      endpoint: payload.endpoint,
      status: payload.status,
      stack: payload.stack?.slice(0, 2000),
      component: payload.component,
    }),
    keepalive: true,
  }).catch(() => {});
}
