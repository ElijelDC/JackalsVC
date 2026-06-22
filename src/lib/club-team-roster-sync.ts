import "server-only";

import { prisma } from "@/lib/prisma";

const ROSTER_ROLES = ["PLAYER", "COACH"] as const;

export function rosterRoleToTeamRole(rosterRole: string) {
  return rosterRole === "COACH" ? "COACH" : "PLAYER";
}

export async function syncClubTeamFromRoster(clubTeamId: string) {
  const team = await prisma.clubTeam.findUnique({ where: { id: clubTeamId } });
  if (!team?.trainingTeamKey) {
    return { synced: 0, removed: 0 };
  }

  const rosterMembers = await prisma.clubMember.findMany({
    where: {
      trainingTeamKey: team.trainingTeamKey,
      active: true,
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

export async function syncClubTeamsForClubMember(clubMemberId: string) {
  const member = await prisma.clubMember.findUnique({
    where: { id: clubMemberId },
    select: { trainingTeamKey: true },
  });

  if (!member?.trainingTeamKey) {
    await prisma.clubTeamMember.deleteMany({ where: { clubMemberId } });
    return;
  }

  await syncClubTeamsForSquadKey(member.trainingTeamKey);
}

export async function handleClubMemberSquadChange(
  clubMemberId: string,
  previousTeamKey: string | null,
  nextTeamKey: string | null,
) {
  if (previousTeamKey && previousTeamKey !== nextTeamKey) {
    await prisma.clubTeamMember.deleteMany({
      where: {
        clubMemberId,
        team: { trainingTeamKey: previousTeamKey },
      },
    });
    await syncClubTeamsForSquadKey(previousTeamKey);
  }

  if (nextTeamKey) {
    await syncClubTeamsForSquadKey(nextTeamKey);
  } else {
    await prisma.clubTeamMember.deleteMany({ where: { clubMemberId } });
  }
}

export function isRosterRole(value: string) {
  return ROSTER_ROLES.includes(value as (typeof ROSTER_ROLES)[number]);
}
