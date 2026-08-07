"use client";

type ClientErrorPayload = {
  message: string;
  url?: string;
  endpoint?: string;
  status?: number;
  stack?: string;
  component?: string;
};

/**
 * Formerly posted browser errors to /api/client-errors for admin email.
 * Disabled — keep the hook so call sites stay stable without notifying anyone.
 */
export function reportClientError(_payload: ClientErrorPayload) {
  // no-op
}
