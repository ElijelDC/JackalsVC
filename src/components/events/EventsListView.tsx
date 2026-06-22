"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  type EventsCalendarEvent,
  eventsEventDetailPath,
  EVENTS_SECTIONS,
} from "@/lib/events-config";
import { groupSessionsByDay } from "@/lib/training-utils";
import type { TrainingSessionCardData } from "@/types/training-session";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { EventListCard } from "@/components/events/EventListCard";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { StaggerIn } from "@/components/motion/StaggerIn";
import { SessionCard } from "@/components/training/SessionCard";
import { cn } from "@/lib/utils";

type BrowseFilter =
  | "fun-sessions"
  | "tournaments"
  | "skills-clinics"
  | "socials";

const BROWSE_FILTERS: {
  key: BrowseFilter;
  label: string;
  sectionId: string;
  emptyTitle: string;
  emptyDescription: string;
}[] = [
  {
    key: "fun-sessions",
    label: "Fun sessions",
    sectionId: EVENTS_SECTIONS.funSessions,
    emptyTitle: "No fun sessions scheduled",
    emptyDescription: "Fun session times will be posted here soon.",
  },
  {
    key: "tournaments",
    label: "Tournaments",
    sectionId: EVENTS_SECTIONS.tournaments,
    emptyTitle: "No tournaments scheduled",
    emptyDescription: "Tournament dates will appear here when announced.",
  },
  {
    key: "skills-clinics",
    label: "Skills clinics",
    sectionId: EVENTS_SECTIONS.skillsClinics,
    emptyTitle: "No skills clinics scheduled",
    emptyDescription: "Clinic dates will appear here when announced.",
  },
  {
    key: "socials",
    label: "Social Activity",
    sectionId: EVENTS_SECTIONS.socials,
    emptyTitle: "No social activity scheduled",
    emptyDescription:
      "Social events and club nights will appear here when announced.",
  },
];

function browseFilterFromHash(hash: string): BrowseFilter | null {
  const id = hash.replace(/^#/, "");
  return BROWSE_FILTERS.find((filter) => filter.sectionId === id)?.key ?? null;
}

function defaultBrowseFilter(counts: Record<BrowseFilter, number>): BrowseFilter {
  const firstWithItems = BROWSE_FILTERS.find((filter) => counts[filter.key] > 0);
  return firstWithItems?.key ?? "fun-sessions";
}

function BrowseTypeFilters({
  active,
  counts,
  onChange,
}: {
  active: BrowseFilter;
  counts: Record<BrowseFilter, number>;
  onChange: (filter: BrowseFilter) => void;
}) {
  return (
    <div
      className="flex flex-wrap gap-2"
      role="tablist"
      aria-label="Filter events by type"
    >
      {BROWSE_FILTERS.map((filter) => {
        const isActive = active === filter.key;
        const count = counts[filter.key];

        return (
          <button
            key={filter.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(filter.key)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-200",
              isActive
                ? "border-jackals-red/50 bg-jackals-red/20 text-white shadow-[0_0_20px_rgba(232,34,42,0.12)]"
                : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:text-zinc-200",
            )}
          >
            {filter.label}
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-semibold",
                isActive
                  ? "bg-white/15 text-white"
                  : "bg-white/5 text-zinc-500",
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function calendarEventToCard(event: EventsCalendarEvent) {
  const startDate =
    typeof event.startDate === "string"
      ? event.startDate
      : event.startDate.toISOString();
  const endDate =
    event.endDate == null
      ? null
      : typeof event.endDate === "string"
        ? event.endDate
        : event.endDate.toISOString();

  return {
    id: event.id,
    title: event.title,
    type: event.type,
    startDate,
    endDate,
    location: event.location,
    description: event.description,
    sessionFee: event.sessionFee,
  };
}

function FunSessionsGrid({ funSessions }: { funSessions: TrainingSessionCardData[] }) {
  const { grouped: groupedFun, oneOff } = groupSessionsByDay(funSessions);

  return (
    <div className="space-y-8">
      {groupedFun.map(({ day, sessions }) => (
        <StaggerIn
          key={day}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              detailBasePath="/fun-sessions"
              accentType="FUN"
            />
          ))}
        </StaggerIn>
      ))}
      {oneOff.length > 0 && (
        <StaggerIn className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {oneOff.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              detailBasePath="/fun-sessions"
              accentType="FUN"
            />
          ))}
        </StaggerIn>
      )}
    </div>
  );
}

function CalendarEventsGrid({
  events,
  section,
}: {
  events: EventsCalendarEvent[];
  section: "tournaments" | "skillsClinics" | "socials";
}) {
  return (
    <StaggerIn className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <EventListCard
          key={event.id}
          event={calendarEventToCard(event)}
          href={eventsEventDetailPath(event.id, section)}
          cta="text"
        />
      ))}
    </StaggerIn>
  );
}

