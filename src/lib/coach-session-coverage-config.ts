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
