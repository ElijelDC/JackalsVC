"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  startOfDay,
} from "date-fns";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  User,
} from "lucide-react";
import { AddToCalendarActions } from "@/components/calendar/AddToCalendarActions";
import { EventFiltersToolbar } from "@/components/events/EventFiltersToolbar";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { getBrowseEventTypeLabel, eventsCalendarEventDetailPath } from "@/lib/events-config";
import {
  filterEvents,
  getEventTypeLabel,
  getEventTypeOptions,
  type EventListItem,
} from "@/lib/event-filters";
import {
  formatEventDateTime,
  getEventDisplayStyle,
  getEventDisplayStyleKey,
  getEventTypeStyle,
} from "@/lib/event-display";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const UPCOMING_PREVIEW_LIMIT = 3;

const LEGEND_TYPES = [
  "FUN",
  "TRAINING",
  "TOURNAMENT",
  "SKILLS_CLINIC",
  "SOCIAL",
  "MEETING",
] as const;

function getLegendLabel(type: (typeof LEGEND_TYPES)[number]) {
  switch (type) {
    case "FUN":
      return "Fun sessions";
    case "SKILLS_CLINIC":
      return "Skills clinics";
    case "SOCIAL":
      return "Social activity";
    default:
      return getEventTypeLabel(type);
  }
}

function getInitialSelectedDate(events: EventListItem[]) {
  const today = startOfDay(new Date());
  if (events.some((event) => isSameDay(new Date(event.startDate), today))) {
    return today;
  }

  const next = events
    .filter((event) => new Date(event.startDate) >= today)
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    )[0];

  return next ? startOfDay(new Date(next.startDate)) : today;
}

function EventPreviewCard({
  event,
}: {
  event: EventListItem;
}) {
  const { timeLabel } = formatEventDateTime(event.startDate, event.endDate);
  const typeStyle = getEventDisplayStyle(event);

  return (
    <Card className="overflow-hidden p-0">
      <div className={cn("h-1 w-full", typeStyle.dot)} aria-hidden />
      <div className="flex items-start justify-between gap-2 p-6 pb-0">
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-medium",
            typeStyle.badge,
          )}
        >
          {getBrowseEventTypeLabel({
            type: event.type,
            title: event.title,
            description: event.sessionDescription ?? event.description,
          })}
        </span>
        <div className="flex items-center gap-1">
          <AddToCalendarActions
            compact
            event={{
              id: event.id,
              title: event.title,
              description: event.sessionDescription ?? event.description,
              startDate: event.startDate,
              endDate: event.endDate,
              location: event.location,
            }}
          />
        </div>
      </div>

      <Link
        href={eventsCalendarEventDetailPath(event.id)}
        className="group block px-6 pb-6 pt-3 transition-colors hover:text-white"
      >
        <CardTitle>{event.title}</CardTitle>

        <div className="mt-3 space-y-1.5 text-sm text-zinc-400">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
            {timeLabel}
          </div>
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
              {event.location}
            </div>
          )}
          {event.coach && (
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
              Coach: {event.coach}
            </div>
          )}
        </div>

        {(event.sessionDescription ?? event.description) && (
          <CardDescription className="mt-3 line-clamp-2">
            {event.sessionDescription ?? event.description}
          </CardDescription>
        )}

        <p className="mt-4 text-sm font-medium text-jackals-red-light/80 transition-colors group-hover:text-jackals-red-light">
          View details →
        </p>
      </Link>
    </Card>
  );
}

