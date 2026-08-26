export function kitOrderPaymentPath(paymentToken: string) {
  return `/kit-order/pay/${paymentToken}`;
}

export function kitOrderProofImageUrl(
  proofScreenshotUrl: string,
  paymentToken: string,
) {
  const separator = proofScreenshotUrl.includes("?") ? "&" : "?";
  return `${proofScreenshotUrl}${separator}pt=${encodeURIComponent(paymentToken)}`;
}

export type KitOrderPaymentStatus = "AWAITING" | "PROOF_SUBMITTED" | "PAID";

export const KIT_ORDER_PAYMENT_STATUS_LABELS: Record<
  KitOrderPaymentStatus,
  string
> = {
  AWAITING: "Awaiting payment",
  PROOF_SUBMITTED: "Receipt uploaded",
  PAID: "Paid",
};

export function kitOrderHasUploadedProof(order: {
  proofScreenshotUrl?: string | null;
  proofSubmittedAt?: string | Date | null;
}) {
  return Boolean(order.proofScreenshotUrl && order.proofSubmittedAt);
}

export function canApproveKitOrderPayment(order: {
  paymentStatus?: string | null;
  proofScreenshotUrl?: string | null;
  proofSubmittedAt?: string | Date | null;
}) {
  return (
    (order.paymentStatus ?? "AWAITING") !== "PAID" &&
    kitOrderHasUploadedProof(order)
  );
}

export function kitOrderPaymentStatusLabel(status: string) {
  if (status in KIT_ORDER_PAYMENT_STATUS_LABELS) {
    return KIT_ORDER_PAYMENT_STATUS_LABELS[status as KitOrderPaymentStatus];
  }
  return status;
}
