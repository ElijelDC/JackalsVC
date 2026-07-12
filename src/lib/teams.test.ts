import { describe, expect, it } from "vitest";
import { countUniqueMembersAcrossTeams } from "@/lib/teams";

describe("countUniqueMembersAcrossTeams", () => {
  const teams = [
    {
      members: [
        { role: "COACH", name: "Alex Coach", clubMemberId: "coach-1" },
        { role: "PLAYER", name: "Player A", clubMemberId: "player-1" },
      ],
    },
    {
      members: [
        { role: "COACH", name: "Alex Coach", clubMemberId: "coach-1" },
        { role: "COACH", name: "Sam Coach", clubMemberId: null },
        { role: "PLAYER", name: "Player B", clubMemberId: "player-2" },
      ],
    },
    {
      members: [
        { role: "COACH", name: "Sam Coach", clubMemberId: null },
        { role: "PLAYER", name: "Player A", clubMemberId: "player-1" },
      ],
    },
  ];

  it("counts each coach once when they appear on multiple teams", () => {
    expect(countUniqueMembersAcrossTeams(teams, "COACH")).toBe(2);
  });

  it("counts each player once when they appear on multiple teams", () => {
    expect(countUniqueMembersAcrossTeams(teams, "PLAYER")).toBe(2);
  });

  it("matches manual roster entries by normalized name when clubMemberId is missing", () => {
    const manualTeams = [
      {
        members: [{ role: "COACH", name: "  Sam   Coach ", clubMemberId: null }],
      },
      {
        members: [{ role: "COACH", name: "sam coach", clubMemberId: null }],
      },
    ];

    expect(countUniqueMembersAcrossTeams(manualTeams, "COACH")).toBe(1);
  });
});
