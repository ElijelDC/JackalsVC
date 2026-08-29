export function merchandiseOrderPaymentPath(paymentToken: string) {
  return `/merchandise-order/pay/${paymentToken}`;
}

export function merchandiseOrderProofImageUrl(
  proofScreenshotUrl: string,
  paymentToken: string,
) {
  const separator = proofScreenshotUrl.includes("?") ? "&" : "?";
  return `${proofScreenshotUrl}${separator}pt=${encodeURIComponent(paymentToken)}`;
}

export type MerchandiseOrderPaymentStatus =
  | "AWAITING"
  | "PROOF_SUBMITTED"
  | "PAID";

const LABELS: Record<MerchandiseOrderPaymentStatus, string> = {
  AWAITING: "Awaiting payment",
  PROOF_SUBMITTED: "Receipt uploaded",
  PAID: "Paid",
};

export function merchandiseOrderHasUploadedProof(order: {
  proofScreenshotUrl?: string | null;
  proofSubmittedAt?: string | Date | null;
}) {
  return Boolean(order.proofScreenshotUrl && order.proofSubmittedAt);
}

export function canApproveMerchandiseOrderPayment(order: {
  paymentStatus?: string | null;
  proofScreenshotUrl?: string | null;
  proofSubmittedAt?: string | Date | null;
}) {
  return (
    (order.paymentStatus ?? "AWAITING") !== "PAID" &&
    merchandiseOrderHasUploadedProof(order)
  );
}

export function merchandiseOrderPaymentStatusLabel(status: string) {
  return status in LABELS ? LABELS[status as MerchandiseOrderPaymentStatus] : status;
}
