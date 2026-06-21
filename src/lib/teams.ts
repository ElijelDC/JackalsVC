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
