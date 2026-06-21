import type { z } from "zod";
import {
  savesClinicPaymentFields,
  savesEventAttendanceUrl,
  savesTournamentPaymentFields,
} from "@/lib/event-reclub";
import type { eventSchema } from "@/lib/validations";

export function toManualEventData(data: z.infer<typeof eventSchema>) {
  const base = {
    title: data.title,
    description: data.description || null,
    startDate: new Date(data.startDate),
    endDate: data.endDate ? new Date(data.endDate) : null,
    type: data.type,
    location: data.location || null,
    attendanceUrl: savesEventAttendanceUrl(data.type)
      ? data.attendanceUrl || null
      : null,
    paymentUrl: null as string | null,
    sessionFee: null as number | null,
    reclubUsername: null as string | null,
    clubIban: null as string | null,
  };

  if (savesClinicPaymentFields(data.type)) {
    return {
      ...base,
      paymentUrl: data.paymentUrl || null,
      sessionFee: data.sessionFee ?? null,
      reclubUsername: data.reclubUsername || null,
    };
  }

  if (savesTournamentPaymentFields(data.type)) {
    return {
      ...base,
      sessionFee: data.sessionFee ?? null,
      clubIban: data.clubIban || null,
    };
  }

  return base;
}
