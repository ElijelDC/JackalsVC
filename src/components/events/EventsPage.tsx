"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, LayoutList } from "lucide-react";
import { CalendarView } from "@/components/calendar/CalendarView";
import { EventsListView } from "@/components/events/EventsListView";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { AnimateIn } from "@/components/motion/AnimateIn";
import type { EventListItem } from "@/lib/event-filters";
import type { EventsCalendarEvent } from "@/lib/events-config";
import type { TrainingSessionCardData } from "@/types/training-session";
import { SEO_COPY } from "@/lib/seo";
import { cn } from "@/lib/utils";

type EventsView = "list" | "calendar";

function EventsViewToggle({
  view,
  onViewChange,
}: {
  view: EventsView;
  onViewChange: (view: EventsView) => void;
}) {
  return (
    <div
      className="w-full rounded-xl border border-jackals-red/20 bg-gradient-to-r from-jackals-red/10 via-jackals-surface to-jackals-surface p-2"
      role="tablist"
      aria-label="Events view"
    >
      <p className="mb-2 px-2 text-center text-[11px] font-semibold uppercase tracking-widest text-zinc-500 sm:text-left">
        How do you want to view events?
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          role="tab"
          aria-selected={view === "list"}
          onClick={() => onViewChange("list")}
          className={cn(
            "flex flex-col items-center gap-2 rounded-lg border px-4 py-4 text-center transition-all duration-300 sm:flex-row sm:justify-center sm:py-3.5",
            view === "list"
              ? "border-jackals-red/50 bg-jackals-red/20 text-white shadow-[0_0_24px_rgba(232,34,42,0.15)]"
              : "border-transparent bg-white/[0.03] text-zinc-400 hover:border-white/10 hover:bg-white/[0.06] hover:text-zinc-200",
          )}
        >
          <LayoutList
            className={cn(
              "h-5 w-5 shrink-0",
              view === "list" ? "text-jackals-red-light" : "text-zinc-500",
            )}
            aria-hidden
          />
          <div>
            <span className="block text-sm font-semibold sm:text-base">Browse</span>
            <span
              className={cn(
                "mt-0.5 block text-[11px] leading-tight",
                view === "list" ? "text-zinc-300" : "text-zinc-600",
              )}
            >
              By category
            </span>
          </div>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === "calendar"}
          onClick={() => onViewChange("calendar")}
          className={cn(
            "flex flex-col items-center gap-2 rounded-lg border px-4 py-4 text-center transition-all duration-300 sm:flex-row sm:justify-center sm:py-3.5",
            view === "calendar"
              ? "border-jackals-red/50 bg-jackals-red/20 text-white shadow-[0_0_24px_rgba(232,34,42,0.15)]"
              : "border-transparent bg-white/[0.03] text-zinc-400 hover:border-white/10 hover:bg-white/[0.06] hover:text-zinc-200",
          )}
        >
          <CalendarDays
            className={cn(
              "h-5 w-5 shrink-0",
              view === "calendar" ? "text-jackals-red-light" : "text-zinc-500",
            )}
            aria-hidden
          />
          <div>
            <span className="block text-sm font-semibold sm:text-base">Calendar</span>
            <span
              className={cn(
                "mt-0.5 block text-[11px] leading-tight",
                view === "calendar" ? "text-zinc-300" : "text-zinc-600",
              )}
            >
              By date
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}

export function EventsPage({
  funSessions,
  reclubFunEvents = [],
  tournaments,
  skillsClinics,
  socials,
  calendarEvents,
  isLoggedIn,
  initialView = "list",
}: {
  funSessions: TrainingSessionCardData[];
  reclubFunEvents?: EventsCalendarEvent[];
  tournaments: EventsCalendarEvent[];
  skillsClinics: EventsCalendarEvent[];
  socials: EventsCalendarEvent[];
  calendarEvents: EventListItem[];
  isLoggedIn: boolean;
  initialView?: EventsView;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view: EventsView =
    searchParams.get("view") === "calendar" ? "calendar" : initialView;

  const setView = (next: EventsView) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "calendar") {
      params.set("view", "calendar");
    } else {
      params.delete("view");
    }
    const query = params.toString();
    router.push(query ? `/events?${query}` : "/events", { scroll: false });
  };

  return (
    <PageContainer>
      <PageHeader
        title="Events"
        description={SEO_COPY.eventsIntro}
      />

      <AnimateIn delay={25} className="mb-6">
        <p className="max-w-3xl text-sm leading-relaxed text-zinc-500">
          {view === "list"
            ? "Filter by category below — fun sessions, tournaments, skills clinics, and social activities."
            : "Switch to calendar view to see everything by date and add events to your phone or desktop calendar."}
        </p>
      </AnimateIn>

      <AnimateIn delay={50} className="mb-10">
        <EventsViewToggle view={view} onViewChange={setView} />
      </AnimateIn>

      <AnimateIn delay={100} key={view}>
        {view === "list" ? (
          <EventsListView
            funSessions={funSessions}
            reclubFunEvents={reclubFunEvents}
            tournaments={tournaments}
            skillsClinics={skillsClinics}
            socials={socials}
          />
        ) : (
          <CalendarView events={calendarEvents} isLoggedIn={isLoggedIn} />
        )}
      </AnimateIn>
    </PageContainer>
  );
}
