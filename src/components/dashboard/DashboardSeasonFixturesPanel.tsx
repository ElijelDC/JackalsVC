"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { CalendarRange, ChevronRight, MapPin } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { StaggerIn } from "@/components/motion/StaggerIn";
import { squadShortLabel } from "@/lib/admin-members-hub";
import { withDashboardReturn } from "@/lib/dashboard-return";
import {
  formatMatchTitle,
  formatMatchVenueLabel,
} from "@/lib/match-config";
import { cn } from "@/lib/utils";

export type DashboardFixturePreview = {
  id: string;
  opponentName: string;
  venue: string;
  location: string;
  matchStart: string;
  trainingTeamKey: string;
  teamName: string;
  isMemberTeam: boolean;
};

function DatePill({ date }: { date: Date }) {
  return (
    <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center border border-white/10 bg-jackals-surface text-center">
      <span className="text-[10px] font-medium uppercase leading-none text-zinc-500">
        {format(date, "MMM")}
      </span>
      <span className="text-sm font-bold leading-tight text-white">
        {format(date, "d")}
      </span>
    </div>
  );
}

export function DashboardSeasonFixturesPanel({
  fixtures,
  memberTeamKey,
}: {
  fixtures: DashboardFixturePreview[];
  memberTeamKey: string | null;
}) {
  const fixturesHref = withDashboardReturn(
    memberTeamKey ? `/fixtures?team=${memberTeamKey}` : "/fixtures?team=all",
  );

  return (
    <section className="min-w-0">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-semibold text-white">
            Season fixtures
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Full match schedule · your squad first, or browse every team
          </p>
        </div>
        <Link
          href={fixturesHref}
          className="inline-flex shrink-0 items-center gap-1 text-sm text-jackals-red-light hover:text-jackals-red"
        >
          View all
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <Card className="min-w-0 overflow-hidden border-jackals-red/15 bg-gradient-to-br from-jackals-red/[0.05] to-transparent p-0">
        {fixtures.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <CalendarRange className="mx-auto h-8 w-8 text-zinc-600" />
            <p className="mt-3 text-sm text-zinc-500">
              No upcoming fixtures published yet.
            </p>
            <Link
              href={fixturesHref}
              className="mt-3 inline-flex text-sm font-medium text-jackals-red-light hover:text-jackals-red"
            >
              Open season schedule
            </Link>
          </div>
        ) : (
          <StaggerIn className="divide-y divide-white/10" stagger={50}>
            {fixtures.map((fixture) => {
              const kickOff = parseISO(fixture.matchStart);
              return (
                <Link
                  key={fixture.id}
                  href={withDashboardReturn(`/matches/${fixture.id}`)}
                  className={cn(
                    "flex items-stretch gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.03]",
                    fixture.isMemberTeam && "bg-jackals-red/[0.03]",
                  )}
                >
                  <DatePill date={kickOff} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white">
                      {formatMatchTitle(fixture.opponentName, fixture.venue)}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
                      <span
                        className={
                          fixture.venue === "HOME"
                            ? "text-emerald-300/90"
                            : "text-sky-300/90"
                        }
                      >
                        {formatMatchVenueLabel(fixture.venue)}
                      </span>
                      <span>·</span>
                      <span>{format(kickOff, "EEE d MMM · HH:mm")}</span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {fixture.location}
                      </span>
                      <span>·</span>
                      <span>
                        {squadShortLabel(
                          fixture.trainingTeamKey,
                        )?.toUpperCase() ?? fixture.teamName}
                      </span>
                    </p>
                  </div>
                  <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-zinc-600" />
                </Link>
              );
            })}
            <Link
              href={fixturesHref}
              className="flex items-center justify-center gap-1 border-t border-white/10 py-2.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-white/[0.03] hover:text-jackals-red-light"
            >
              Full season fixtures
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </StaggerIn>
        )}
      </Card>
    </section>
  );
}
