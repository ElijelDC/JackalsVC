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
    const keys = [...new Set([...fromJoin, member.trainingTeamKey].filter(Boolean))] as string[];
    return keys;
  }

  return member.trainingTeamKey ? [member.trainingTeamKey] : [];
}

export async function setClubMemberCoachSquads(
  clubMemberId: string,
  trainingTeamKeys: string[],
) {
  const uniqueKeys = [...new Set(trainingTeamKeys.filter(Boolean))];
  const previousKeys = await getClubMemberSquadKeys(clubMemberId);
  const primaryKey = uniqueKeys[0] ?? null;

  await prisma.$transaction([
    prisma.clubMemberCoachSquad.deleteMany({ where: { clubMemberId } }),
    ...(uniqueKeys.length > 0
      ? [
          prisma.clubMemberCoachSquad.createMany({
            data: uniqueKeys.map((trainingTeamKey) => ({
              clubMemberId,
              trainingTeamKey,
            })),
          }),
        ]
      : []),
    prisma.clubMember.update({
      where: { id: clubMemberId },
      data: { trainingTeamKey: primaryKey },
    }),
  ]);

  await handleClubMemberSquadKeysChange(clubMemberId, previousKeys, uniqueKeys);
  return { previousKeys, nextKeys: uniqueKeys, primaryKey };
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

export async function handleClubMemberSquadKeysChange(
  clubMemberId: string,
  previousKeys: string[],
  nextKeys: string[],
) {
  const previous = [...new Set(previousKeys.filter(Boolean))];
  const next = [...new Set(nextKeys.filter(Boolean))];
  const removed = previous.filter((key) => !next.includes(key));
  const addedOrKept = next;

  for (const key of removed) {
    await prisma.clubTeamMember.deleteMany({
      where: {
        clubMemberId,
        team: { trainingTeamKey: key },
      },
    });
    await syncClubTeamsForSquadKey(key);
  }

  if (addedOrKept.length === 0) {
    await prisma.clubTeamMember.deleteMany({ where: { clubMemberId } });
    return;
  }

  for (const key of addedOrKept) {
    await syncClubTeamsForSquadKey(key);
  }
}

export function isRosterRole(value: string) {
  return ROSTER_ROLES.includes(value as (typeof ROSTER_ROLES)[number]);
}
