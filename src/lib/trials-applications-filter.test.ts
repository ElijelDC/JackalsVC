import { describe, expect, it } from "vitest";
import type { TrialsApplicationRecord } from "@/lib/trials-application-config";
import {
  filterTrialsApplications,
  parseTrialsApplicationsFilter,
  trialsApplicationsFilterToSearchParams,
} from "@/lib/trials-applications-filter";

const sample: TrialsApplicationRecord = {
  id: "1",
  tryingOutFor: "MENS_DIVISION_2",
  fullName: "Alex Player",
  age: 24,
  contactEmail: "alex@example.com",
  contactNumber: "+353871234567",
  yearsExperience: 3,
  inlDivision: "DIVISION_2",
  inlDivisionOther: null,
  inlTeamName: "Dublin Volleyball",
  preferredPosition1: "WING",
  preferredPosition2: "OPPO",
  status: "NEW",
  reviewedAt: null,
  reviewedByUserId: null,
  createdAt: "2026-07-01T10:00:00.000Z",
  updatedAt: "2026-07-01T10:00:00.000Z",
};

describe("filterTrialsApplications", () => {
  it("filters by status, team, position, and search", () => {
    const reviewed = { ...sample, id: "2", status: "REVIEWED" as const };

    expect(
      filterTrialsApplications([sample, reviewed], {
        status: "NEW",
        team: "ALL",
        position: "ALL",
        search: "",
      }),
    ).toEqual([sample]);

    expect(
      filterTrialsApplications([sample], {
        status: "ALL",
        team: "MENS_DIVISION_2",
        position: "ALL",
        search: "",
      }),
    ).toEqual([sample]);

    expect(
      filterTrialsApplications([sample], {
        status: "ALL",
        team: "ALL",
        position: "WING",
        search: "",
      }),
    ).toEqual([sample]);

    expect(
      filterTrialsApplications([sample], {
        status: "ALL",
        team: "ALL",
        position: "ALL",
        search: "alex@example.com",
      }),
    ).toEqual([sample]);
  });
});

describe("trials applications filter query params", () => {
  it("round-trips active filters", () => {
    const params = trialsApplicationsFilterToSearchParams({
      status: "NEW",
      team: "MENS_DIVISION_2",
      position: "WING",
      search: "alex",
    });

    expect(parseTrialsApplicationsFilter(params)).toEqual({
      status: "NEW",
      team: "MENS_DIVISION_2",
      position: "WING",
      search: "alex",
    });
  });

  it("ignores invalid filter values", () => {
    const params = new URLSearchParams({
      status: "INVALID",
      team: "NOT_A_TEAM",
      position: "NOT_A_POSITION",
    });

    expect(parseTrialsApplicationsFilter(params)).toEqual({
      status: "ALL",
      team: "ALL",
      position: "ALL",
      search: "",
    });
  });
});
