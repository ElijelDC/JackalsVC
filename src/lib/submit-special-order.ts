import { afterSaveNotify } from "@/lib/offer-notify";
import { emailSiteUrl, notifyAdmins } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import {
  SPECIAL_ORDER_DUE_DATE,
  SPECIAL_ORDER_DUE_LABEL,
  specialOrderFullName,
  specialOrderItemSummary,
} from "@/lib/special-order-config";
import {
  findSpecialOrderForMember,
  SpecialOrderAlreadyExistsError,
} from "@/lib/special-order-member";
import { serializeSpecialOrder } from "@/lib/special-order-response-config";
import type { specialOrderSchema } from "@/lib/validations";
import type { z } from "zod";

type SpecialOrderData = z.infer<typeof specialOrderSchema>;

export async function submitSpecialOrder(
  data: SpecialOrderData,
  options: { userId: string },
) {
  const email = data.email.toLowerCase();
  const existing = await findSpecialOrderForMember({
    userId: options.userId,
    email,
  });
  if (existing) {
    throw new SpecialOrderAlreadyExistsError(existing);
  }

  try {
    const order = await prisma.specialOrder.create({
      data: {
        userId: options.userId,
        firstName: data.firstName,
        lastName: data.lastName,
        email,
        phoneNumber: data.phoneNumber.trim(),
        tshirtSize: data.tshirtSize,
        quarterZipSize: data.quarterZipSize,
        dueDate: SPECIAL_ORDER_DUE_DATE,
      },
    });

    await afterSaveNotify("special-order", async () => {
      const fullName = specialOrderFullName(order);
      const items = specialOrderItemSummary(order);
      await notifyAdmins({
        subject: `[Jackals VC] Special order — ${fullName}`,
        replyTo: order.email,
        content: {
          heading: "New special order",
          paragraphs: [
            `${fullName} ordered the warm-up T-shirt + match quarter zip package (€15 due ${SPECIAL_ORDER_DUE_LABEL.replace(/ 20\d{2}$/, "")}).`,
          ],
          details: [
            { label: "Name", value: fullName },
            { label: "Email", value: order.email },
            { label: "Phone", value: order.phoneNumber },
            { label: "Items", value: items.join(", ") },
          ],
          ctaUrl: emailSiteUrl("/admin/special-orders"),
          ctaLabel: "View special orders",
        },
      });
    });

    return order;
  } catch (error) {
    const raced = await findSpecialOrderForMember({
      userId: options.userId,
      email,
    });
    if (raced) {
      throw new SpecialOrderAlreadyExistsError(raced);
    }
    throw error;
  }
}

export { serializeSpecialOrder };
