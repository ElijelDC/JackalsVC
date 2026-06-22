import { prisma } from "@/lib/prisma";
import {
  getAttendingEventIds,
  getUserEventAttendanceStatuses,
} from "@/lib/training-attendance";

export { getAttendingEventIds as getSignedUpEventIds };
export { getUserEventAttendanceStatuses };

export async function isSignedUpForEvent(userId: string, eventId: string) {
  const attending = await getAttendingEventIds(userId, [eventId]);
  return attending.has(eventId);
}

export async function ensureTrainingSignupReminder(userId: string, eventId: string) {
  await prisma.eventReminder.upsert({
    where: {
      userId_eventId: { userId, eventId },
    },
    create: { userId, eventId },
    update: {},
  });
}

export async function removeTrainingSignupReminder(userId: string, eventId: string) {
  await prisma.eventReminder.deleteMany({
    where: { userId, eventId },
  });
}
