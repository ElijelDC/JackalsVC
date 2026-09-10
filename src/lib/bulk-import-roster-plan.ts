import { normalizeVlyNumber } from "@/lib/vly-number";

export function rosterFingerprint(vlyNumber: string): string {
  return normalizeVlyNumber(vlyNumber);
}

/** Members that would be removed by a roster override (never includes VLY-less rows). */
export function planRosterRemovals(
  existing: Array<{ id: string; vlyNumber: string | null }>,
  desiredFingerprints: Set<string>,
) {
  return existing.filter((member) => {
    const fingerprint = member.vlyNumber?.trim()
      ? rosterFingerprint(member.vlyNumber)
      : null;
    if (!fingerprint) return false;
    return !desiredFingerprints.has(fingerprint);
  });
}
