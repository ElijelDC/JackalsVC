import "server-only";

import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import {
  TRAINING_PAYG_SETTINGS_ID,
  serializeTrainingPaygSettings,
  type TrainingPaygSettingsRecord,
} from "@/lib/player-payment-type";

export async function getTrainingPaygSettings(): Promise<TrainingPaygSettingsRecord> {
  const existing = await prisma.trainingPaygSettings.findUnique({
    where: { id: TRAINING_PAYG_SETTINGS_ID },
  });
  if (existing) return serializeTrainingPaygSettings(existing);

  const created = await prisma.trainingPaygSettings.create({
    data: {
      id: TRAINING_PAYG_SETTINGS_ID,
      sessionFeeEur: 10,
      paymentUrl: "",
      active: true,
    },
  });
  return serializeTrainingPaygSettings(created);
}

export async function updateTrainingPaygSettings(input: {
  sessionFeeEur?: number;
  paymentUrl?: string;
  active?: boolean;
}) {
  await getTrainingPaygSettings();
  const updated = await prisma.trainingPaygSettings.update({
    where: { id: TRAINING_PAYG_SETTINGS_ID },
    data: {
      ...(input.sessionFeeEur !== undefined
        ? { sessionFeeEur: input.sessionFeeEur }
        : {}),
      ...(input.paymentUrl !== undefined
        ? { paymentUrl: input.paymentUrl.trim() }
        : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
    },
  });
  return serializeTrainingPaygSettings(updated);
}

export function buildTrainingPaygPaymentReference(
  memberName: string,
  sessionDate: Date,
) {
  const dateLabel = format(sessionDate, "d MMM yyyy");
  const base = memberName.trim().replace(/\s+/g, " ");
  return `PPT ${base} · ${dateLabel}`;
}
