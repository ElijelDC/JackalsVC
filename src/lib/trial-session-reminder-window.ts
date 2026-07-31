export const TRIAL_SESSION_REMINDER_KIND = "DAY";
export const TRIAL_SESSION_REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000;

export function isWithinTrialSessionReminderWindow(
  startDate: Date | string,
  now: Date = new Date(),
): boolean {
  const start =
    typeof startDate === "string" ? new Date(startDate) : startDate;
  const msUntilStart = start.getTime() - now.getTime();
  return msUntilStart > 0 && msUntilStart <= TRIAL_SESSION_REMINDER_WINDOW_MS;
}

export function trialSessionReminderWindowOpensAt(
  startDate: Date | string,
): Date {
  const start =
    typeof startDate === "string" ? new Date(startDate) : startDate;
  return new Date(start.getTime() - TRIAL_SESSION_REMINDER_WINDOW_MS);
}
