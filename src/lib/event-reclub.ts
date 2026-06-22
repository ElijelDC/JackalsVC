export const OPEN_RECLUB_EVENT_TYPES = ["TOURNAMENT", "SKILLS_CLINIC"] as const;

export type OpenReclubEventType = (typeof OPEN_RECLUB_EVENT_TYPES)[number];

export function isOpenReclubEvent(type: string): type is OpenReclubEventType {
  return OPEN_RECLUB_EVENT_TYPES.includes(type as OpenReclubEventType);
}

export function savesEventAttendanceUrl(type: string) {
  return isOpenReclubEvent(type);
}

export function savesClinicPaymentFields(type: string) {
  return type === "SKILLS_CLINIC";
}

export function savesTournamentPaymentFields(type: string) {
  return type === "TOURNAMENT";
}

/** @deprecated Use savesClinicPaymentFields */
export function savesEventPaymentFields(type: string) {
  return savesClinicPaymentFields(type);
}

export function usesPaidJoinFlow(type: string) {
  return type === "FUN" || type === "SKILLS_CLINIC";
}

export function usesTournamentJoinFlow(
  event: {
    type: string;
    attendanceUrl?: string | null;
    clubIban?: string | null;
    sessionFee?: number | null;
  },
) {
  if (event.type !== "TOURNAMENT") return false;
  return Boolean(
    event.attendanceUrl || event.clubIban || event.sessionFee != null,
  );
}
