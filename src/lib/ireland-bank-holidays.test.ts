import { describe, expect, it } from "vitest";
import {
  easterSunday,
  irishBankHolidaysForYear,
  isIrishBankHoliday,
} from "@/lib/ireland-bank-holidays";

describe("irishBankHolidaysForYear", () => {
  it("includes October bank holiday 2026 (last Monday = 26 Oct)", () => {
    const holidays = irishBankHolidaysForYear(2026);
    expect(holidays).toContain("2026-10-26");
    expect(isIrishBankHoliday(new Date("2026-10-26T12:00:00.000Z"))).toBe(
      true,
    );
  });

  it("includes Easter Monday 2027", () => {
    const easter = easterSunday(2027);
    expect(easter).toEqual({ year: 2027, month: 3, day: 28 });
    expect(irishBankHolidaysForYear(2027)).toContain("2027-03-29");
  });

  it("does not treat a normal Monday as a holiday", () => {
    expect(isIrishBankHoliday(new Date("2026-10-19T12:00:00.000Z"))).toBe(
      false,
    );
  });
});
