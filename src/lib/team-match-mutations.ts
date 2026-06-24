import { prisma } from "@/lib/prisma";

export type TeamMatchFormInput = {
  trainingTeamKey: string;
  opponentName: string;
  venue: string;
  location: string;
  warmUpTime: string;
  matchStart: string;
  notes?: string;
};

export function toTeamMatchData(data: TeamMatchFormInput) {
  return {
    trainingTeamKey: data.trainingTeamKey,
    opponentName: data.opponentName.trim(),
    venue: data.venue,
    location: data.location.trim(),
    warmUpTime: new Date(data.warmUpTime),
    matchStart: new Date(data.matchStart),
    notes: data.notes ?? null,
  };
}

export async function applyTeamMatchDeleteAction(
  id: string,
  action: string | null,
) {
  if (action === "cancel") {
    await prisma.teamMatch.update({
      where: { id },
      data: { cancelled: true },
    });
    return;
  }

  if (action === "restore") {
    await prisma.teamMatch.update({
      where: { id },
      data: { cancelled: false },
    });
    return;
  }

  await prisma.teamMatch.delete({ where: { id } });
}
