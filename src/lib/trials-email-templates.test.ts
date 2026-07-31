import { describe, expect, it } from "vitest";
import {
  bodyToEmailParagraphs,
  firstNameFrom,
  mergeTrialsEmailTemplate,
} from "@/lib/trials-email-templates";

describe("trials email templates", () => {
  const sample = {
    fullName: "Alex Murphy",
    contactEmail: "alex@example.com",
    contactNumber: "+353851234567",
    age: 24,
    tryingOutFor: "MENS_DIVISION_2",
    preferredPosition1: "OUTSIDE_HITTER",
    preferredPosition2: "OPPOSITE",
    inlDivision: "MENS_DIVISION_2",
    inlDivisionOther: null,
    inlTeamName: "Dublin Spikers",
    yearsExperience: 5,
  };

  it("extracts first name for greeting", () => {
    expect(firstNameFrom("Alex Murphy")).toBe("Alex");
  });

  it("merges applicant fields into template body", () => {
    expect(
      mergeTrialsEmailTemplate(
        "Hello {{firstName}}, your team is {{team}}.",
        sample,
      ),
    ).toBe("Hello Alex, your team is Men's Division 2.");
  });

  it("splits body into email paragraphs", () => {
    expect(bodyToEmailParagraphs("Line one\n\nLine two")).toEqual([
      "Line one",
      "Line two",
    ]);
  });
});
