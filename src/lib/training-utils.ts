export function formatRecurrenceLabel(session: {
  recurring: boolean;
  dayOfWeek: number;
  recurrenceWeeks: number;
  sessionDate: Date | null;
  recurringFrom?: Date | null;
  recurringTo?: Date | null;
}) {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const fmt = (date: Date) =>
    date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  if (!session.recurring) {
    return session.sessionDate
      ? `One-off · ${fmt(session.sessionDate)}`
      : "One-off";
  }

  const day = days[session.dayOfWeek];
  const interval =
    session.recurrenceWeeks === 1
      ? `Every ${day}`
      : session.recurrenceWeeks === 2
        ? `Every 2 weeks on ${day}`
        : session.recurrenceWeeks === 4
          ? `Every 4 weeks on ${day}`
          : `Every ${session.recurrenceWeeks} weeks on ${day}`;

  if (session.recurringFrom && session.recurringTo) {
    return `${interval} · ${fmt(session.recurringFrom)} – ${fmt(session.recurringTo)}`;
  }

  return interval;
}

export function buildTrainingEventDescription(
  session: {
    level: string;
    coach?: string | null;
    description?: string | null;
  },
  overrides?: {
    coach?: string | null;
    description?: string | null;
  },
) {
  const coach =
    overrides?.coach !== undefined ? overrides.coach : session.coach;
  const description =
    overrides?.description !== undefined
      ? overrides.description
      : session.description;

  const parts = [session.level];
  if (coach) parts.push(`Coach: ${coach}`);
  if (description) parts.push(description);
  return parts.join(" · ");
}

export function toTrainingSessionData(data: {
  title: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string;
  level: string;
  description?: string;
  coach?: string;
  attendanceUrl?: string;
  recurring: boolean;
  recurrenceWeeks: number;
  sessionDate?: string;
  recurringFrom?: string;
  recurringTo?: string;
}) {
  return {
    title: data.title,
    dayOfWeek: data.dayOfWeek,
    startTime: data.startTime,
    endTime: data.endTime,
    location: data.location,
    level: data.level,
    description: data.description || null,
    coach: data.coach || null,
    attendanceUrl: data.attendanceUrl || null,
    recurring: data.recurring,
    recurrenceWeeks: data.recurring ? data.recurrenceWeeks : 1,
    recurringFrom:
      data.recurring && data.recurringFrom
        ? new Date(data.recurringFrom)
        : null,
    recurringTo:
      data.recurring && data.recurringTo ? new Date(data.recurringTo) : null,
    sessionDate:
      !data.recurring && data.sessionDate ? new Date(data.sessionDate) : null,
  };
}

export function defaultRecurringFrom() {
  return new Date().toISOString().slice(0, 10);
}

export function defaultRecurringTo(monthsAhead = 3) {
  const date = new Date();
  date.setMonth(date.getMonth() + monthsAhead);
  return date.toISOString().slice(0, 10);
}
