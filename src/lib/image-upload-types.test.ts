import { describe, expect, it } from "vitest";
import {
  DOCUMENT_SCREENSHOT_SIZE_ERROR,
  IMAGE_UPLOAD_TYPE_ERROR,
  isAcceptedImageFile,
  isHeicFilename,
  validateImageFile,
} from "@/lib/image-upload-types";

describe("image-upload-types", () => {
  it("detects HEIC filenames", () => {
    expect(isHeicFilename("photo.heic")).toBe(true);
    expect(isHeicFilename("photo.HEIF")).toBe(true);
    expect(isHeicFilename("photo.jpg")).toBe(false);
  });

  it("accepts HEIC files without MIME type", () => {
    const file = { name: "iphone.heic", type: "" };
    expect(isAcceptedImageFile(file)).toBe(true);
  });

  it("rejects unsupported files", () => {
    const file = { name: "notes.txt", type: "text/plain", size: 100 };
    expect(validateImageFile(file, { maxBytes: 1000, sizeError: "too big" })).toBe(
      IMAGE_UPLOAD_TYPE_ERROR,
    );
  });

  it("enforces max upload size", () => {
    const file = { name: "big.jpg", type: "image/jpeg", size: 6 * 1024 * 1024 };
    expect(
      validateImageFile(file, {
        maxBytes: 5 * 1024 * 1024,
        sizeError: DOCUMENT_SCREENSHOT_SIZE_ERROR,
      }),
    ).toBe(DOCUMENT_SCREENSHOT_SIZE_ERROR);
  });
});
