export const OPEN_RECLUB_EVENT_TYPES = ["TOURNAMENT", "SOCIAL"] as const;

export type OpenReclubEventType = (typeof OPEN_RECLUB_EVENT_TYPES)[number];

export function isOpenReclubEvent(type: string): type is OpenReclubEventType {
  return OPEN_RECLUB_EVENT_TYPES.includes(type as OpenReclubEventType);
}

export function savesEventAttendanceUrl(type: string) {
  return isOpenReclubEvent(type);
}
