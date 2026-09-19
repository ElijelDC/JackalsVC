import { describe, expect, it } from "vitest";
import {
  buildMembershipLeagueTiers,
  buildMembershipPublicPaymentOptions,
} from "@/lib/membership-config";

describe("buildMembershipPublicPaymentOptions", () => {
  it("uses admin instalment amounts for adult and student plans", () => {
    const options = buildMembershipPublicPaymentOptions([
      {
        name: "Adult",
        price: 360,
        durationMonths: 7,
        installment1Eur: 120,
        installment2Eur: 120,
        installment3Eur: 120,
      },
      {
        name: "Student / U18",
        price: 315,
        durationMonths: 7,
        installment1Eur: 105,
        installment2Eur: 105,
        installment3Eur: 105,
      },
    ]);

    const instalments = options.find((option) => option.id === "installments");
    expect(instalments?.description).toContain("Adult €120 + €120 + €120");
    expect(instalments?.description).toContain("Student/U18 €105 + €105 + €105");
  });

  it("uses admin plan prices on league tier cards", () => {
    const tiers = buildMembershipLeagueTiers([
      { name: "Adult", price: 400 },
      { name: "Student / U18", price: 340 },
    ]);

    expect(tiers[0]?.adultFee).toBe(400);
    expect(tiers[0]?.studentFee).toBe(340);
  });
});
