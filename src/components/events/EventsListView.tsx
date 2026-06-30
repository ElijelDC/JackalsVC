"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
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
    label: "Skills Clinics",
    sectionId: EVENTS_SECTIONS.skillsClinics,
    emptyTitle: "No skills clinics scheduled",
    emptyDescription: "Clinic dates will appear here when announced.",
  },
  {
    key: "socials",
    label: "Social Activities",
    sectionId: EVENTS_SECTIONS.socials,
    emptyTitle: "No social activities scheduled",
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
      className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3"
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
              "flex h-[4.75rem] w-full items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-xs font-medium transition-all duration-200 sm:h-auto sm:min-h-[3.25rem] sm:px-4 sm:text-sm",
              isActive
                ? "border-jackals-red/50 bg-jackals-red/20 text-white shadow-[0_0_20px_rgba(232,34,42,0.12)]"
                : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:text-zinc-200",
            )}
          >
            <span className="min-w-0 flex-1 leading-snug">{filter.label}</span>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
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

function FunSessionsGrid({
  funSessions,
  reclubFunEvents = [],
}: {
  funSessions: TrainingSessionCardData[];
  reclubFunEvents?: EventsCalendarEvent[];
}) {
  const { grouped: groupedFun, oneOff } = groupSessionsByDay(funSessions);
  const hasSessions = funSessions.length > 0;
  const hasReclubEvents = reclubFunEvents.length > 0;

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
      {hasReclubEvents && (
        <CalendarEventsGrid events={reclubFunEvents} section="funSessions" />
      )}
      {!hasSessions && !hasReclubEvents && null}
    </div>
  );
}

function CalendarEventsGrid({
  events,
  section,
}: {
  events: EventsCalendarEvent[];
  section: "funSessions" | "tournaments" | "skillsClinics" | "socials";
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

function subscribeToHash(onStoreChange: () => void) {
  window.addEventListener("hashchange", onStoreChange);
  return () => window.removeEventListener("hashchange", onStoreChange);
}

function getHashSnapshot() {
  return window.location.hash;
}

export function EventsListView({
  funSessions,
  reclubFunEvents = [],
  tournaments,
  skillsClinics,
  socials,
}: {
  funSessions: TrainingSessionCardData[];
  reclubFunEvents?: EventsCalendarEvent[];
  tournaments: EventsCalendarEvent[];
  skillsClinics: EventsCalendarEvent[];
  socials: EventsCalendarEvent[];
}) {
  const pathname = usePathname();
  const hash = useSyncExternalStore(subscribeToHash, getHashSnapshot, () => "");
  const counts = useMemo(
    () => ({
      "fun-sessions": funSessions.length + reclubFunEvents.length,
      tournaments: tournaments.length,
      "skills-clinics": skillsClinics.length,
      socials: socials.length,
    }),
    [
      funSessions.length,
      reclubFunEvents.length,
      tournaments.length,
      skillsClinics.length,
      socials.length,
    ],
  );

  const filterKey = `${hash}:${counts["fun-sessions"]}:${counts.tournaments}:${counts["skills-clinics"]}:${counts.socials}`;

  return (
    <EventsListViewInner
      key={filterKey}
      pathname={pathname}
      hash={hash}
      counts={counts}
      funSessions={funSessions}
      reclubFunEvents={reclubFunEvents}
      tournaments={tournaments}
      skillsClinics={skillsClinics}
      socials={socials}
    />
  );
}

function EventsListViewInner({
  pathname,
  hash,
  counts,
  funSessions,
  reclubFunEvents = [],
  tournaments,
  skillsClinics,
  socials,
}: {
  pathname: string;
  hash: string;
  counts: Record<BrowseFilter, number>;
  funSessions: TrainingSessionCardData[];
  reclubFunEvents?: EventsCalendarEvent[];
  tournaments: EventsCalendarEvent[];
  skillsClinics: EventsCalendarEvent[];
  socials: EventsCalendarEvent[];
}) {

  const [activeFilter, setActiveFilter] = useState<BrowseFilter>(
    () => browseFilterFromHash(hash) ?? defaultBrowseFilter(counts),
  );

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
          funSessions.length > 0 || reclubFunEvents.length > 0 ? (
            <FunSessionsGrid
              funSessions={funSessions}
              reclubFunEvents={reclubFunEvents}
            />
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
