import { format } from "date-fns";
import { isExternalAttendanceUrl } from "@/lib/reclub-config";
import { AttendanceLink } from "@/components/training/AttendanceLink";
import { EntryFeeBadge, JoinFlowStep } from "@/components/training/JoinFlowStep";
import { PaymentLink } from "@/components/training/PaymentLink";
import { ReclubLinkUnavailable } from "@/components/training/ReclubLinkUnavailable";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";

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
        Use a reference like:
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

export function FunSessionJoinFlow({
  paymentUrl,
  payLabel = "Session Payment Link",
  attendanceUrl,
  sessionId,
  attendBasePath,
  attendanceOccurrenceDate,
  attendanceLabel = "Register on ReClub",
  sessionTitle,
  sessionDate,
  reclubUsername,
  sessionFee,
  showPayBeforeNote = false,
  inline = false,
}: {
  paymentUrl?: string | null;
  payLabel?: string;
  attendanceUrl?: string | null;
  sessionId: string;
  attendBasePath: string;
  attendanceOccurrenceDate?: string | null;
  attendanceLabel?: string;
  sessionTitle?: string | null;
  sessionDate?: Date | string | null;
  reclubUsername?: string | null;
  sessionFee?: number | null;
  showPayBeforeNote?: boolean;
  inline?: boolean;
}) {
  const steps = (
    <>
      {paymentUrl && (
        <JoinFlowStep step={1} title="Pay session fee">
          {sessionFee != null && (
            <EntryFeeBadge amount={sessionFee} label="session fee" />
          )}
          <PaymentInstructions
            sessionDate={sessionDate}
            sessionTitle={sessionTitle}
            reclubUsername={reclubUsername}
            showPayBeforeNote={showPayBeforeNote}
          />
          <div className="mt-4">
            <PaymentLink href={paymentUrl} label={payLabel} />
          </div>
        </JoinFlowStep>
      )}

      {!paymentUrl && sessionFee != null && (
        <JoinFlowStep step={1} title="Session fee">
          <EntryFeeBadge amount={sessionFee} label="session fee" />
          <p className="mt-2 text-sm text-zinc-400">
            Payment details will be available on ReClub when you register.
          </p>
        </JoinFlowStep>
      )}

      <JoinFlowStep step={paymentUrl || sessionFee != null ? 2 : 1} title="Register attendance" isLast>
        {attendanceUrl ? (
          <>
            <p className="text-sm text-zinc-400">
              After paying, sign up for this session on ReClub.
            </p>
            <div className="mt-4">
              <AttendanceLink
                externalHref={
                  isExternalAttendanceUrl(attendanceUrl) ? attendanceUrl : null
                }
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
      </JoinFlowStep>
    </>
  );

  if (inline) {
    return (
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          How to join
        </h2>
        <p className="mb-4 text-sm text-zinc-400">
          Pay first, then register your attendance on ReClub.
        </p>
        {steps}
      </div>
    );
  }

  return (
    <Card className="overflow-hidden border-jackals-red/30 p-0">
      <div className="border-b border-jackals-red/20 bg-jackals-red/10 px-6 py-4">
        <CardTitle>Join this session</CardTitle>
        <CardDescription className="mt-1">
          Pay first, then register your attendance on ReClub.
        </CardDescription>
      </div>

      <div className="px-6 py-6">
        {steps}
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
  sessionFee,
  showPayBeforeNote = false,
}: {
  paymentUrl: string;
  payLabel?: string;
  sessionTitle?: string | null;
  sessionDate?: Date | string | null;
  reclubUsername?: string | null;
  sessionFee?: number | null;
  showPayBeforeNote?: boolean;
}) {
  return (
    <div className="space-y-4">
      {sessionFee != null && (
        <EntryFeeBadge amount={sessionFee} label="session fee" />
      )}
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
