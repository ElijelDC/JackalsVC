import { describe, expect, it } from "vitest";
import {
  applyMembershipCreditToAmounts,
  roundEur,
} from "@/lib/membership-credit-config";

describe("applyMembershipCreditToAmounts", () => {
  it("reduces the next unpaid instalment first", () => {
    const result = applyMembershipCreditToAmounts([105, 105], 35);
    expect(result.amounts).toEqual([70, 105]);
    expect(result.appliedEur).toBe(35);
  });

  it("spills leftover credit onto later instalments", () => {
    const result = applyMembershipCreditToAmounts([20, 105], 35);
    expect(result.amounts).toEqual([0, 90]);
    expect(result.appliedEur).toBe(35);
  });

  it("does not apply more than available amounts", () => {
    const result = applyMembershipCreditToAmounts([10, 5], 35);
    expect(result.amounts).toEqual([0, 0]);
    expect(result.appliedEur).toBe(15);
  });

  it("ignores zero or negative credit", () => {
    expect(applyMembershipCreditToAmounts([120, 120], 0)).toEqual({
      amounts: [120, 120],
      appliedEur: 0,
    });
    expect(applyMembershipCreditToAmounts([120], -5)).toEqual({
      amounts: [120],
      appliedEur: 0,
    });
  });

  it("rounds euro amounts to cents", () => {
    expect(roundEur(10.005)).toBe(10.01);
    const result = applyMembershipCreditToAmounts([100.1], 0.05);
    expect(result.amounts[0]).toBe(100.05);
  });
});
