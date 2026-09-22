import { prisma } from "@/lib/prisma";
import { specialOrderPaymentPath } from "@/lib/special-order-payment-access";
import {
  serializeSpecialOrder,
  type SpecialOrderRecord,
} from "@/lib/special-order-response-config";

export class SpecialOrderAlreadyExistsError extends Error {
  readonly existing: SpecialOrderRecord;
  readonly paymentUrl: string;

  constructor(order: SpecialOrderRecord) {
    super("You already placed a special order.");
    this.name = "SpecialOrderAlreadyExistsError";
    this.existing = order;
    this.paymentUrl = specialOrderPaymentPath(order.paymentToken);
  }
}

export async function findSpecialOrderForMember(input: {
  userId?: string | null;
  email?: string | null;
}) {
  const userId = input.userId?.trim() || null;
  const email = input.email?.trim().toLowerCase() || null;
  if (!userId && !email) return null;

  const order = await prisma.specialOrder.findFirst({
    where: {
      OR: [
        ...(userId ? [{ userId }] : []),
        ...(email ? [{ email }] : []),
      ],
    },
    orderBy: { createdAt: "asc" },
  });
  return order ? serializeSpecialOrder(order) : null;
}
