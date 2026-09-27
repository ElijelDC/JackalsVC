export type CoachCoverageReminderPhase =
  | "head"
  | "cover"
  | "none_head_accepted"
  | "none_cover_accepted"
  | "none_no_head"
  | "none_all_set";

export type CoachCoverageReminderPreview = {
  phase: CoachCoverageReminderPhase;
  canSend: boolean;
  buttonLabel: string;
  description: string;
  recipientNames: string[];
  headCoachName: string | null;
  cooldown: {
    canSend: boolean;
    lastSentAt: string | null;
    nextAvailableAt: string | null;
  };
};
