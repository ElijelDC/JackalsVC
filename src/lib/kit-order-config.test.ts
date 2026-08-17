import { describe, expect, it } from "vitest";
import {
  hasAnyKitPiece,
  isValidKitOrderSize,
  jerseyBackName,
  KIT_ORDER_JACKET_SIZE_CHART,
  KIT_ORDER_TSHIRT_SIZE_CHART,
  kitOrderGenderLabel,
  kitOrderKitTypeLabel,
  kitOrderPhotosFor,
  kitOrderPhotosForGender,
  kitOrderPiecesLabel,
  kitOrderQuote,
  kitOrderSizesForGender,
  piecesFromKitSelection,
  summarizeKitType,
} from "@/lib/kit-order-config";
import { kitOrderSchema } from "@/lib/validations";

const validOrder = {
  firstName: "Alex",
  lastName: "O'Brien",
  email: "alex@example.com",
  phoneNumber: "0871234567",
  gender: "men" as const,
  playerJersey: true,
  playerShorts: true,
  liberoJersey: false,
  liberoShorts: false,
  jerseySize: "M",
  shortsSize: "L",
  preferredKitNumber1: 7,
  preferredKitNumber2: 17,
  trainingTshirt: false,
  trainingTshirtSize: "",
  trainingTop: false,
  trainingTopSize: "",
  jacketHoodie: false,
  jacketHoodieSize: "",
  jacketHighCollar: false,
  jacketHighCollarSize: "",
  jacketFullZip: false,
  jacketFullZipSize: "",
};

describe("kit order config", () => {
  it("uses men's sizes including 3XS and 2XS", () => {
    expect(kitOrderSizesForGender("men")).toContain("3XS");
    expect(isValidKitOrderSize("men", "3XS")).toBe(true);
    expect(isValidKitOrderSize("women", "3XS")).toBe(false);
  });

  it("has matching t-shirt and jacket size-chart columns", () => {
    for (const row of KIT_ORDER_TSHIRT_SIZE_CHART.rows) {
      expect(row.values).toHaveLength(KIT_ORDER_TSHIRT_SIZE_CHART.sizes.length);
    }
    for (const row of KIT_ORDER_JACKET_SIZE_CHART.rows) {
      expect(row.values).toHaveLength(KIT_ORDER_JACKET_SIZE_CHART.sizes.length);
    }
  });

  it("prints the jersey last name in uppercase", () => {
    expect(jerseyBackName("  o'brien ")).toBe("O'BRIEN");
  });

  it("returns the matching kit photos for gender and type", () => {
    const photos = kitOrderPhotosFor("women", "libero");
    expect(photos).toHaveLength(1);
    expect(photos[0]?.id).toBe("womens-kit-libero");
    expect(kitOrderPhotosForGender("men")).toHaveLength(2);
    expect(kitOrderPhotosFor("men", "both")).toHaveLength(2);
  });

  it("labels gender, kit type, and pieces", () => {
    expect(kitOrderGenderLabel("women")).toBe("Women's");
    expect(kitOrderKitTypeLabel("both")).toBe("Both kits");
    expect(
      kitOrderPiecesLabel({
        playerJersey: true,
        playerShorts: false,
        liberoJersey: false,
        liberoShorts: true,
      }),
    ).toBe("Player jersey, Libero shorts");
    expect(
      summarizeKitType({
        playerJersey: true,
        playerShorts: false,
        liberoJersey: true,
        liberoShorts: false,
      }),
    ).toBe("both");
    expect(
      hasAnyKitPiece({
        playerJersey: false,
        playerShorts: false,
        liberoJersey: false,
        liberoShorts: false,
      }),
    ).toBe(false);
  });

  it("maps kit type and piece mode onto jersey/shorts flags", () => {
    expect(piecesFromKitSelection("player", "full")).toEqual({
      playerJersey: true,
      playerShorts: true,
      liberoJersey: false,
      liberoShorts: false,
    });
    expect(piecesFromKitSelection("libero", "jersey")).toEqual({
      playerJersey: false,
      playerShorts: false,
      liberoJersey: true,
      liberoShorts: false,
    });
    expect(piecesFromKitSelection("both", "shorts")).toEqual({
      playerJersey: false,
      playerShorts: true,
      liberoJersey: false,
      liberoShorts: true,
    });
  });

  it("prices one kit, both kits, and optional extras", () => {
    expect(
      kitOrderQuote({
        kitType: "player",
        jerseySize: "M",
        shortsSize: "M",
        trainingTshirt: false,
        trainingTshirtSize: "",
        trainingTop: false,
        trainingTopSize: "",
        jacketHoodie: false,
        jacketHoodieSize: "",
        jacketHighCollar: false,
        jacketHighCollarSize: "",
        jacketFullZip: false,
        jacketFullZipSize: "",
      }).totalEur,
    ).toBe(45);

    const bothWithExtras = kitOrderQuote({
      kitType: "both",
      jerseySize: "M",
      shortsSize: "L",
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
    });
    expect(bothWithExtras.items.map((item) => item.id)).toEqual([
      "match-kit",
      "training-tshirt",
      "quarter-zip",
    ]);
    expect(bothWithExtras.totalEur).toBe(130);
    expect(bothWithExtras.items[0]?.details).toEqual([
      "Jersey size M",
      "Shorts size L",
    ]);
  });
});

describe("kitOrderSchema", () => {
  it("accepts a kit-only order with separate jersey and shorts sizes", () => {
    const parsed = kitOrderSchema.safeParse(validOrder);
    expect(parsed.success).toBe(true);
  });

  it("requires at least one jersey or shorts piece", () => {
    const parsed = kitOrderSchema.safeParse({
      ...validOrder,
      playerJersey: false,
      playerShorts: false,
    });
    expect(parsed.success).toBe(false);
  });

  it("requires a phone number", () => {
    const parsed = kitOrderSchema.safeParse({
      ...validOrder,
      phoneNumber: "",
    });
    expect(parsed.success).toBe(false);
  });

  it("requires distinct kit numbers", () => {
    const parsed = kitOrderSchema.safeParse({
      ...validOrder,
      preferredKitNumber2: 7,
    });
    expect(parsed.success).toBe(false);
  });

  it("requires a size when a training top is added", () => {
    const parsed = kitOrderSchema.safeParse({
      ...validOrder,
      trainingTop: true,
      trainingTopSize: "",
    });
    expect(parsed.success).toBe(false);
  });

  it("requires a size when a training t-shirt is added", () => {
    const parsed = kitOrderSchema.safeParse({
      ...validOrder,
      trainingTshirt: true,
      trainingTshirtSize: "",
    });
    expect(parsed.success).toBe(false);
  });

  it("requires a size when the full zip is added", () => {
    const parsed = kitOrderSchema.safeParse({
      ...validOrder,
      jacketFullZip: true,
      jacketFullZipSize: "",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects a women's 3XS jersey size", () => {
    const parsed = kitOrderSchema.safeParse({
      ...validOrder,
      gender: "women",
      jerseySize: "3XS",
    });
    expect(parsed.success).toBe(false);
  });

  it("allows shorts only without a jersey size", () => {
    const parsed = kitOrderSchema.safeParse({
      ...validOrder,
      playerJersey: false,
      playerShorts: true,
      jerseySize: "",
      shortsSize: "M",
    });
    expect(parsed.success).toBe(true);
  });
});
