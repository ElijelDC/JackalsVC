import { describeHttpError, NETWORK_ERROR_MESSAGE } from "@/lib/http-errors";
import { reportClientError } from "@/lib/client-error-report";

const JSON_HEADERS = { "Content-Type": "application/json" };

type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function parseResponse<T>(
  res: Response,
  fallbackError: string,
  requestUrl: string,
): Promise<ApiResult<T>> {
  const text = await res.text();
  if (!text.trim()) {
    const error = res.ok
      ? fallbackError
      : describeHttpError(res.status, fallbackError);
    if (!res.ok) {
      reportClientError({ message: error, endpoint: requestUrl, status: res.status });
    }
    return { ok: false, error };
  }

  try {
    const data = JSON.parse(text) as T & { error?: string };
    if (!res.ok) {
      const error =
        typeof data === "object" &&
        data &&
        "error" in data &&
        typeof data.error === "string"
          ? data.error
          : describeHttpError(res.status, fallbackError);
      reportClientError({ message: error, endpoint: requestUrl, status: res.status });
      return { ok: false, error };
    }
    return { ok: true, data: data as T };
  } catch {
    const error = res.ok ? fallbackError : describeHttpError(res.status, fallbackError);
    if (!res.ok) {
      reportClientError({ message: error, endpoint: requestUrl, status: res.status });
    }
    return { ok: false, error };
  }
}

export async function apiGet<T>(
  url: string,
  fallbackError = "Failed to load data",
  init?: RequestInit,
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, { cache: "no-store", ...init });
    return parseResponse<T>(res, fallbackError, url);
  } catch {
    reportClientError({ message: NETWORK_ERROR_MESSAGE, endpoint: url });
    return { ok: false, error: NETWORK_ERROR_MESSAGE };
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
    return parseResponse<T>(res, fallbackError, url);
  } catch {
    reportClientError({ message: NETWORK_ERROR_MESSAGE, endpoint: url });
    return { ok: false, error: NETWORK_ERROR_MESSAGE };
  }
}

export async function apiPostForm<T>(
  url: string,
  body: FormData,
  fallbackError = "Something went wrong. Please try again.",
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: "POST",
      body,
    });
    return parseResponse<T>(res, fallbackError, url);
  } catch {
    reportClientError({ message: NETWORK_ERROR_MESSAGE, endpoint: url });
    return { ok: false, error: NETWORK_ERROR_MESSAGE };
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
    return parseResponse<T>(res, fallbackError, url);
  } catch {
    reportClientError({ message: NETWORK_ERROR_MESSAGE, endpoint: url });
    return { ok: false, error: NETWORK_ERROR_MESSAGE };
  }
}

export async function apiPatch<T>(
  url: string,
  body: unknown,
  fallbackError = "Something went wrong. Please try again.",
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: JSON_HEADERS,
      body: JSON.stringify(body),
    });
    return parseResponse<T>(res, fallbackError, url);
  } catch {
    reportClientError({ message: NETWORK_ERROR_MESSAGE, endpoint: url });
    return { ok: false, error: NETWORK_ERROR_MESSAGE };
  }
}

export async function apiDelete<T = { success: boolean }>(
  url: string,
  fallbackError = "Something went wrong. Please try again.",
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, { method: "DELETE" });
    return parseResponse<T>(res, fallbackError, url);
  } catch {
    reportClientError({ message: NETWORK_ERROR_MESSAGE, endpoint: url });
    return { ok: false, error: NETWORK_ERROR_MESSAGE };
  }
}

type PaymentProofResponse = {
  payment: {
    id: string;
    status: string;
    proofScreenshotUrl: string | null;
    proofSubmittedAt: string | null;
  };
  message: string;
};

export type CsvImportResult = {
  matched: number;
  scanned: number;
  skippedDuplicates: number;
  unmatchedRows: number;
  unmatchedPayments: number;
  fileName?: string;
};

export type BulkImportType =
  | "roster"
  | "weekly-training"
  | "fun-sessions"
  | "matches"
  | "events";

export type BulkImportResult = {
  fileName: string | null;
  scanned: number;
  created: number;
  skipped: number;
  failed: number;
  errors: { row: number; message: string }[];
};

export function getBulkImportTemplateUrl(type: BulkImportType): string {
  return `/api/admin/bulk-import/${type}`;
}

export async function apiBulkImportCsv(
  type: BulkImportType,
  file: File,
  fallbackError = "Failed to import CSV",
): Promise<ApiResult<BulkImportResult>> {
  const formData = new FormData();
  formData.append("file", file);
  return apiPostForm<BulkImportResult>(
    `/api/admin/bulk-import/${type}`,
    formData,
    fallbackError,
  );
}

export async function apiUploadPaymentProof(
  paymentId: string,
  file: File,
  fallbackError = "Failed to upload screenshot",
): Promise<ApiResult<PaymentProofResponse>> {
  const formData = new FormData();
  formData.append("paymentId", paymentId);
  formData.append("screenshot", file);
  return apiPostForm<PaymentProofResponse>(
    "/api/payments/proof",
    formData,
    fallbackError,
  );
}

export async function apiRemovePaymentProof(
  paymentId: string,
  fallbackError = "Failed to remove screenshot",
): Promise<ApiResult<PaymentProofResponse>> {
  return apiDelete<PaymentProofResponse>(
    `/api/payments/proof?paymentId=${encodeURIComponent(paymentId)}`,
    fallbackError,
  );
}

export async function apiRemoveTrialSessionPaymentProof(
  slug: string,
  proofId: string,
  fallbackError = "Failed to remove payment receipt",
): Promise<ApiResult<{ message: string }>> {
  return apiDelete<{ message: string }>(
    `/api/trial-sessions/${slug}/payment-proof?proofId=${encodeURIComponent(proofId)}`,
    fallbackError,
  );
}

export async function apiImportPaymentCsv(
  file: File,
  fallbackError = "Failed to import CSV",
): Promise<ApiResult<CsvImportResult>> {
  const formData = new FormData();
  formData.append("file", file);
  return apiPostForm<CsvImportResult>(
    "/api/admin/payments/import-csv",
    formData,
    fallbackError,
  );
}

export async function apiApprovePayment(
  paymentId: string,
  fallbackError = "Failed to approve payment",
): Promise<ApiResult<{ payment: { id: string; status: string } }>> {
  return apiPost(`/api/admin/payments/${paymentId}/approve`, {}, fallbackError);
}
