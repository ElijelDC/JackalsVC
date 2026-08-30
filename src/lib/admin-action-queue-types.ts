export type AdminActionQueueEntry = {
  kind:
    | "registration"
    | "payment"
    | "kit-payment"
    | "merchandise-payment"
    | "coach-payment"
    | "coaching-application"
    | "trials-application"
    | "trial-session-signup";
  href: string;
  title: string;
  summary: string;
  count: number;
  urgentCount?: number;
  previews: string[];
};

export type AdminActionQueue = {
  entries: AdminActionQueueEntry[];
  totalCount: number;
  badgeCounts: Record<string, number>;
};
