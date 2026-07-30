import type { TrainingAttendanceStatus } from "@/lib/training-attendance-config";

export type DashboardClubEvent = {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  type: string;
  location: string | null;
  coach?: string | null;
  trainingSessionId?: string | null;
};

export type DashboardScheduleItem = {
  id: string;
  title: string;
  teamName?: string | null;
  startDate: string;
  location: string | null;
  userStatus: TrainingAttendanceStatus;
};

export type CoachScheduleItem = DashboardScheduleItem & {
  teamKey?: string | null;
};
