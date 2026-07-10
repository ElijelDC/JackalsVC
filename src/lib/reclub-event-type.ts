export type ReclubInferredEventType =
  | "TOURNAMENT"
  | "SKILLS_CLINIC"
  | "SOCIAL"
  | "FUN";

const TOURNAMENT_PATTERN =
  /\b(tournaments?|championships?|round\s*robin|cup\s*&\s*shield|beach\s+2v2|2v2\s+beach|\d+v\d+\s+beach)\b/i;

const SKILLS_CLINIC_PATTERN =
  /\b(skills?\s+clinics?|skill\s+clinics?|skills?\s+workshops?|coaching\s+clinics?|clinics?\b|workshops?\b)\b/i;

const SOCIAL_PATTERN =
  /\b(socials?|club\s+nights?|end\s+of\s+season|parties|party|pub\s+nights?|pizza\s+nights?|awards?\s+nights?)\b/i;

const FUN_PATTERN =
  /\b(fun\s+sessions?|open\s+sessions?|mixed\s+(?:fun\s+)?sessions?|fun\s+play|drop[- ]?ins?|open\s+play|(?:beginner|intermediate|advanced)\s+fun)\b/i;

function matches(pattern: RegExp, value: string) {
  return pattern.test(value);
}

/**
 * Infer browse/calendar type for a Reclub meet from its title and notes.
 * Checks the title first so explicit "fun session" titles are not overridden
 * by incidental words in the description.
 */
export function inferReclubEventType(event: {
  title: string;
  description?: string | null;
}): ReclubInferredEventType {
  const title = event.title.trim();
  const text = `${event.title} ${event.description ?? ""}`.trim();

  if (matches(TOURNAMENT_PATTERN, title) || matches(TOURNAMENT_PATTERN, text)) {
    return "TOURNAMENT";
  }

  if (matches(FUN_PATTERN, title)) {
    return "FUN";
  }

  if (
    matches(SKILLS_CLINIC_PATTERN, title) ||
    matches(SKILLS_CLINIC_PATTERN, text)
  ) {
    return "SKILLS_CLINIC";
  }

  if (matches(SOCIAL_PATTERN, title) || matches(SOCIAL_PATTERN, text)) {
    return "SOCIAL";
  }

  if (matches(FUN_PATTERN, text)) {
    return "FUN";
  }

  return "FUN";
}
