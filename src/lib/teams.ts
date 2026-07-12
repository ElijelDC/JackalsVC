export function splitTeamName(name: string) {
  const match = name.match(/^(.+?)(\s+\d(?:st|nd|rd|th).*)$/i);
  if (match) {
    return { primary: match[1], accent: match[2].trim() };
  }
  return { primary: name, accent: null };
}

export function countTeamMembers(
  members: { role: string }[],
): { coaches: number; players: number; total: number } {
  const coaches = members.filter((member) => member.role === "COACH").length;
  const players = members.filter((member) => member.role === "PLAYER").length;
  return { coaches, players, total: coaches + players };
}

function normalizeTeamMemberName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function uniqueMemberKey(member: {
  clubMemberId?: string | null;
  name: string;
}) {
  if (member.clubMemberId) {
    return `member:${member.clubMemberId}`;
  }

  return `name:${normalizeTeamMemberName(member.name)}`;
}

/** Count distinct coaches or players across all teams (same person on multiple squads counts once). */
export function countUniqueMembersAcrossTeams(
  teams: {
    members: {
      role: string;
      clubMemberId?: string | null;
      name: string;
    }[];
  }[],
  role: "COACH" | "PLAYER",
): number {
  const seen = new Set<string>();

  for (const team of teams) {
    for (const member of team.members) {
      if (member.role !== role) continue;
      seen.add(uniqueMemberKey(member));
    }
  }

  return seen.size;
}
