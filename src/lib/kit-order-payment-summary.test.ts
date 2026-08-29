import { describe, expect, it } from "vitest";
import {
  buildKitOrderPaymentEmailDetails,
  buildKitOrderPaymentQuote,
  buildKitOrderPaymentReference,
} from "@/lib/kit-order-payment-summary";
import type { KitOrderRecord } from "@/lib/kit-order-response-config";

function sampleOrder(overrides: Partial<KitOrderRecord> = {}): KitOrderRecord {
  return {
    id: "order-1",
    firstName: "Alex",
    lastName: "Murphy",
    email: "alex@example.com",
    phoneNumber: "0831234567",
    gender: "men",
    genderLabel: "Men's",
    kitType: "player",
    kitTypeLabel: "Player kit",
    kitPiecesLabel: "Player jersey, Player shorts",
    kitSize: "M",
    playerJersey: true,
    playerShorts: true,
    liberoJersey: false,
    liberoShorts: false,
    jerseySize: "M",
    shortsSize: "M",
    preferredKitNumber1: 7,
    preferredKitNumber2: 11,
    trainingTshirt: true,
    trainingTshirtSize: "M",
    trainingTop: false,
    trainingTopSize: "",
    jacketHoodie: false,
    jacketHoodieSize: "",
    jacketHighCollar: false,
    jacketHighCollarSize: "",
    jacketFullZip: false,
    jacketFullZipSize: "",
    freeLineItemIds: [],
    paymentToken: "tok_test",
    paymentStatus: "UNPAID",
    proofScreenshotUrl: null,
    proofSubmittedAt: null,
    paymentEmailSentAt: null,
    createdAt: "2026-08-20T12:00:00.000Z",
    ...overrides,
  };
}

describe("buildKitOrderPaymentReference", () => {
  it("includes the member name and season label", () => {
    expect(buildKitOrderPaymentReference(sampleOrder())).toBe(
      "Alex Murphy · Kit 26/27",
    );
  });
});

describe("buildKitOrderPaymentQuote", () => {
  it("totals kit and optional merch", () => {
    const quote = buildKitOrderPaymentQuote(sampleOrder());
    expect(quote.totalEur).toBe(60);
    expect(quote.items.map((item) => item.label)).toEqual([
      "Player kit",
      "Training t-shirt",
    ]);
  });

  it("charges for both kits when selected", () => {
    const quote = buildKitOrderPaymentQuote(
      sampleOrder({
        kitType: "both",
        kitTypeLabel: "Both kits",
        liberoJersey: true,
        liberoShorts: true,
        trainingTshirt: false,
        trainingTshirtSize: "",
      }),
    );
    expect(quote.totalEur).toBe(90);
  });

  it("zeroes waived line items for payment emails", () => {
    const quote = buildKitOrderPaymentQuote(
      sampleOrder({ freeLineItemIds: ["training-tshirt"] }),
    );
    expect(quote.totalEur).toBe(45);
    expect(
      quote.items.find((item) => item.id === "training-tshirt")?.amountEur,
    ).toBe(0);
  });
});

describe("buildKitOrderPaymentEmailDetails", () => {
  it("includes order lines and kit details", () => {
    const details = buildKitOrderPaymentEmailDetails(sampleOrder());
    expect(details.some((row) => row.label === "Total due" && row.value === "€60")).toBe(
      true,
    );
    expect(details.some((row) => row.label === "Jersey back" && row.value === "MURPHY")).toBe(
      true,
    );
    expect(details.some((row) => row.label === "Kit numbers")).toBe(false);
  });
});
