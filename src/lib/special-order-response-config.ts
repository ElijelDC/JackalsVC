import {
  SPECIAL_ORDER_DUE_DATE,
  SPECIAL_ORDER_TOTAL_EUR,
  specialOrderFullName,
  specialOrderItemSummary,
  specialOrderQuote,
} from "@/lib/special-order-config";

export type SpecialOrderRecord = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  tshirtSize: string;
  quarterZipSize: string;
  paymentToken: string;
  paymentStatus: string;
  proofScreenshotUrl: string | null;
  proofSubmittedAt: string | null;
  paymentEmailSentAt: string | null;
  dueDate: string;
  createdAt: string;
};

export function serializeSpecialOrder(order: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  tshirtSize: string;
  quarterZipSize: string;
  paymentToken: string;
  paymentStatus: string;
  proofScreenshotUrl: string | null;
  proofSubmittedAt: Date | null;
  paymentEmailSentAt: Date | null;
  dueDate: Date;
  createdAt: Date;
}): SpecialOrderRecord {
  return {
    id: order.id,
    firstName: order.firstName,
    lastName: order.lastName,
    email: order.email,
    phoneNumber: order.phoneNumber,
    tshirtSize: order.tshirtSize,
    quarterZipSize: order.quarterZipSize,
    paymentToken: order.paymentToken,
    paymentStatus: order.paymentStatus,
    proofScreenshotUrl: order.proofScreenshotUrl,
    proofSubmittedAt: order.proofSubmittedAt?.toISOString() ?? null,
    paymentEmailSentAt: order.paymentEmailSentAt?.toISOString() ?? null,
    dueDate: order.dueDate.toISOString(),
    createdAt: order.createdAt.toISOString(),
  };
}

export function buildSpecialOrderPaymentQuote(order: {
  tshirtSize: string;
  quarterZipSize: string;
}) {
  return specialOrderQuote(order);
}

export {
  SPECIAL_ORDER_DUE_DATE,
  SPECIAL_ORDER_TOTAL_EUR,
  specialOrderFullName,
  specialOrderItemSummary,
};
