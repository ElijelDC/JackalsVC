import { describe, expect, it } from "vitest";
import {
  assessInstallmentPaymentState,
  assessMembershipPaymentAccess,
} from "@/lib/membership-overdue";

describe("assessMembershipPaymentAccess arrears", () => {
  const unpaidPastGrace = [
    {
      status: "PENDING",
      dueDate: new Date("2026-01-01"),
      amount: 100,
      installmentNumber: 1,
    },
  ];

  it("blocks training access for ARREARS without override", () => {
    const access = assessMembershipPaymentAccess({
      membershipStatus: "ARREARS",
      paymentSchedule: "INSTALLMENTS",
      paymentOverdueOverride: false,
      payments: unpaidPastGrace,
      now: new Date("2026-02-01"),
    });
    expect(access.canAccessTrainingAndMatches).toBe(false);
    expect(access.isOverdue).toBe(true);
  });

  it("allows training access for ARREARS with active override", () => {
    const access = assessMembershipPaymentAccess({
      membershipStatus: "ARREARS",
      paymentSchedule: "INSTALLMENTS",
      paymentOverdueOverride: true,
      paymentOverdueOverrideUntil: "2026-03-01",
      payments: unpaidPastGrace,
      now: new Date("2026-02-01"),
    });
    expect(access.canAccessTrainingAndMatches).toBe(true);
    expect(access.hasOverride).toBe(true);
  });

  it("marks ACTIVE memberships overdue after grace", () => {
    const installment = assessInstallmentPaymentState({
      paymentSchedule: "INSTALLMENTS",
      payments: unpaidPastGrace,
      now: new Date("2026-02-01"),
    });
    expect(installment.isOverdue).toBe(true);

    const access = assessMembershipPaymentAccess({
      membershipStatus: "ACTIVE",
      paymentSchedule: "INSTALLMENTS",
      paymentOverdueOverride: false,
      payments: unpaidPastGrace,
      now: new Date("2026-02-01"),
    });
    expect(access.canAccessTrainingAndMatches).toBe(false);
    expect(access.isOverdue).toBe(true);
  });
});
