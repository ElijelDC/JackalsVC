import { describe, expect, it } from "vitest";
import {
  kitOrderDraftHasContent,
  parseKitOrderDraft,
} from "@/lib/kit-order-draft";

const draft = {
  version: 1,
  gender: "women" as const,
  kitType: "libero" as const,
  jerseySize: "M",
  shortsSize: "S",
  firstName: "Alex",
  lastName: "O'Brien",
  email: "alex@example.com",
  phoneNumber: "0871234567",
  preferredKitNumber1: "7",
  preferredKitNumber2: "17",
  trainingTshirt: true,
  trainingTshirtSize: "M",
  trainingTop: false,
  trainingTopSize: "L",
  jacketHoodie: false,
  jacketHoodieSize: "",
  jacketHighCollar: false,
  jacketHighCollarSize: "",
  jacketFullZip: true,
  jacketFullZipSize: "S",
};

describe("kit order draft", () => {
  it("restores a valid saved order", () => {
    const parsed = parseKitOrderDraft(draft);
    expect(parsed).toMatchObject({
      gender: "women",
      kitType: "libero",
      jerseySize: "M",
      trainingTshirt: true,
      trainingTshirtSize: "M",
      trainingTop: false,
      trainingTopSize: "",
      jacketFullZip: true,
      jacketFullZipSize: "S",
    });
    expect(kitOrderDraftHasContent(parsed!)).toBe(true);
  });

  it("drops an invalid kit type and women's 3XS size", () => {
    const parsed = parseKitOrderDraft({
      ...draft,
      kitType: "home",
      jerseySize: "3XS",
    });
    expect(parsed?.kitType).toBeNull();
    expect(parsed?.jerseySize).toBe("");
  });

  it("treats an untouched men's form as empty", () => {
    expect(
      kitOrderDraftHasContent({
        ...draft,
        gender: "men",
        kitType: null,
        jerseySize: "",
        shortsSize: "",
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        preferredKitNumber1: "",
        preferredKitNumber2: "",
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
      }),
    ).toBe(false);
  });
});