function UpNextPreview({
  events,
  onSelectDate,
}: {
  events: EventListItem[];
  onSelectDate: (date: Date) => void;
}) {
  const preview = events.slice(0, UPCOMING_PREVIEW_LIMIT);
  const remaining = events.length - preview.length;

  if (preview.length === 0) return null;

  return (
    <div className="border-t border-white/10 px-4 py-4 sm:px-6">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        Up next
      </p>
      <ul className="space-y-2">
        {preview.map((event) => {
          const eventDate = new Date(event.startDate);
          const style = getEventDisplayStyle(event);

          return (
            <li key={event.id}>
              <Link
                href={eventsCalendarEventDetailPath(event.id)}
                onClick={() => onSelectDate(eventDate)}
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5 transition-colors hover:border-white/20 hover:bg-white/[0.04]"
              >
                <span className="w-12 shrink-0 text-xs font-medium text-zinc-500">
                  {format(eventDate, "d MMM")}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-white">
                  {event.title}
                </span>
                <span
                  className={cn(
                    "hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium sm:inline",
                    style.badge,
                  )}
                >
                  {getBrowseEventTypeLabel({
            type: event.type,
            title: event.title,
            description: event.sessionDescription ?? event.description,
          })}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      {remaining > 0 && (
        <p className="mt-3 text-center text-xs text-zinc-600">
          +{remaining} more on the calendar — pick a date to explore
        </p>
      )}
    </div>
  );
}

function CalendarDayCell({
  day,
  dayEvents,
  isSelected,
  inCurrentMonth,
  onSelect,
}: {
  day: Date;
  dayEvents: EventListItem[];
  isSelected: boolean;
  inCurrentMonth: boolean;
  onSelect: (date: Date) => void;
}) {
  const hasEvents = dayEvents.length > 0;
  const visibleEvents = dayEvents.slice(0, 2);
  const hiddenCount = dayEvents.length - visibleEvents.length;
  const uniqueTypes = [
    ...new Set(dayEvents.map((event) => getEventDisplayStyleKey(event))),
  ];
  const primaryStyle = hasEvents ? getEventDisplayStyle(dayEvents[0]) : null;
  const multiType = uniqueTypes.length > 1;

  return (
    <button
      type="button"
      onClick={() => onSelect(day)}
      aria-label={
        hasEvents
          ? `${format(day, "EEEE d MMMM")}, ${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"}`
          : format(day, "EEEE d MMMM")
      }
      aria-pressed={isSelected}
      className={cn(
        "group relative flex min-h-[4.5rem] flex-col rounded-lg border p-1.5 text-left transition-all sm:min-h-[5.5rem] sm:p-2",
        isSelected
          ? "border-jackals-red bg-jackals-red text-white shadow-[0_0_0_1px_rgba(232,34,42,0.4)]"
          : isToday(day)
            ? "border-jackals-red/50 bg-jackals-red/10 text-jackals-red-light"
            : hasEvents
              ? cn(
                  "border-white/15 hover:border-white/25",
                  multiType ? "bg-white/[0.04]" : primaryStyle?.cell,
                )
              : "border-transparent text-zinc-300 hover:border-white/10 hover:bg-white/5",
        !inCurrentMonth && !isSelected && "opacity-40",
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <span
          className={cn(
            "inline-flex h-6 min-w-6 items-center justify-center rounded-md text-xs font-semibold sm:text-sm",
            isSelected
              ? "bg-white/20"
              : isToday(day)
                ? "bg-jackals-red/25"
                : hasEvents
                  ? "bg-black/20"
                  : "",
          )}
        >
          {format(day, "d")}
        </span>
        {hasEvents && (
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none sm:text-[11px]",
              isSelected
                ? "bg-white/20 text-white"
                : cn(primaryStyle?.badge, "ring-1 ring-inset ring-white/10"),
            )}
          >
            {dayEvents.length}
          </span>
        )}
      </div>

      <div className="mt-auto space-y-0.5 pt-1">
        {visibleEvents.map((event) => {
          const style = getEventDisplayStyle(event);
          const { timeLabel } = formatEventDateTime(
            event.startDate,
            event.endDate,
          );
          return (
            <div
              key={event.id}
              className={cn(
                "flex items-center gap-1 truncate rounded px-1 py-0.5 text-[10px] font-medium leading-tight sm:text-[11px]",
                isSelected
                  ? "bg-white/15 text-white"
                  : cn(style.cell, "text-zinc-200"),
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 shrink-0 rounded-full",
                  isSelected ? "bg-white" : style.dot,
                )}
                aria-hidden
              />
              <span className="truncate">
                {dayEvents.length > 1
                  ? `${timeLabel.split(" – ")[0]} · ${event.title}`
                  : event.title}
              </span>
            </div>
          );
        })}
        {hiddenCount > 0 && (
          <p
            className={cn(
              "px-1 text-[10px] font-medium sm:text-[11px]",
              isSelected ? "text-white/80" : "text-zinc-500",
            )}
          >
            +{hiddenCount} more
          </p>
        )}
      </div>

      {hasEvents && !isSelected && (
        <div
          className="absolute bottom-1.5 left-2 right-2 flex justify-center gap-0.5"
          aria-hidden
        >
          {dayEvents.slice(0, 4).map((event) => (
            <span
              key={event.id}
              className={cn(
                "h-1 flex-1 max-w-3 rounded-full",
                getEventDisplayStyle(event).dot,
              )}
            />
          ))}
        </div>
      )}
    </button>
  );
}

export function CalendarView({
  events,
  isLoggedIn = false,
}: {
  events: EventListItem[];
  isLoggedIn?: boolean;
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(() =>
    getInitialSelectedDate(events),
  );
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const filteredEvents = useMemo(
    () => filterEvents(events, { search, type: typeFilter }),
    [events, search, typeFilter],
  );

  useEffect(() => {
    setSelectedDate((prev) => {
      if (
        prev &&
        filteredEvents.some((event) =>
          isSameDay(new Date(event.startDate), prev),
        )
      ) {
        return prev;
      }
      return getInitialSelectedDate(filteredEvents);
    });
  }, [filteredEvents]);

  const filtersActive = Boolean(search.trim()) || Boolean(typeFilter);

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("");
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const paddingDays = monthStart.getDay();
  const paddedDays = [
    ...Array(paddingDays).fill(null),
    ...days,
  ] as (Date | null)[];

  const eventsForDate = (date: Date) =>
    filteredEvents
      .filter((event) => isSameDay(new Date(event.startDate), date))
      .sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
      );

  const upcomingEvents = filteredEvents
    .filter((event) => new Date(event.startDate) >= startOfDay(new Date()))
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );

  const selectedEvents = selectedDate ? eventsForDate(selectedDate) : [];

  const monthEventCount = days.reduce(
    (count, day) => count + eventsForDate(day).length,
    0,
  );

  const selectDate = (date: Date) => {
    setSelectedDate(date);
    if (!isSameMonth(date, currentMonth)) {
      setCurrentMonth(startOfMonth(date));
    }
  };

  const visibleLegendTypes = LEGEND_TYPES.filter((type) =>
    isLoggedIn ? true : type !== "TRAINING" && type !== "MEETING",
  );

  return (
    <div className="space-y-6">
      <AnimateIn immediate>
        <EventFiltersToolbar
          search={search}
          onSearchChange={setSearch}
          type={typeFilter}
          onTypeChange={setTypeFilter}
          typeOptions={getEventTypeOptions(isLoggedIn)}
          onClear={filtersActive ? clearFilters : undefined}
          searchPlaceholder="Search events…"
        />
      </AnimateIn>

      <AnimateIn delay={0.05}>
        <div className="grid gap-6 xl:grid-cols-5 xl:items-start">
        <div className="xl:col-span-3">
          <Card className="overflow-hidden p-0">
            <div className="border-b border-white/10 bg-jackals-surface-muted/40 px-4 py-4 sm:px-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl font-semibold tracking-wide text-white sm:text-2xl">
                    {format(currentMonth, "MMMM yyyy")}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    {monthEventCount === 0
                      ? "No events this month"
                      : `${monthEventCount} event${monthEventCount === 1 ? "" : "s"} this month`}
                  </p>
                </div>
                <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/20 p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Previous month"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      setCurrentMonth(today);
                      setSelectedDate(today);
                    }}
                  >
                    Today
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Next month"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                {visibleLegendTypes.map((type) => {
                  const style = getEventTypeStyle(type);
                  return (
                    <span
                      key={type}
                      className="inline-flex items-center gap-1.5 text-xs text-zinc-400"
                    >
                      <span
                        className={cn("h-2 w-2 rounded-full", style.dot)}
                        aria-hidden
                      />
                      {getLegendLabel(type)}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="p-3 sm:p-4">
              <div className="mb-1 grid grid-cols-7 gap-1 sm:gap-1.5">
                {WEEKDAYS.map((day) => (
                  <div
                    key={day}
                    className="py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-zinc-500 sm:text-xs"
                  >
                    <span className="hidden sm:inline">{day}</span>
                    <span className="sm:hidden">{day.charAt(0)}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {paddedDays.map((day, index) =>
                  day ? (
                    <CalendarDayCell
                      key={day.toISOString()}
                      day={day}
                      dayEvents={eventsForDate(day)}
                      isSelected={Boolean(
                        selectedDate && isSameDay(day, selectedDate),
                      )}
                      inCurrentMonth={isSameMonth(day, currentMonth)}
                      onSelect={selectDate}
                    />
                  ) : (
                    <div
                      key={`pad-${index}`}
                      className="min-h-[4.5rem] sm:min-h-[5.5rem]"
                      aria-hidden
                    />
                  ),
                )}
              </div>
            </div>

            <UpNextPreview events={upcomingEvents} onSelectDate={selectDate} />
          </Card>
        </div>

        <div className="xl:col-span-2 xl:sticky xl:top-24">
          <div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Selected day
                </p>
                <h2 className="mt-1 font-display text-xl font-semibold text-white">
                  {selectedDate
                    ? format(selectedDate, "EEEE, d MMMM")
                    : "Pick a date"}
                </h2>
              </div>
              {selectedEvents.length > 0 && (
                <span className="rounded-full bg-jackals-red/15 px-3 py-1 text-xs font-semibold text-jackals-red-light">
                  {selectedEvents.length} event
                  {selectedEvents.length === 1 ? "" : "s"}
                </span>
              )}
            </div>

            {selectedEvents.length === 0 ? (
              <Card className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-zinc-600" />
                <CardDescription>
                  {selectedDate
                    ? filtersActive
                      ? "No matching events on this day. Try clearing your filters."
                      : "Nothing scheduled on this day."
                    : "Select a highlighted date on the calendar to see what's on."}
                </CardDescription>
              </Card>
            ) : (
              <div className="space-y-4">
                {selectedEvents.map((event) => (
                  <EventPreviewCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      </AnimateIn>
    </div>
  );
}
