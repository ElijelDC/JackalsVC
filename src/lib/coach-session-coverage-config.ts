export type CoachResponseGate =
  | { kind: "waiting_for_head"; headCoachName: string }
  | { kind: "head_accepted"; headCoachName: string };

export type SquadCoach = {
  clubMemberId: string;
  userId: string;
  name: string;
  email: string;
  priority: number;
  isHeadCoach: boolean;
  isAssistantCoach: boolean;
};

/**
 * Priority for assistant coaches: can attend alongside the head and are paid
 * the assistant session rate. Lower numbers rank higher (0 = head).
 */
export const COACH_ASSISTANT_PRIORITY = 50;

/**
 * Priority for cover coaches: respond only after the head declines; exclusive
 * with other covers.
 */
export const COACH_COVER_PRIORITY = 100;

/**
 * Priority for club overseers: coach UI on every squad, excluded from duty /
 * cover / attendance coach lists. Lower numbers rank higher (0 = head).
 */
export const COACH_OVERSEER_PRIORITY = 999;

export function isCoachAssistantPriority(priority: number) {
  return priority > 0 && priority < COACH_COVER_PRIORITY;
}

export function isCoachCoverPriority(priority: number) {
  return priority >= COACH_COVER_PRIORITY && priority < COACH_OVERSEER_PRIORITY;
}

export function isCoachOverseerPriority(priority: number) {
  return priority >= COACH_OVERSEER_PRIORITY;
}
