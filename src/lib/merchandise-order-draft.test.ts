import { describe, expect, it } from "vitest";
import {
  merchandiseOrderDraftHasContent,
  parseMerchandiseOrderDraft,
} from "@/lib/merchandise-order-draft";

const draft = {
  version: 1,
  gender: "women",
  firstName: "Alex",
  lastName: "Murphy",
  email: "alex@example.com",
  phoneNumber: "0871234567",
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

describe("merchandise order draft", () => {
  it("restores selected items and drops sizes for unselected items", () => {
    const parsed = parseMerchandiseOrderDraft(draft);
    expect(parsed).toMatchObject({
      gender: "women",
      trainingTshirt: true,
      trainingTshirtSize: "M",
      trainingTop: false,
      trainingTopSize: "",
      jacketFullZip: true,
      jacketFullZipSize: "S",
    });
    expect(merchandiseOrderDraftHasContent(parsed!)).toBe(true);
  });

  it("rejects unknown draft versions", () => {
    expect(parseMerchandiseOrderDraft({ ...draft, version: 2 })).toBeNull();
  });
});
