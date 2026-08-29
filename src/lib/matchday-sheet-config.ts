export type MatchdaySheetEntry = {
  name: string;
  vlyNumber: string | null;
  playerNumber: number | null;
  vlyMembershipPhotoUrl: string | null;
  role: "PLAYER" | "COACH";
};

export type MatchdaySheetData = {
  match: {
    id: string;
    title: string;
    opponentName: string;
    venue: string;
    location: string;
    warmUpTime: string;
    matchStart: string;
    cancelled: boolean;
  };
  team: {
    key: string;
    name: string;
  };
  players: MatchdaySheetEntry[];
  coaches: MatchdaySheetEntry[];
};

export function formatMatchdayRoleLabel(entry: MatchdaySheetEntry) {
  if (entry.role === "COACH") return "Coach";
  return entry.playerNumber != null
    ? `Kit Number: ${entry.playerNumber}`
    : "Kit Number: —";
}
