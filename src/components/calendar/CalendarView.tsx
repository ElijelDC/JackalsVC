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
import { EventReminderButton } from "@/components/calendar/EventReminderButton";
import { EventFiltersToolbar } from "@/components/events/EventFiltersToolbar";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import {
  filterEvents,
  getEventTypeLabel,
  getEventTypeOptions,
  type EventListItem,
} from "@/lib/event-filters";
import {
  eventDetailPath,
  formatEventDateTime,
  getEventTypeStyle,
} from "@/lib/event-display";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const LEGEND_TYPES = [
  "FUN",
  "TRAINING",
  "TOURNAMENT",
  "SOCIAL",
  "MEETING",
] as const;

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
  isLoggedIn,
  hasReminder,
  onReminderChange,
}: {
  event: EventListItem;
  isLoggedIn: boolean;
  hasReminder: boolean;
  onReminderChange: (eventId: string, active: boolean) => void;
}) {
  const { timeLabel } = formatEventDateTime(event.startDate, event.endDate);
  const typeStyle = getEventTypeStyle(event.type);

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
          {getEventTypeLabel(event.type)}
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
          {isLoggedIn && (
            <EventReminderButton
              compact
              eventId={event.id}
              initialHasReminder={hasReminder}
              onChange={(active) => onReminderChange(event.id, active)}
            />
          )}
        </div>
      </div>

      <Link
        href={eventDetailPath(event.id)}
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
  const uniqueTypes = [...new Set(dayEvents.map((event) => event.type))];
  const primaryStyle = hasEvents
    ? getEventTypeStyle(dayEvents[0].type)
    : null;
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
          const style = getEventTypeStyle(event.type);
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
                getEventTypeStyle(event.type).dot,
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
  reminderIds = [],
}: {
  events: EventListItem[];
  isLoggedIn?: boolean;
  reminderIds?: string[];
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(() =>
    getInitialSelectedDate(events),
  );
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [reminders, setReminders] = useState<Set<string>>(new Set(reminderIds));

  useEffect(() => {
    setReminders(new Set(reminderIds));
  }, [reminderIds]);

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

  const updateReminder = (eventId: string, active: boolean) => {
    setReminders((prev) => {
      const next = new Set(prev);
      if (active) next.add(eventId);
      else next.delete(eventId);
      return next;
    });
  };

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
        <div className="grid gap-8 xl:grid-cols-5">
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
                      {getEventTypeLabel(type)}
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
          </Card>
        </div>

        <div className="space-y-6 xl:col-span-2">
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
                  <EventPreviewCard
                    key={event.id}
                    event={event}
                    isLoggedIn={isLoggedIn}
                    hasReminder={reminders.has(event.id)}
                    onReminderChange={updateReminder}
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
                Coming up
              </h3>
              {filtersActive && (
                <span className="text-xs text-zinc-600">
                  {upcomingEvents.length} shown
                </span>
              )}
            </div>

            <div className="space-y-2">
              {upcomingEvents.length === 0 ? (
                <Card>
                  <CardDescription>
                    {filtersActive
                      ? "No upcoming events match your filters."
                      : "No upcoming events scheduled."}
                  </CardDescription>
                </Card>
              ) : (
                upcomingEvents.slice(0, 10).map((event) => {
                  const style = getEventTypeStyle(event.type);
                  const eventDate = new Date(event.startDate);
                  const isActive =
                    selectedDate && isSameDay(eventDate, selectedDate);

                  return (
                    <div
                      key={event.id}
                      className={cn(
                        "overflow-hidden rounded-lg border transition-colors",
                        isActive
                          ? "border-jackals-red/40 bg-jackals-red/5"
                          : "border-white/10 bg-jackals-surface/60 hover:border-white/20",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => selectDate(eventDate)}
                        className="flex w-full items-start gap-3 px-4 py-3 text-left"
                      >
                        <div
                          className={cn(
                            "mt-0.5 flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-md border text-center",
                            style.cell,
                            style.accent,
                          )}
                        >
                          <span className="text-[10px] font-semibold uppercase leading-none text-zinc-400">
                            {format(eventDate, "MMM")}
                          </span>
                          <span className="text-lg font-bold leading-tight text-white">
                            {format(eventDate, "d")}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate font-medium text-white">
                              {event.title}
                            </p>
                            <span
                              className={cn(
                                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                                style.badge,
                              )}
                            >
                              {getEventTypeLabel(event.type)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-zinc-500">
                            {format(eventDate, "EEEE · HH:mm")}
                            {event.location ? ` · ${event.location}` : ""}
                          </p>
                        </div>
                      </button>
                      <div className="border-t border-white/5 px-4 py-2">
                        <Link
                          href={eventDetailPath(event.id)}
                          className="text-xs font-medium text-jackals-red-light/80 transition-colors hover:text-jackals-red-light"
                        >
                          View full details →
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
      </AnimateIn>
    </div>
  );
}
