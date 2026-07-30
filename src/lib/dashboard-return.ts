export const DASHBOARD_RETURN_FROM = "dashboard";

export function isDashboardReturn(from: string | null | undefined): boolean {
  return from === DASHBOARD_RETURN_FROM;
}

export function withDashboardReturn(href: string): string {
  const [path, search = ""] = href.split("?");
  const params = new URLSearchParams(search);
  params.set("from", DASHBOARD_RETURN_FROM);
  const query = params.toString();
  return query ? `${path}?${query}` : `${path}?from=${DASHBOARD_RETURN_FROM}`;
}

export function resolveDetailBackLink(
  from: string | undefined,
  fallback: { path: string; label: string },
): { path: string; label: string } {
  if (isDashboardReturn(from)) {
    return { path: "/dashboard", label: "Dashboard" };
  }
  return fallback;
}

export function appendReturnFrom(
  href: string,
  from: string | null | undefined,
): string {
  if (!isDashboardReturn(from)) return href;
  return withDashboardReturn(href);
}

export function buildScheduleListHref(
  basePath: string,
  options?: {
    month?: string;
    team?: string;
    from?: typeof DASHBOARD_RETURN_FROM;
  },
): string {
  const params = new URLSearchParams();
  if (options?.month) params.set("month", options.month);
  if (options?.team) params.set("team", options.team);
  if (options?.from) params.set("from", options.from);
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}
