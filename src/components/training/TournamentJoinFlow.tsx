import { AttendanceLink } from "@/components/training/AttendanceLink";
import { EntryFeeBadge, JoinFlowStep } from "@/components/training/JoinFlowStep";
import { ReclubLinkUnavailable } from "@/components/training/ReclubLinkUnavailable";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";

export function TournamentJoinFlow({
  attendanceUrl,
  sessionId,
  attendBasePath,
  tournamentFee,
  clubIban,
}: {
  attendanceUrl?: string | null;
  sessionId: string;
  attendBasePath: string;
  tournamentFee?: number | null;
  clubIban?: string | null;
}) {
  return (
    <Card className="overflow-hidden border-jackals-red/30 p-0">
      <div className="border-b border-jackals-red/20 bg-jackals-red/10 px-6 py-4">
        <CardTitle>Enter this tournament</CardTitle>
        <CardDescription className="mt-1">
          Register your team on ReClub first, then pay the entry fee by bank
          transfer.
        </CardDescription>
      </div>

      <div className="px-6 py-6">
        <JoinFlowStep step={1} title="Register a team on ReClub">
          {attendanceUrl ? (
            <>
              <p className="text-sm text-zinc-400">
                Sign up your team on ReClub to reserve a spot in this
                tournament.
              </p>
              <div className="mt-4">
                <AttendanceLink
                  sessionId={sessionId}
                  basePath={attendBasePath}
                  label="Register a team on ReClub"
                  variant="primary"
                />
              </div>
            </>
          ) : (
            <ReclubLinkUnavailable />
          )}
        </JoinFlowStep>

        <JoinFlowStep step={2} title="Pay using club IBAN" isLast>
          {tournamentFee != null && (
            <EntryFeeBadge amount={tournamentFee} label="tournament fee" />
          )}
          {clubIban ? (
            <div className="space-y-3 text-sm leading-relaxed text-zinc-400">
              <p>Transfer the tournament fee to the club bank account:</p>
              <p className="rounded-md border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm tracking-wide text-zinc-200">
                {clubIban}
              </p>
              <p>Complete payment after registering your team on ReClub.</p>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">
              Bank transfer details will be shared soon.
            </p>
          )}
        </JoinFlowStep>
      </div>
    </Card>
  );
}
