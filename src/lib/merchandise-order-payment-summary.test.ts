import { describe, expect, it } from "vitest";
import {
  buildMerchandiseOrderPaymentEmailDetails,
  buildMerchandiseOrderPaymentQuote,
  buildMerchandiseOrderPaymentReference,
} from "@/lib/merchandise-order-payment-summary";
import type { MerchandiseOrderRecord } from "@/lib/merchandise-order-response-config";

const order: MerchandiseOrderRecord = {
  id: "merch-1",
  firstName: "Alex",
  lastName: "Murphy",
  email: "alex@example.com",
  phoneNumber: "0871234567",
  gender: "men",
  genderLabel: "Men's",
  trainingTshirt: true,
  trainingTshirtSize: "M",
  trainingTop: true,
  trainingTopSize: "L",
  jacketHoodie: false,
  jacketHoodieSize: "",
  jacketHighCollar: false,
  jacketHighCollarSize: "",
  jacketFullZip: false,
  jacketFullZipSize: "",
  freeLineItemIds: [],
  paymentToken: "token",
  paymentStatus: "AWAITING",
  proofScreenshotUrl: null,
  proofSubmittedAt: null,
  paymentEmailSentAt: null,
  createdAt: "2026-08-29T12:00:00.000Z",
};

describe("merchandise payment summary", () => {
  it("builds the merch reference and total", () => {
    expect(buildMerchandiseOrderPaymentReference(order)).toBe(
      "Alex Murphy · Merch 26/27",
    );
    expect(buildMerchandiseOrderPaymentQuote(order).totalEur).toBe(40);
  });

  it("applies free items in email details", () => {
    const waived = { ...order, freeLineItemIds: ["quarter-zip"] };
    expect(buildMerchandiseOrderPaymentQuote(waived).totalEur).toBe(15);
    expect(
      buildMerchandiseOrderPaymentEmailDetails(waived).some(
        (detail) => detail.label === "Quarter zip" && detail.value.startsWith("Free"),
      ),
    ).toBe(true);
  });
});
