import type { ReactNode } from "react";
import { format } from "date-fns";
import { AttendanceLink } from "@/components/training/AttendanceLink";
import { PaymentLink } from "@/components/training/PaymentLink";
import { ReclubLinkUnavailable } from "@/components/training/ReclubLinkUnavailable";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export const FUN_SESSION_FEE = "€10";

export function formatReclubPaymentReference(
  sessionDate?: Date | string | null,
  sessionTitle?: string | null,
  reclubUsername?: string | null,
) {
  const username = reclubUsername?.trim() || "ReClub Username";
  if (sessionDate && sessionTitle) {
    return `${format(new Date(sessionDate), "EEE d MMM yyyy")} – ${sessionTitle} - ${username}`;
  }
  return `Session date – Reclub name - ${username}`;
}

function PaymentInstructions({
  sessionDate,
  sessionTitle,
  reclubUsername,
  showPayBeforeNote = false,
}: {
  sessionDate?: Date | string | null;
  sessionTitle?: string | null;
  reclubUsername?: string | null;
  showPayBeforeNote?: boolean;
}) {
  const reference = formatReclubPaymentReference(
    sessionDate,
    sessionTitle,
    reclubUsername,
  );

  return (
    <div className="space-y-3 text-sm leading-relaxed text-zinc-400">
      <p>
        Payment details are also available in the details section on ReClub.
        Look for a reference like:
      </p>
      <p className="rounded-md border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-zinc-200">
        {reference}
      </p>
      <p>
        Make sure to register attendance after payment.
        {showPayBeforeNote ? " Pay before you arrive." : null}
      </p>
    </div>
  );
}

function JoinStep({
  step,
  title,
  children,
  isLast = false,
}: {
  step: number;
  title: string;
  children: ReactNode;
  isLast?: boolean;
}) {
  return (
    <div className="relative flex gap-4">
      {!isLast && (
        <div
          aria-hidden
          className="absolute bottom-0 left-4 top-9 w-px bg-white/10"
        />
      )}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-jackals-red/40 bg-jackals-red/15 text-sm font-bold text-jackals-red-light">
        {step}
      </div>
      <div className={cn("min-w-0 flex-1", !isLast && "pb-6")}>
        <h3 className="font-medium text-white">{title}</h3>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

export function FunSessionJoinFlow({
  paymentUrl,
  payLabel = "Pay on ReClub",
  attendanceUrl,
  sessionId,
  attendBasePath,
  attendanceOccurrenceDate,
  attendanceLabel = "Register on ReClub",
  sessionTitle,
  sessionDate,
  reclubUsername,
  showPayBeforeNote = false,
}: {
  paymentUrl: string;
  payLabel?: string;
  attendanceUrl?: string | null;
  sessionId: string;
  attendBasePath: string;
  attendanceOccurrenceDate?: string | null;
  attendanceLabel?: string;
  sessionTitle?: string | null;
  sessionDate?: Date | string | null;
  reclubUsername?: string | null;
  showPayBeforeNote?: boolean;
}) {
  return (
    <Card className="overflow-hidden border-jackals-red/30 p-0">
      <div className="border-b border-jackals-red/20 bg-jackals-red/10 px-6 py-4">
        <CardTitle>Join this session</CardTitle>
        <CardDescription className="mt-1">
          Pay first, then register your attendance on ReClub.
        </CardDescription>
      </div>

      <div className="px-6 py-6">
        <JoinStep step={1} title="Pay session fee">
          <div className="mb-3 inline-flex items-baseline gap-2 rounded-lg border border-jackals-red/30 bg-jackals-red/10 px-3 py-2">
            <span className="font-display text-2xl font-bold text-white">
              {FUN_SESSION_FEE}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-jackals-red-light">
              session fee
            </span>
          </div>
          <PaymentInstructions
            sessionDate={sessionDate}
            sessionTitle={sessionTitle}
            reclubUsername={reclubUsername}
            showPayBeforeNote={showPayBeforeNote}
          />
          <div className="mt-4">
            <PaymentLink href={paymentUrl} label={payLabel} />
          </div>
        </JoinStep>

        <JoinStep step={2} title="Register attendance" isLast>
          {attendanceUrl ? (
            <>
              <p className="text-sm text-zinc-400">
                After paying, sign up for this session on ReClub.
              </p>
              <div className="mt-4">
                <AttendanceLink
                  sessionId={sessionId}
                  basePath={attendBasePath}
                  occurrenceDate={attendanceOccurrenceDate}
                  label={attendanceLabel}
                  variant="primary"
                />
              </div>
            </>
          ) : (
            <ReclubLinkUnavailable />
          )}
        </JoinStep>
      </div>
    </Card>
  );
}

export function SessionPaymentSection({
  paymentUrl,
  payLabel = "Pay for session",
  sessionTitle,
  sessionDate,
  reclubUsername,
  showPayBeforeNote = false,
}: {
  paymentUrl: string;
  payLabel?: string;
  sessionTitle?: string | null;
  sessionDate?: Date | string | null;
  reclubUsername?: string | null;
  showPayBeforeNote?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="inline-flex items-baseline gap-2 rounded-lg border border-jackals-red/30 bg-jackals-red/10 px-3 py-2">
        <span className="font-display text-2xl font-bold text-white">
          {FUN_SESSION_FEE}
        </span>
        <span className="text-xs font-semibold uppercase tracking-wide text-jackals-red-light">
          session fee
        </span>
      </div>
      <PaymentInstructions
        sessionDate={sessionDate}
        sessionTitle={sessionTitle}
        reclubUsername={reclubUsername}
        showPayBeforeNote={showPayBeforeNote}
      />
      <PaymentLink href={paymentUrl} label={payLabel} />
    </div>
  );
}
