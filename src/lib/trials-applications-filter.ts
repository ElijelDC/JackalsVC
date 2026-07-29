import type {
  TrialsApplicationRecord,
  TrialsApplicationStatus,
} from "@/lib/trials-application-config";
import { isTrialsApplicationStatus } from "@/lib/trials-application-config";
import {
  TRIALS_POSITION_OPTIONS,
  TRIALS_TEAM_OPTIONS,
  trialsInlDivisionLabel,
  trialsPositionLabel,
  trialsTeamLabel,
} from "@/lib/trials-recruitment-config";

export type TrialsApplicationsStatusFilter = "ALL" | TrialsApplicationStatus;
export type TrialsApplicationsTeamFilter =
  | "ALL"
  | (typeof TRIALS_TEAM_OPTIONS)[number]["value"];
export type TrialsApplicationsPositionFilter =
  | "ALL"
  | (typeof TRIALS_POSITION_OPTIONS)[number]["value"];

export type TrialsApplicationsFilter = {
  status: TrialsApplicationsStatusFilter;
  team: TrialsApplicationsTeamFilter;
  position: TrialsApplicationsPositionFilter;
  search: string;
};

export const DEFAULT_TRIALS_APPLICATIONS_FILTER: TrialsApplicationsFilter = {
  status: "ALL",
  team: "ALL",
  position: "ALL",
  search: "",
};

const TEAM_VALUES = new Set(
  TRIALS_TEAM_OPTIONS.map((option) => option.value),
);
const POSITION_VALUES = new Set(
  TRIALS_POSITION_OPTIONS.map((option) => option.value),
);

type TrialsTeamOptionValue = (typeof TRIALS_TEAM_OPTIONS)[number]["value"];
type TrialsPositionOptionValue =
  (typeof TRIALS_POSITION_OPTIONS)[number]["value"];

export function filterTrialsApplications(
  applications: TrialsApplicationRecord[],
  filters: TrialsApplicationsFilter,
): TrialsApplicationRecord[] {
  const query = filters.search.trim().toLowerCase();

  return applications.filter((application) => {
    if (filters.status !== "ALL" && application.status !== filters.status) {
      return false;
    }
    if (filters.team !== "ALL" && application.tryingOutFor !== filters.team) {
      return false;
    }
    if (
      filters.position !== "ALL" &&
      application.preferredPosition1 !== filters.position &&
      application.preferredPosition2 !== filters.position
    ) {
      return false;
    }
    if (!query) return true;

    const haystack = [
      application.fullName,
      application.contactEmail,
      application.contactNumber,
      application.inlTeamName ?? "",
      application.inlDivisionOther ?? "",
      trialsTeamLabel(application.tryingOutFor),
      trialsInlDivisionLabel(application.inlDivision),
      trialsPositionLabel(application.preferredPosition1),
      trialsPositionLabel(application.preferredPosition2),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}

export function trialsApplicationsFilterToSearchParams(
  filters: TrialsApplicationsFilter,
): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.status !== "ALL") {
    params.set("status", filters.status);
  }
  if (filters.team !== "ALL") {
    params.set("team", filters.team);
  }
  if (filters.position !== "ALL") {
    params.set("position", filters.position);
  }
  if (filters.search.trim()) {
    params.set("search", filters.search.trim());
  }

  return params;
}

export function parseTrialsApplicationsFilter(
  searchParams: URLSearchParams,
): TrialsApplicationsFilter {
  const statusRaw = searchParams.get("status")?.trim() ?? "ALL";
  const teamRaw = searchParams.get("team")?.trim() ?? "ALL";
  const positionRaw = searchParams.get("position")?.trim() ?? "ALL";

  return {
    status:
      statusRaw === "ALL" || isTrialsApplicationStatus(statusRaw)
        ? statusRaw
        : "ALL",
    team:
      teamRaw === "ALL"
        ? "ALL"
        : TEAM_VALUES.has(teamRaw as TrialsTeamOptionValue)
          ? (teamRaw as TrialsTeamOptionValue)
          : "ALL",
    position:
      positionRaw === "ALL"
        ? "ALL"
        : POSITION_VALUES.has(positionRaw as TrialsPositionOptionValue)
          ? (positionRaw as TrialsPositionOptionValue)
          : "ALL",
    search: searchParams.get("search")?.trim() ?? "",
  };
}

export function hasTrialsApplicationsFilters(
  filters: TrialsApplicationsFilter,
): boolean {
  return (
    filters.status !== "ALL" ||
    filters.team !== "ALL" ||
    filters.position !== "ALL" ||
    filters.search.trim() !== ""
  );
}
