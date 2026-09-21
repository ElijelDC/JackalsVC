/** Member UI accent — D3 Women use purple; everyone else Jackals red. */

export type DashboardAccent = "red" | "purple";

export function dashboardAccentForTeam(
  trainingTeamKey: string | null | undefined,
): DashboardAccent {
  return trainingTeamKey === "DIV3_WOMENS" ? "purple" : "red";
}

/**
 * Purple chrome for D3W members (and coaches whose primary squad is D3W).
 * Also purple when DIV3_WOMENS is among their squads and they are a player.
 */
export function dashboardAccentForUser(input: {
  trainingTeamKey?: string | null;
  trainingTeamKeys?: string[];
  rosterRole?: string | null;
}): DashboardAccent {
  if (dashboardAccentForTeam(input.trainingTeamKey) === "purple") {
    return "purple";
  }
  if (
    input.rosterRole === "PLAYER" &&
    (input.trainingTeamKeys ?? []).includes("DIV3_WOMENS")
  ) {
    return "purple";
  }
  return "red";
}

export const DASHBOARD_ACCENT = {
  red: {
    icon: "text-jackals-red-light",
    iconHover: "hover:text-jackals-red",
    iconHoverLight: "hover:text-jackals-red-light",
    groupHoverIcon: "group-hover:text-jackals-red-light",
    softBg: "bg-jackals-red/10",
    softBgHover: "group-hover:bg-jackals-red/20",
    softBgStrong: "bg-jackals-red/15",
    borderSoft: "border-jackals-red/25",
    borderHover: "hover:border-jackals-red/30",
    borderCircle: "border-jackals-red/40",
    surfaceHover: "hover:bg-jackals-red/[0.05]",
    gradientFrom: "from-jackals-red/[0.1]",
    ringSoft: "border-jackals-red/15",
  },
  purple: {
    icon: "text-jackals-purple-light",
    iconHover: "hover:text-jackals-purple",
    iconHoverLight: "hover:text-jackals-purple-light",
    groupHoverIcon: "group-hover:text-jackals-purple-light",
    softBg: "bg-jackals-purple/10",
    softBgHover: "group-hover:bg-jackals-purple/20",
    softBgStrong: "bg-jackals-purple/15",
    borderSoft: "border-jackals-purple/25",
    borderHover: "hover:border-jackals-purple/30",
    borderCircle: "border-jackals-purple/40",
    surfaceHover: "hover:bg-jackals-purple/[0.05]",
    gradientFrom: "from-jackals-purple/[0.1]",
    ringSoft: "border-jackals-purple/15",
  },
} as const;

export type DashboardAccentClasses =
  (typeof DASHBOARD_ACCENT)[DashboardAccent];
