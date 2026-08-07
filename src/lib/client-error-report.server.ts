import "server-only";

export type ClientErrorReport = {
  message: string;
  url?: string;
  endpoint?: string;
  status?: number;
  stack?: string;
  component?: string;
};

/**
 * Formerly emailed admins about member-facing / API errors.
 * Disabled — server logs remain via console.error at call sites.
 */
export async function reportClientErrorToAdmins(
  _report: ClientErrorReport,
): Promise<{ notified: boolean }> {
  return { notified: false };
}
