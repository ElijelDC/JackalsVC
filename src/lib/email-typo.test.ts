import { describe, expect, it } from "vitest";
import { emailTypoError, suggestEmailCorrection } from "@/lib/email-typo";

describe("email typo checks", () => {
  it("suggests fixes for common domain typos", () => {
    expect(suggestEmailCorrection("alex@gnail.com")).toBe("alex@gmail.com");
    expect(suggestEmailCorrection("alex@gmail.con")).toBe("alex@gmail.com");
    expect(suggestEmailCorrection("alex@hotmail.con")).toBe("alex@hotmail.com");
    expect(suggestEmailCorrection("Alex@Yahoo.CON")).toBe("alex@yahoo.com");
  });

  it("leaves valid emails alone", () => {
    expect(suggestEmailCorrection("alex@gmail.com")).toBeNull();
    expect(emailTypoError("alex@outlook.com")).toBeNull();
  });

  it("returns a clear error message", () => {
    expect(emailTypoError("alex@gnail.com")).toMatch(/did you mean alex@gmail\.com/);
  });
});
