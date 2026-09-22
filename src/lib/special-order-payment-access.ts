export function specialOrderPaymentPath(paymentToken: string) {
  return `/special-order/pay/${paymentToken}`;
}

export function specialOrderProofImageUrl(
  proofScreenshotUrl: string,
  paymentToken: string,
) {
  const separator = proofScreenshotUrl.includes("?") ? "&" : "?";
  return `${proofScreenshotUrl}${separator}pt=${encodeURIComponent(paymentToken)}`;
}

export type SpecialOrderPaymentStatus =
  | "AWAITING"
  | "PROOF_SUBMITTED"
  | "PAID";

const LABELS: Record<SpecialOrderPaymentStatus, string> = {
  AWAITING: "Awaiting payment",
  PROOF_SUBMITTED: "Receipt uploaded",
  PAID: "Paid",
};

export function specialOrderHasUploadedProof(order: {
  proofScreenshotUrl?: string | null;
  proofSubmittedAt?: string | Date | null;
}) {
  return Boolean(order.proofScreenshotUrl && order.proofSubmittedAt);
}

export function canApproveSpecialOrderPayment(order: {
  paymentStatus?: string | null;
}) {
  return (order.paymentStatus ?? "AWAITING") !== "PAID";
}

export function specialOrderPaymentStatusLabel(status: string) {
  return status in LABELS
    ? LABELS[status as SpecialOrderPaymentStatus]
    : status;
}
