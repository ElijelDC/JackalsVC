import { describe, expect, it } from "vitest";
import {
  resolveStudentIdReviewStatus,
  studentMembershipNeedsIdProof,
} from "@/lib/student-id-proof";

describe("studentMembershipNeedsIdProof", () => {
  it("requires proof for Student/U18 until approved", () => {
    expect(
      studentMembershipNeedsIdProof({
        planName: "Student / U18",
        studentIdReviewStatus: null,
      }),
    ).toBe(true);
    expect(
      studentMembershipNeedsIdProof({
        planName: "Student / U18",
        studentIdReviewStatus: "AWAITING_PROOF",
      }),
    ).toBe(true);
    expect(
      studentMembershipNeedsIdProof({
        planName: "Student / U18",
        studentIdReviewStatus: "PENDING",
      }),
    ).toBe(true);
    expect(
      studentMembershipNeedsIdProof({
        planName: "Student / U18",
        studentIdReviewStatus: "APPROVED",
      }),
    ).toBe(false);
  });

  it("does not require proof for Adult plans", () => {
    expect(
      studentMembershipNeedsIdProof({
        planName: "Adult",
        studentIdReviewStatus: null,
      }),
    ).toBe(false);
  });
});

describe("resolveStudentIdReviewStatus", () => {
  it("maps legacy null Student/U18 without proof to AWAITING_PROOF", () => {
    expect(
      resolveStudentIdReviewStatus({
        planName: "Student / U18",
        studentIdReviewStatus: null,
        studentIdProofUrl: null,
      }),
    ).toBe("AWAITING_PROOF");
  });

  it("maps legacy null Student/U18 with proof to PENDING", () => {
    expect(
      resolveStudentIdReviewStatus({
        planName: "Student / U18",
        studentIdReviewStatus: null,
        studentIdProofUrl: "/uploads/student-id-proofs/x.jpg",
      }),
    ).toBe("PENDING");
  });

  it("returns null for adult plans", () => {
    expect(
      resolveStudentIdReviewStatus({
        planName: "Adult",
        studentIdReviewStatus: null,
        studentIdProofUrl: null,
      }),
    ).toBeNull();
  });
});
