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
};

/**
 * Priority for club overseers: coach UI on every squad, excluded from duty /
 * cover / attendance coach lists. Lower numbers rank higher (0 = head).
 */
export const COACH_OVERSEER_PRIORITY = 999;

export function isCoachOverseerPriority(priority: number) {
  return priority >= COACH_OVERSEER_PRIORITY;
}
