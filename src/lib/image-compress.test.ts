import { describe, expect, it } from "vitest";
import { PRESET_SETTINGS } from "@/lib/image-storage-presets";
import { mimeFromFilename } from "@/lib/image-upload-types";

describe("image-compress", () => {
  it("maps filenames to MIME types", () => {
    expect(mimeFromFilename("photo.jpg")).toBe("image/jpeg");
    expect(mimeFromFilename("photo.jpeg")).toBe("image/jpeg");
    expect(mimeFromFilename("photo.png")).toBe("image/png");
    expect(mimeFromFilename("photo.webp")).toBe("image/webp");
    expect(mimeFromFilename("photo.heic")).toBe("image/heic");
    expect(mimeFromFilename("photo.gif")).toBe("image/gif");
  });

  it("keeps conservative preset settings", () => {
    expect(PRESET_SETTINGS.gallery.jpegQuality).toBeGreaterThanOrEqual(85);
    expect(PRESET_SETTINGS.profile.jpegQuality).toBeGreaterThanOrEqual(
      PRESET_SETTINGS.gallery.jpegQuality,
    );
    expect(PRESET_SETTINGS.gallery.maxEdge).toBeGreaterThan(2000);
  });
});
