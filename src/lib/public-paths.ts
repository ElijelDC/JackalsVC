/** Centralised public URL paths — keep upload folders under /uploads/. */
export const PUBLIC_PATHS = {
  brand: {
    logo: "/brand/logo.png",
    logoTransparent: "/brand/logo-transparent.png",
    favicon: "/brand/favicon.png",
  },
  uploads: {
    paymentProofs: "/uploads/payment-proofs",
    gallery: "/uploads/gallery",
    achievements: "/uploads/achievements",
    profileImages: "/uploads/profile-images",
    vlyMembershipPhotos: "/uploads/vly-membership-photos",
    coachInvoices: "/uploads/coach-invoices",
    tournamentDocs: "/uploads/tournament-docs",
  },
  downloads: {
    sponsorPresentation: "/downloads/jackals-vc-sponsor-presentation.pdf",
    beachTournamentRules:
      "/downloads/jvc-mixed-beach-2v2-tournament-rules.pdf",
  },
} as const;

export function galleryImageUrl(albumId: string, filename: string) {
  return `${PUBLIC_PATHS.uploads.gallery}/${albumId}/${filename}`;
}

export function paymentProofUrl(filename: string) {
  return `${PUBLIC_PATHS.uploads.paymentProofs}/${filename}`;
}

/** Legacy gallery URLs stored before uploads/gallery migration. */
export function isLegacyGalleryUrl(url: string) {
  return url.startsWith("/gallery/") && !url.startsWith(PUBLIC_PATHS.uploads.gallery);
}

export function normalizeGalleryUrl(url: string) {
  if (!isLegacyGalleryUrl(url)) return url;
  return url.replace(/^\/gallery\//, `${PUBLIC_PATHS.uploads.gallery}/`);
}

export function normalizeAchievementUrl(url: string) {
  if (!url.startsWith("/achievements/")) return url;
  return url.replace(/^\/achievements\//, `${PUBLIC_PATHS.uploads.achievements}/`);
}

export function normalizePublicAssetUrl(url: string) {
  return normalizeAchievementUrl(normalizeGalleryUrl(url));
}
