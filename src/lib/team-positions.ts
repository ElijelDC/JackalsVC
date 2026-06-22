export const PLAYER_POSITIONS = [
  "Wing",
  "Middle",
  "Opposite",
  "Setter",
  "Libero",
  "Defensive Specialist",
] as const;

export const COACH_POSITIONS = ["Coach", "Assistant Coach"] as const;

export type PlayerPosition = (typeof PLAYER_POSITIONS)[number];
export type CoachPosition = (typeof COACH_POSITIONS)[number];

export function getPositionOptions(role: "PLAYER" | "COACH") {
  return role === "COACH" ? COACH_POSITIONS : PLAYER_POSITIONS;
}

export function isKnownPosition(role: "PLAYER" | "COACH", value: string) {
  return (getPositionOptions(role) as readonly string[]).includes(value);
}

export function formatPlayerSubtitle(position: string | null | undefined) {
  const trimmed = position?.trim();
  return trimmed ? trimmed : null;
}

const UNASSIGNED_POSITION = "unassigned";

export function getSquadPositionFilters(
  players: { position: string | null }[],
) {
  const counts = new Map<string, number>();

  for (const player of players) {
    const position = player.position?.trim();
    const key = position || UNASSIGNED_POSITION;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const ordered = PLAYER_POSITIONS.filter((position) => counts.has(position));
  const extras = [...counts.keys()]
    .filter(
      (position) =>
        position !== UNASSIGNED_POSITION &&
        !(PLAYER_POSITIONS as readonly string[]).includes(position),
    )
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

  const filters = [...ordered, ...extras];
  if (counts.has(UNASSIGNED_POSITION)) {
    filters.push(UNASSIGNED_POSITION);
  }

  return filters.map((position) => ({
    value: position,
    label: position === UNASSIGNED_POSITION ? "Unassigned" : position,
    count: counts.get(position) ?? 0,
  }));
}

export function playerMatchesPositionFilter(
  player: { position: string | null },
  filter: string,
) {
  if (filter === "all") return true;

  const position = player.position?.trim();
  if (filter === UNASSIGNED_POSITION) return !position;
  return position === filter;
}
