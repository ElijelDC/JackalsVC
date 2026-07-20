/** Shared image size/quality targets — safe for client and server. */

export type ImageStoragePreset = "gallery" | "profile" | "document";

export const PRESET_SETTINGS = {
  /** Full-screen gallery lightbox — cap pixel count, keep detail. */
  gallery: { maxEdge: 2560, jpegQuality: 88, webpQuality: 90 },
  /** Faces and avatars — slightly higher quality, moderate max size. */
  profile: { maxEdge: 1600, jpegQuality: 90, webpQuality: 92 },
  /** Payment proofs, IDs — preserve text legibility. */
  document: { maxEdge: 2400, jpegQuality: 90, webpQuality: 92 },
} as const;
