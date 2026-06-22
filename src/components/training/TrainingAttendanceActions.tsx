"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { TrainingAttendancePicker } from "@/components/training/TrainingAttendancePicker";
import type { TrainingAttendanceStatus } from "@/lib/training-attendance-config";

export function TrainingAttendanceActions({
  eventId,
  sessionStartDate,
  initialStatus = "UNANSWERED",
  canAccessAttendance,
  isLoggedIn,
  signInUrl,
  compact = false,
  detailHref,
}: {
  eventId: string | null;
  sessionStartDate?: string | Date;
  initialStatus?: TrainingAttendanceStatus;
  canAccessAttendance: boolean;
  isLoggedIn: boolean;
  signInUrl: string;
  compact?: boolean;
  detailHref?: string;
}) {
  if (!eventId) {
    const message = (
      <p className="text-sm text-zinc-500">
        No upcoming session available to respond to yet.
      </p>
    );

    return compact ? message : <Card>{message}</Card>;
  }

  if (detailHref && !compact) {
    return (
      <Card>
        <CardTitle>Training response</CardTitle>
        <CardDescription className="mt-2">
          Open the session page to say if you&apos;re coming, and see squad
          responses.
        </CardDescription>
        <Link href={detailHref} className="mt-6 inline-block">
          <Button>View session</Button>
        </Link>
      </Card>
    );
  }

  if (compact && detailHref) {
    return (
      <Link href={detailHref}>
        <Button size="sm" variant="outline">
          View session
        </Button>
      </Link>
    );
  }

  const content = (
    <>
      {!isLoggedIn && (
        <Link href={signInUrl}>
          <Button className="w-full">Sign in to respond</Button>
        </Link>
      )}

      {isLoggedIn && !canAccessAttendance && (
        <Link href="/membership">
          <Button className="w-full">Get membership to respond</Button>
        </Link>
      )}

      {isLoggedIn && canAccessAttendance && sessionStartDate && (
        <TrainingAttendancePicker
          eventId={eventId}
          sessionStartDate={sessionStartDate}
          initialStatus={initialStatus}
          layout={compact ? "row" : "stack"}
        />
      )}
    </>
  );

  if (compact) {
    return <div className="shrink-0">{content}</div>;
  }

  return (
    <Card>
      <CardTitle>Your response</CardTitle>
      <CardDescription className="mt-2">
        Let coaches and teammates know if you&apos;re coming. Attending responses
        get an automatic reminder.
      </CardDescription>
      <div className="mt-6">{content}</div>
    </Card>
  );
}
