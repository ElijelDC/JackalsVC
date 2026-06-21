export type TrainingSessionCardData = {
  id: string;
  title: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string;
  level: string;
  description: string | null;
  coach: string | null;
  recurring: boolean;
  recurrenceWeeks: number;
  recurringFrom: Date | null;
  recurringTo: Date | null;
  sessionDate: Date | null;
};