export function EventsListView({
  funSessions,
  tournaments,
  skillsClinics,
  socials,
}: {
  funSessions: TrainingSessionCardData[];
  tournaments: EventsCalendarEvent[];
  skillsClinics: EventsCalendarEvent[];
  socials: EventsCalendarEvent[];
}) {
  const pathname = usePathname();
  const counts = useMemo(
    () => ({
      "fun-sessions": funSessions.length,
      tournaments: tournaments.length,
      "skills-clinics": skillsClinics.length,
      socials: socials.length,
    }),
    [funSessions.length, tournaments.length, skillsClinics.length, socials.length],
  );

  const [activeFilter, setActiveFilter] = useState<BrowseFilter>(() =>
    defaultBrowseFilter(counts),
  );

  useEffect(() => {
    const fromHash = browseFilterFromHash(window.location.hash);
    if (fromHash) {
      setActiveFilter(fromHash);
      return;
    }
    setActiveFilter(defaultBrowseFilter(counts));
  }, [counts]);

  const setFilter = (filter: BrowseFilter) => {
    setActiveFilter(filter);
    const sectionId = BROWSE_FILTERS.find((item) => item.key === filter)?.sectionId;
    const hash = sectionId ? `#${sectionId}` : "";
    window.history.replaceState(null, "", `${pathname}${hash}`);
  };

  const hasAnything = Object.values(counts).some((count) => count > 0);

  const activeMeta = BROWSE_FILTERS.find((filter) => filter.key === activeFilter)!;

  if (!hasAnything) {
    return (
      <Card>
        <CardTitle>Nothing scheduled right now</CardTitle>
        <CardDescription>
          Check back soon, or switch to calendar view to see everything coming up.
        </CardDescription>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <BrowseTypeFilters
        active={activeFilter}
        counts={counts}
        onChange={setFilter}
      />

      <AnimateIn key={activeFilter} className="space-y-4">
        <h2
          id={activeMeta.sectionId}
          className="scroll-mt-28 font-display text-2xl font-semibold tracking-wide text-white"
        >
          {activeMeta.label}
        </h2>

        {activeFilter === "fun-sessions" && (
          funSessions.length > 0 ? (
            <FunSessionsGrid funSessions={funSessions} />
          ) : (
            <Card>
              <CardTitle>{activeMeta.emptyTitle}</CardTitle>
              <CardDescription>{activeMeta.emptyDescription}</CardDescription>
            </Card>
          )
        )}

        {activeFilter === "tournaments" && (
          tournaments.length > 0 ? (
            <CalendarEventsGrid events={tournaments} section="tournaments" />
          ) : (
            <Card>
              <CardTitle>{activeMeta.emptyTitle}</CardTitle>
              <CardDescription>{activeMeta.emptyDescription}</CardDescription>
            </Card>
          )
        )}

        {activeFilter === "skills-clinics" && (
          skillsClinics.length > 0 ? (
            <CalendarEventsGrid events={skillsClinics} section="skillsClinics" />
          ) : (
            <Card>
              <CardTitle>{activeMeta.emptyTitle}</CardTitle>
              <CardDescription>{activeMeta.emptyDescription}</CardDescription>
            </Card>
          )
        )}

        {activeFilter === "socials" && (
          socials.length > 0 ? (
            <CalendarEventsGrid events={socials} section="socials" />
          ) : (
            <Card>
              <CardTitle>{activeMeta.emptyTitle}</CardTitle>
              <CardDescription>{activeMeta.emptyDescription}</CardDescription>
            </Card>
          )
        )}
      </AnimateIn>
    </div>
  );
}
