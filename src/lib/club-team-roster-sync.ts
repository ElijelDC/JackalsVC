import "server-only";

import { prisma } from "@/lib/prisma";

const ROSTER_ROLES = ["PLAYER", "COACH"] as const;

export function rosterRoleToTeamRole(rosterRole: string) {
  return rosterRole === "COACH" ? "COACH" : "PLAYER";
}

export function parseSyncExcludedClubMemberIds(
  value: string | null | undefined,
): string[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

export function serializeSyncExcludedClubMemberIds(ids: string[]): string {
  return JSON.stringify([...new Set(ids)]);
}

export async function syncClubTeamFromRoster(clubTeamId: string) {
  const team = await prisma.clubTeam.findUnique({ where: { id: clubTeamId } });
  if (!team?.trainingTeamKey) {
    return { synced: 0, removed: 0 };
  }

  const excludedIds = parseSyncExcludedClubMemberIds(
    team.syncExcludedClubMemberIds,
  );

  const rosterMembers = await prisma.clubMember.findMany({
    where: {
      active: true,
      OR: [
        { trainingTeamKey: team.trainingTeamKey },
        { coachSquads: { some: { trainingTeamKey: team.trainingTeamKey } } },
      ],
      ...(excludedIds.length > 0 ? { id: { notIn: excludedIds } } : {}),
    },
    orderBy: [{ rosterRole: "asc" }, { name: "asc" }],
  });

  const existingSynced = await prisma.clubTeamMember.findMany({
    where: {
      teamId: clubTeamId,
      clubMemberId: { not: null },
    },
  });

  const rosterIds = new Set(rosterMembers.map((member) => member.id));
  let removed = 0;

  for (const member of existingSynced) {
    if (member.clubMemberId && !rosterIds.has(member.clubMemberId)) {
      await prisma.clubTeamMember.delete({ where: { id: member.id } });
      removed += 1;
    }
  }

  let synced = 0;

  for (const [index, rosterMember] of rosterMembers.entries()) {
    const role = rosterRoleToTeamRole(rosterMember.rosterRole);
    const existing = existingSynced.find(
      (member) => member.clubMemberId === rosterMember.id,
    );

    const payload = {
      name: rosterMember.name,
      role,
      photoUrl: rosterMember.profileImageUrl,
    };

    if (existing) {
      await prisma.clubTeamMember.update({
        where: { id: existing.id },
        data: payload,
      });
    } else {
      await prisma.clubTeamMember.create({
        data: {
          teamId: clubTeamId,
          clubMemberId: rosterMember.id,
          ...payload,
          sortOrder: index,
        },
      });
    }

    synced += 1;
  }

  return { synced, removed };
}

export async function detachClubTeamMembersForManualMode(clubTeamId: string) {
  await prisma.$transaction([
    prisma.clubTeamMember.updateMany({
      where: { teamId: clubTeamId, clubMemberId: { not: null } },
      data: { clubMemberId: null },
    }),
    prisma.clubTeam.update({
      where: { id: clubTeamId },
      data: { syncExcludedClubMemberIds: "[]" },
    }),
  ]);
}

export async function syncClubTeamsForSquadKey(trainingTeamKey: string) {
  const teams = await prisma.clubTeam.findMany({
    where: { trainingTeamKey },
    select: { id: true },
  });

  const results = await Promise.all(
    teams.map((team) => syncClubTeamFromRoster(team.id)),
  );

  return results.reduce(
    (totals, result) => ({
      synced: totals.synced + result.synced,
      removed: totals.removed + result.removed,
    }),
    { synced: 0, removed: 0 },
  );
}

export async function getClubMemberSquadKeys(clubMemberId: string) {
  const member = await prisma.clubMember.findUnique({
    where: { id: clubMemberId },
    select: {
      trainingTeamKey: true,
      rosterRole: true,
      coachSquads: { select: { trainingTeamKey: true } },
    },
  });

  if (!member) return [] as string[];

  if (member.rosterRole === "COACH") {
    const fromJoin = member.coachSquads.map((row) => row.trainingTeamKey);
    if (fromJoin.length > 0) {
      return [...new Set(fromJoin)];
    }
    // Legacy rows before coachSquads join was populated.
    return member.trainingTeamKey ? [member.trainingTeamKey] : [];
  }

  return member.trainingTeamKey ? [member.trainingTeamKey] : [];
}

export async function setClubMemberCoachSquads(
  clubMemberId: string,
  trainingTeamKeys: string[],
  priorities?: Record<string, number>,
) {
  const uniqueKeys = [...new Set(trainingTeamKeys.filter(Boolean))];
  const previousKeys = await getClubMemberSquadKeys(clubMemberId);

  const existingPriorities =
    priorities ??
    Object.fromEntries(
      (
        await prisma.clubMemberCoachSquad.findMany({
          where: { clubMemberId },
          select: { trainingTeamKey: true, priority: true },
        })
      ).map((row) => [row.trainingTeamKey, row.priority]),
    );

  const resolved = Object.fromEntries(
    uniqueKeys.map((trainingTeamKey) => [
      trainingTeamKey,
      Math.max(0, Math.floor(existingPriorities[trainingTeamKey] ?? 100)),
    ]),
  );

  // Prefer head-coach squad as primary; else first assigned key.
  const headKey =
    uniqueKeys.find((key) => (resolved[key] ?? 100) === 0) ?? null;
  const primaryKey = headKey ?? uniqueKeys[0] ?? null;

  await prisma.$transaction(async (tx) => {
    await tx.clubMemberCoachSquad.deleteMany({ where: { clubMemberId } });
    if (uniqueKeys.length > 0) {
      await tx.clubMemberCoachSquad.createMany({
        data: uniqueKeys.map((trainingTeamKey) => ({
          clubMemberId,
          trainingTeamKey,
          priority: resolved[trainingTeamKey] ?? 100,
        })),
      });
    }
    await tx.clubMember.update({
      where: { id: clubMemberId },
      data: { trainingTeamKey: primaryKey },
    });

    // Only one head coach (priority 0) per squad.
    for (const trainingTeamKey of uniqueKeys) {
      if ((resolved[trainingTeamKey] ?? 100) !== 0) continue;
      await tx.clubMemberCoachSquad.updateMany({
        where: {
          trainingTeamKey,
          clubMemberId: { not: clubMemberId },
          priority: 0,
        },
        data: { priority: 100 },
      });
    }
  });

  await handleClubMemberSquadKeysChange(clubMemberId, previousKeys, uniqueKeys);
  return { previousKeys, nextKeys: uniqueKeys, primaryKey };
}

export async function setCoachSquadPriority(
  clubMemberId: string,
  trainingTeamKey: string,
  priority: number,
) {
  const nextPriority = Math.max(0, Math.floor(priority));

  await prisma.$transaction(async (tx) => {
    if (nextPriority === 0) {
      await tx.clubMemberCoachSquad.updateMany({
        where: {
          trainingTeamKey,
          clubMemberId: { not: clubMemberId },
          priority: 0,
        },
        data: { priority: 100 },
      });
    }

    await tx.clubMemberCoachSquad.update({
      where: {
        clubMemberId_trainingTeamKey: { clubMemberId, trainingTeamKey },
      },
      data: { priority: nextPriority },
    });
  });
}

export async function syncClubTeamsForClubMember(clubMemberId: string) {
  const keys = await getClubMemberSquadKeys(clubMemberId);

  if (keys.length === 0) {
    await prisma.clubTeamMember.deleteMany({ where: { clubMemberId } });
    return;
  }

  for (const key of keys) {
    await syncClubTeamsForSquadKey(key);
  }
}

export async function handleClubMemberSquadChange(
  clubMemberId: string,
  previousTeamKey: string | null,
  nextTeamKey: string | null,
) {
  await handleClubMemberSquadKeysChange(
    clubMemberId,
    previousTeamKey ? [previousTeamKey] : [],
    nextTeamKey ? [nextTeamKey] : [],
  );
}

type ClubMemberWithCoachSquads = {
  trainingTeamKey: string | null;
  rosterRole: string;
  coachSquads?: { trainingTeamKey: string; priority?: number }[];
};

export function resolveClubMemberTrainingTeamKeys(
  member: ClubMemberWithCoachSquads,
): string[] {
  if (member.rosterRole === "COACH") {
    const fromJoin = member.coachSquads?.map((row) => row.trainingTeamKey) ?? [];
    if (fromJoin.length > 0) {
      return [...new Set(fromJoin)];
    }
    // Legacy rows before coachSquads join was populated.
    return member.trainingTeamKey ? [member.trainingTeamKey] : [];
  }

  return member.trainingTeamKey ? [member.trainingTeamKey] : [];
}

export function resolveClubMemberCoachSquadPriorities(
  member: ClubMemberWithCoachSquads,
): Record<string, number> {
  const priorities: Record<string, number> = {};
  for (const row of member.coachSquads ?? []) {
    priorities[row.trainingTeamKey] = row.priority ?? 100;
  }
  return priorities;
}

export function serializeClubMemberForAdmin<
  T extends ClubMemberWithCoachSquads & Record<string, unknown>,
>(member: T) {
  return {
    ...member,
    trainingTeamKeys: resolveClubMemberTrainingTeamKeys(member),
    coachSquadPriorities: resolveClubMemberCoachSquadPriorities(member),
  };
}

export async function handleClubMemberSquadKeysChange(
  clubMemberId: string,
  previousKeys: string[],
  nextKeys: string[],
) {
  const previous = [...new Set(previousKeys.filter(Boolean))];
  const next = [...new Set(nextKeys.filter(Boolean))];
  const removed = previous.filter((key) => !next.includes(key));
  const added = next.filter((key) => !previous.includes(key));

  for (const key of removed) {
    await prisma.clubTeamMember.deleteMany({
      where: {
        clubMemberId,
        team: { trainingTeamKey: key },
      },
    });
    await syncClubTeamsForSquadKey(key);
  }

  if (next.length === 0) {
    await prisma.clubTeamMember.deleteMany({ where: { clubMemberId } });
    return;
  }

  // Only re-sync squads that gained this member (kept squads are unchanged).
  for (const key of added) {
    await syncClubTeamsForSquadKey(key);
  }
}

export function isRosterRole(value: string) {
  return ROSTER_ROLES.includes(value as (typeof ROSTER_ROLES)[number]);
}
