import {
  merchandiseOrderGenderLabel,
  parseMerchandiseOrderFreeLineItemIds,
  type MerchandiseOrderGender,
} from "@/lib/merchandise-order-config";

export type MerchandiseOrderRecord = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  gender: MerchandiseOrderGender | string;
  genderLabel: string;
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
  freeLineItemIds: string[];
  paymentToken: string;
  paymentStatus: string;
  proofScreenshotUrl: string | null;
  proofSubmittedAt: string | null;
  paymentEmailSentAt: string | null;
  createdAt: string;
};

export function merchandiseOrderFullName(row: {
  firstName: string;
  lastName: string;
}) {
  return `${row.firstName} ${row.lastName}`.trim();
}

export function merchandiseOrderItemSummary(
  row: Pick<
    MerchandiseOrderRecord,
    | "trainingTshirt"
    | "trainingTshirtSize"
    | "trainingTop"
    | "trainingTopSize"
    | "jacketHoodie"
    | "jacketHoodieSize"
    | "jacketHighCollar"
    | "jacketHighCollarSize"
    | "jacketFullZip"
    | "jacketFullZipSize"
  >,
) {
  const items: string[] = [];
  const add = (included: boolean, label: string, size: string) => {
    if (included) items.push(size ? `${label} (${size})` : label);
  };
  add(row.trainingTshirt, "Training t-shirt", row.trainingTshirtSize);
  add(row.trainingTop, "Quarter zip", row.trainingTopSize);
  add(row.jacketHoodie, "Zip hoodie", row.jacketHoodieSize);
  add(row.jacketHighCollar, "High collar zip", row.jacketHighCollarSize);
  add(row.jacketFullZip, "Full zip", row.jacketFullZipSize);
  return items;
}

export function serializeMerchandiseOrder(row: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  gender: string;
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
  freeLineItemIds?: string | null;
  paymentToken?: string;
  paymentStatus?: string;
  proofScreenshotUrl?: string | null;
  proofSubmittedAt?: Date | null;
  paymentEmailSentAt?: Date | null;
  createdAt: Date;
}): MerchandiseOrderRecord {
  return {
    ...row,
    genderLabel: merchandiseOrderGenderLabel(row.gender),
    freeLineItemIds: parseMerchandiseOrderFreeLineItemIds(row.freeLineItemIds),
    paymentToken: row.paymentToken ?? "",
    paymentStatus: row.paymentStatus ?? "AWAITING",
    proofScreenshotUrl: row.proofScreenshotUrl ?? null,
    proofSubmittedAt: row.proofSubmittedAt?.toISOString() ?? null,
    paymentEmailSentAt: row.paymentEmailSentAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}
