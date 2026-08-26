import {
  kitOrderGenderLabel,
  kitOrderKitTypeLabel,
  kitOrderPiecesLabel,
  summarizeKitSize,
  type KitOrderGender,
  type KitOrderKitType,
  type KitOrderPieces,
} from "@/lib/kit-order-config";

export type KitOrderRecord = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  gender: KitOrderGender | string;
  genderLabel: string;
  kitType: KitOrderKitType | string;
  kitTypeLabel: string;
  kitPiecesLabel: string;
  kitSize: string;
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
  paymentToken: string;
  paymentStatus: string;
  proofScreenshotUrl: string | null;
  proofSubmittedAt: string | null;
  paymentEmailSentAt: string | null;
  createdAt: string;
};

export function kitOrderFullName(row: {
  firstName: string;
  lastName: string;
}) {
  return `${row.firstName} ${row.lastName}`.trim();
}

export function kitOrderMerchSummary(row: {
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
  const items: string[] = [];
  if (row.trainingTshirt) {
    items.push(
      row.trainingTshirtSize
        ? `Training t-shirt (${row.trainingTshirtSize})`
        : "Training t-shirt",
    );
  }
  if (row.trainingTop) {
    items.push(
      row.trainingTopSize
        ? `Quarter zip (${row.trainingTopSize})`
        : "Quarter zip",
    );
  }
  if (row.jacketHoodie) {
    items.push(
      row.jacketHoodieSize
        ? `Zip hoodie (${row.jacketHoodieSize})`
        : "Zip hoodie",
    );
  }
  if (row.jacketHighCollar) {
    items.push(
      row.jacketHighCollarSize
        ? `High collar zip (${row.jacketHighCollarSize})`
        : "High collar zip",
    );
  }
  if (row.jacketFullZip) {
    items.push(
      row.jacketFullZipSize
        ? `Full zip (${row.jacketFullZipSize})`
        : "Full zip",
    );
  }
  return items;
}

export function serializeKitOrder(row: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  gender: string;
  kitType: string;
  kitSize: string;
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
  createdAt: Date;
  paymentToken?: string;
  paymentStatus?: string;
  proofScreenshotUrl?: string | null;
  proofSubmittedAt?: Date | null;
  paymentEmailSentAt?: Date | null;
}): KitOrderRecord {
  const pieces: KitOrderPieces = {
    playerJersey: row.playerJersey,
    playerShorts: row.playerShorts,
    liberoJersey: row.liberoJersey,
    liberoShorts: row.liberoShorts,
  };

  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    phoneNumber: row.phoneNumber,
    gender: row.gender,
    genderLabel: kitOrderGenderLabel(row.gender),
    kitType: row.kitType,
    kitTypeLabel: kitOrderKitTypeLabel(row.kitType),
    kitPiecesLabel: kitOrderPiecesLabel(pieces),
    kitSize: row.kitSize || summarizeKitSize(row.jerseySize, row.shortsSize),
    playerJersey: row.playerJersey,
    playerShorts: row.playerShorts,
    liberoJersey: row.liberoJersey,
    liberoShorts: row.liberoShorts,
    jerseySize: row.jerseySize,
    shortsSize: row.shortsSize,
    preferredKitNumber1: row.preferredKitNumber1,
    preferredKitNumber2: row.preferredKitNumber2,
    trainingTshirt: row.trainingTshirt,
    trainingTshirtSize: row.trainingTshirtSize,
    trainingTop: row.trainingTop,
    trainingTopSize: row.trainingTopSize,
    jacketHoodie: row.jacketHoodie,
    jacketHoodieSize: row.jacketHoodieSize,
    jacketHighCollar: row.jacketHighCollar,
    jacketHighCollarSize: row.jacketHighCollarSize,
    jacketFullZip: row.jacketFullZip,
    jacketFullZipSize: row.jacketFullZipSize,
    paymentToken: row.paymentToken ?? "",
    paymentStatus: row.paymentStatus ?? "AWAITING",
    proofScreenshotUrl: row.proofScreenshotUrl ?? null,
    proofSubmittedAt: row.proofSubmittedAt?.toISOString() ?? null,
    paymentEmailSentAt: row.paymentEmailSentAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}
