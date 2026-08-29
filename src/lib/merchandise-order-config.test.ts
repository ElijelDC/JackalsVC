import { describe, expect, it } from "vitest";
import {
  hasAnyMerchandiseItem,
  merchandiseOrderQuote,
} from "@/lib/merchandise-order-config";
import { merchandiseOrderSchema } from "@/lib/validations";

const items = {
  trainingTshirt: true,
  trainingTshirtSize: "M",
  trainingTop: true,
  trainingTopSize: "L",
  jacketHoodie: false,
  jacketHoodieSize: "",
  jacketHighCollar: false,
  jacketHighCollarSize: "",
  jacketFullZip: true,
  jacketFullZipSize: "S",
};

describe("merchandise order config", () => {
  it("prices t-shirts at €15 and jackets at €25", () => {
    const quote = merchandiseOrderQuote(items);
    expect(quote.totalEur).toBe(65);
    expect(quote.items.map((item) => item.id)).toEqual([
      "training-tshirt",
      "quarter-zip",
      "full-zip",
    ]);
  });

  it("requires an item and valid selected sizes", () => {
    expect(hasAnyMerchandiseItem(items)).toBe(true);
    expect(
      merchandiseOrderSchema.safeParse({
        firstName: "Alex",
        lastName: "Murphy",
        email: "alex@example.com",
        phoneNumber: "0871234567",
        gender: "men",
        ...items,
      }).success,
    ).toBe(true);
    expect(
      merchandiseOrderSchema.safeParse({
        firstName: "Alex",
        lastName: "Murphy",
        email: "alex@example.com",
        phoneNumber: "0871234567",
        gender: "men",
        ...Object.fromEntries(
          Object.entries(items).map(([key, value]) => [
            key,
            typeof value === "boolean" ? false : "",
          ]),
        ),
      }).success,
    ).toBe(false);
  });
});
