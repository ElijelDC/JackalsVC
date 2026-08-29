import { afterSaveNotify } from "@/lib/offer-notify";
import { merchandiseOrderGenderLabel } from "@/lib/merchandise-order-config";
import {
  merchandiseOrderFullName,
  merchandiseOrderItemSummary,
} from "@/lib/merchandise-order-response-config";
import { emailSiteUrl, notifyAdmins } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import type { merchandiseOrderSchema } from "@/lib/validations";
import type { z } from "zod";

type MerchandiseOrderData = z.infer<typeof merchandiseOrderSchema>;

const selectedSize = (included: boolean, size: string) => (included ? size : "");

export async function submitMerchandiseOrder(data: MerchandiseOrderData) {
  const order = await prisma.merchandiseOrder.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.toLowerCase(),
      phoneNumber: data.phoneNumber.trim(),
      gender: data.gender,
      trainingTshirt: data.trainingTshirt,
      trainingTshirtSize: selectedSize(
        data.trainingTshirt,
        data.trainingTshirtSize,
      ),
      trainingTop: data.trainingTop,
      trainingTopSize: selectedSize(data.trainingTop, data.trainingTopSize),
      jacketHoodie: data.jacketHoodie,
      jacketHoodieSize: selectedSize(data.jacketHoodie, data.jacketHoodieSize),
      jacketHighCollar: data.jacketHighCollar,
      jacketHighCollarSize: selectedSize(
        data.jacketHighCollar,
        data.jacketHighCollarSize,
      ),
      jacketFullZip: data.jacketFullZip,
      jacketFullZipSize: selectedSize(
        data.jacketFullZip,
        data.jacketFullZipSize,
      ),
    },
  });

  await afterSaveNotify("merchandise-order", async () => {
    const fullName = merchandiseOrderFullName(order);
    const items = merchandiseOrderItemSummary(order);
    await notifyAdmins({
      subject: `[Jackals VC] Merchandise order — ${fullName}`,
      replyTo: order.email,
      content: {
        heading: "New merchandise order",
        paragraphs: [
          `${fullName} submitted a 2026/27 merchandise order on jackalsvolleyball.com.`,
        ],
        details: [
          { label: "Name", value: fullName },
          { label: "Email", value: order.email },
          { label: "Phone", value: order.phoneNumber },
          { label: "Fit", value: merchandiseOrderGenderLabel(order.gender) },
          { label: "Items", value: items.join(", ") },
        ],
        ctaUrl: emailSiteUrl("/admin/merchandise-orders"),
        ctaLabel: "View merchandise orders",
      },
    });
  });

  return order;
}
