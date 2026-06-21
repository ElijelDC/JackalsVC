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
} from "date-fns";
import { ChevronLeft, ChevronRight, Clock, MapPin, User } from "lucide-react";
import { AddToCalendarActions } from "@/components/calendar/AddToCalendarActions";
import { EventReminderButton } from "@/components/calendar/EventReminderButton";
import { EventFiltersToolbar } from "@/components/events/EventFiltersToolbar";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import {
  filterEvents,
  getEventTypeLabel,
  getEventTypeOptions,
  type EventListItem,
} from "@/lib/event-filters";
import { eventDetailPath, formatEventDateTime } from "@/lib/event-display";
import { cn } from "@/lib/utils";

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
  const typeColors: Record<string, string> = {
    TRAINING: "bg-blue-500/15 text-blue-400",
    FUN: "bg-amber-500/15 text-amber-400",
    TOURNAMENT: "bg-jackals-red/15 text-jackals-red-light",
    SOCIAL: "bg-purple-500/15 text-purple-400",
    MEETING: "bg-green-500/15 text-green-400",
  };
  const typeColor = typeColors[event.type] ?? "bg-zinc-500/15 text-zinc-400";

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-start justify-between gap-2 p-6 pb-0">
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-medium",
            typeColor,
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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [reminders, setReminders] = useState<Set<string>>(new Set(reminderIds));

  useEffect(() => {
    setReminders(new Set(reminderIds));
  }, [reminderIds]);

  const updateReminder = (eventId: string, active: boolean) => {
    setReminders((prev) => {
      const next = new Set(prev);
      if (active) next.add(eventId);
      else next.delete(eventId);
      return next;
    });
  };

  const filteredEvents = useMemo(
    () => filterEvents(events, { search, type: typeFilter }),
    [events, search, typeFilter],
  );

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
    filteredEvents.filter((e) => isSameDay(new Date(e.startDate), date));

  const upcomingEvents = filteredEvents.filter(
    (event) => new Date(event.startDate) >= new Date(),
  );

  const selectedEvents = selectedDate ? eventsForDate(selectedDate) : [];

  const typeColors: Record<string, string> = {
    TRAINING: "bg-blue-500/15 text-blue-400",
    FUN: "bg-amber-500/15 text-amber-400",
    TOURNAMENT: "bg-jackals-red/15 text-jackals-red-light",
    SOCIAL: "bg-purple-500/15 text-purple-400",
    MEETING: "bg-green-500/15 text-green-400",
  };

  const typeColor = (type: string) =>
    typeColors[type] ?? "bg-zinc-500/15 text-zinc-400";

  return (
    <div className="space-y-6">
      <EventFiltersToolbar
        search={search}
        onSearchChange={setSearch}
        type={typeFilter}
        onTypeChange={setTypeFilter}
        typeOptions={getEventTypeOptions(isLoggedIn)}
        onClear={filtersActive ? clearFilters : undefined}
        searchPlaceholder="Search events…"
      />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="p-4 sm:p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                {format(currentMonth, "MMMM yyyy")}
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date())}
                >
                  Today
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-zinc-500">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="py-2">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {paddedDays.map((day, i) => {
                if (!day) {
                  return <div key={`pad-${i}`} className="aspect-square" />;
                }

                const dayEvents = eventsForDate(day);
                const isSelected = selectedDate && isSameDay(day, selectedDate);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "aspect-square rounded-lg p-1 text-sm transition-colors",
                      isSelected
                        ? "bg-jackals-red text-white"
                        : isToday(day)
                          ? "bg-jackals-red/20 text-jackals-red-light"
                          : isSameMonth(day, currentMonth)
                            ? "text-zinc-300 hover:bg-white/5"
                            : "text-zinc-600",
                    )}
                  >
                    <span className="block">{format(day, "d")}</span>
                    {dayEvents.length > 0 && (
                      <span className="mx-auto mt-0.5 block h-1 w-1 rounded-full bg-jackals-red-light" />
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        <div>
          <h2 className="mb-4 text-lg font-semibold text-white">
            {selectedDate
              ? format(selectedDate, "EEEE, d MMMM")
              : "Select a date"}
          </h2>

          {selectedEvents.length === 0 ? (
            <Card>
              <CardDescription>
                {selectedDate
                  ? filtersActive
                    ? "No matching events on this day."
                    : "No events on this day."
                  : "Click a date to see events."}
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

          <div className="mt-8">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
              All upcoming
              {filtersActive ? ` (${upcomingEvents.length} shown)` : ""}
            </h3>
            <div className="space-y-3">
              {upcomingEvents.length === 0 ? (
                <Card>
                  <CardDescription>
                    {filtersActive
                      ? "No upcoming events match your filters."
                      : "No upcoming events."}
                  </CardDescription>
                </Card>
              ) : (
                upcomingEvents.slice(0, 8).map((event) => (
                  <Link
                    key={event.id}
                    href={eventDetailPath(event.id)}
                    className="flex items-center justify-between rounded-lg border border-white/10 px-4 py-3 transition-colors hover:border-jackals-red/30 hover:bg-white/5"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">
                        {event.title}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {format(new Date(event.startDate), "d MMM yyyy · HH:mm")}
                        {event.location ? ` · ${event.location}` : ""}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs",
                        typeColor(event.type),
                      )}
                    >
                      {getEventTypeLabel(event.type)}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
