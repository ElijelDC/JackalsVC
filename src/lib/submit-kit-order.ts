import { afterSaveNotify } from "@/lib/offer-notify";
import { emailSiteUrl, notifyAdmins } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import {
  jerseyBackName,
  kitOrderGenderLabel,
  kitOrderPiecesLabel,
  summarizeKitSize,
  summarizeKitType,
} from "@/lib/kit-order-config";
import { kitOrderMerchSummary } from "@/lib/kit-order-response-config";
import type { kitOrderSchema } from "@/lib/validations";
import type { z } from "zod";

type KitOrderData = z.infer<typeof kitOrderSchema>;

function merchSize(included: boolean, size: string) {
  return included ? size : "";
}

export async function submitKitOrder(data: KitOrderData) {
  const pieces = {
    playerJersey: data.playerJersey,
    playerShorts: data.playerShorts,
    liberoJersey: data.liberoJersey,
    liberoShorts: data.liberoShorts,
  };
  const jerseySize = merchSize(
    data.playerJersey || data.liberoJersey,
    data.jerseySize,
  );
  const shortsSize = merchSize(
    data.playerShorts || data.liberoShorts,
    data.shortsSize,
  );

  const order = await prisma.kitOrder.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.toLowerCase(),
      phoneNumber: data.phoneNumber.trim(),
      gender: data.gender,
      kitType: summarizeKitType(pieces),
      kitSize: summarizeKitSize(jerseySize, shortsSize),
      playerJersey: data.playerJersey,
      playerShorts: data.playerShorts,
      liberoJersey: data.liberoJersey,
      liberoShorts: data.liberoShorts,
      jerseySize,
      shortsSize,
      preferredKitNumber1: data.preferredKitNumber1,
      preferredKitNumber2: data.preferredKitNumber2,
      trainingTshirt: data.trainingTshirt,
      trainingTshirtSize: merchSize(data.trainingTshirt, data.trainingTshirtSize),
      trainingTop: data.trainingTop,
      trainingTopSize: merchSize(data.trainingTop, data.trainingTopSize),
      jacketHoodie: data.jacketHoodie,
      jacketHoodieSize: merchSize(data.jacketHoodie, data.jacketHoodieSize),
      jacketHighCollar: data.jacketHighCollar,
      jacketHighCollarSize: merchSize(
        data.jacketHighCollar,
        data.jacketHighCollarSize,
      ),
      jacketFullZip: data.jacketFullZip,
      jacketFullZipSize: merchSize(data.jacketFullZip, data.jacketFullZipSize),
    },
  });

  await afterSaveNotify("kit-order", () => sendKitOrderAdminEmail(order));

  return order;
}

async function sendKitOrderAdminEmail(order: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  gender: string;
  playerJersey: boolean;
  playerShorts: boolean;
  liberoJersey: boolean;
  liberoShorts: boolean;
  jerseySize: string;
  shortsSize: string;
  preferredKitNumber1: number;
  preferredKitNumber2: number;
  trainingTshirt: boolean;
  trainingTshirtSize: string;
  trainingTop: boolean;
  trainingTopSize: string;
  jacketHoodie: boolean;
  jacketHoodieSize: string;
  jacketHighCollar: boolean;
  jacketHighCollarSize: string;
  jacketFullZip: boolean;
  jacketFullZipSize: string;
}) {
  const merch = kitOrderMerchSummary(order);
  const fullName = `${order.firstName} ${order.lastName}`.trim();
  const pieces = kitOrderPiecesLabel(order);

  await notifyAdmins({
    subject: `[Jackals VC] Kit order — ${fullName}`,
    replyTo: order.email,
    content: {
      heading: "New kit order",
      paragraphs: [
        `${fullName} submitted a 2026/27 kit order on jackalsvolleyball.com.`,
      ],
      details: [
        { label: "Name", value: fullName },
        { label: "Jersey back", value: jerseyBackName(order.lastName) },
        { label: "Email", value: order.email },
        { label: "Phone", value: order.phoneNumber },
        { label: "Fit", value: kitOrderGenderLabel(order.gender) },
        { label: "Kit pieces", value: pieces || "None" },
        { label: "Jersey size", value: order.jerseySize || "—" },
        { label: "Shorts size", value: order.shortsSize || "—" },
        {
          label: "Kit numbers",
          value: `#${order.preferredKitNumber1} / #${order.preferredKitNumber2}`,
        },
        {
          label: "Training top / jackets",
          value: merch.length > 0 ? merch.join(", ") : "None",
        },
      ],
      ctaUrl: emailSiteUrl("/admin/kit-orders"),
      ctaLabel: "View kit orders",
    },
  });
}
