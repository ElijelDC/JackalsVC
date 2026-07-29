export type CoachUnansweredItemKind = "training" | "match";

export type UnansweredPlayer = {
  userId: string;
  name: string;
  email: string;
};

export type CoachUnansweredItem = {
  kind: CoachUnansweredItemKind;
  id: string;
  title: string;
  teamName?: string | null;
  teamKey?: string | null;
  startDate: string;
  location: string | null;
  players: UnansweredPlayer[];
  reminder?: CoachReminderStatus;
};

export type CoachReminderStatus = {
  canSend: boolean;
  lastSentAt: string | null;
  nextAvailableAt: string | null;
};

export function getCoachUnansweredItemUrl(item: {
  kind: CoachUnansweredItemKind;
  id: string;
}) {
  return item.kind === "training"
    ? `/training/session/${item.id}`
    : `/matches/${item.id}`;
}
