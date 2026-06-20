"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
import { Bell, BellOff, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { apiDelete, apiPost } from "@/lib/client-api";
import { cn } from "@/lib/utils";

type EventItem = {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  type: string;
  location: string | null;
};

export function CalendarView({
  events,
  reminderIds,
}: {
  events: EventItem[];
  reminderIds: string[];
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [reminders, setReminders] = useState<Set<string>>(new Set(reminderIds));
  const [loading, setLoading] = useState<string | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const paddingDays = monthStart.getDay();
  const paddedDays = [
    ...Array(paddingDays).fill(null),
    ...days,
  ] as (Date | null)[];

  const eventsForDate = (date: Date) =>
    events.filter((e) => isSameDay(new Date(e.startDate), date));

  const selectedEvents = selectedDate ? eventsForDate(selectedDate) : [];

  const toggleReminder = async (eventId: string) => {
    if (!session) {
      router.push("/login?callbackUrl=/calendar");
      return;
    }

    setLoading(eventId);
    const hasReminder = reminders.has(eventId);

    if (hasReminder) {
      const result = await apiDelete(`/api/reminders?eventId=${eventId}`);
      if (result.ok) {
        setReminders((prev) => {
          const next = new Set(prev);
          next.delete(eventId);
          return next;
        });
      }
    } else {
      const result = await apiPost("/api/reminders", { eventId });
      if (result.ok) {
        setReminders((prev) => new Set(prev).add(eventId));
      }
    }

    setLoading(null);
  };

  const typeColors: Record<string, string> = {
    TRAINING: "bg-blue-500/15 text-blue-400",
    TOURNAMENT: "bg-jackals-red/15 text-jackals-red-light",
    SOCIAL: "bg-purple-500/15 text-purple-400",
    MEETING: "bg-green-500/15 text-green-400",
  };

  return (
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
                ? "No events on this day."
                : "Click a date to see events."}
            </CardDescription>
          </Card>
        ) : (
          <div className="space-y-4">
            {selectedEvents.map((event) => (
              <Card key={event.id}>
                <div className="mb-2 flex items-start justify-between gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      typeColors[event.type] ?? "bg-zinc-700 text-zinc-300",
                    )}
                  >
                    {event.type}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={loading === event.id}
                    onClick={() => toggleReminder(event.id)}
                    title={
                      reminders.has(event.id)
                        ? "Remove reminder"
                        : "Set reminder"
                    }
                  >
                    {reminders.has(event.id) ? (
                      <BellOff className="h-4 w-4 text-jackals-red-light" />
                    ) : (
                      <Bell className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <CardTitle>{event.title}</CardTitle>
                {event.description && (
                  <CardDescription className="mt-2">
                    {event.description}
                  </CardDescription>
                )}
                {event.location && (
                  <div className="mt-2 flex items-center gap-1.5 text-sm text-zinc-500">
                    <MapPin className="h-3.5 w-3.5" />
                    {event.location}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            All upcoming
          </h3>
          <div className="space-y-3">
            {events.slice(0, 5).map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between rounded-lg border border-white/10 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-white">{event.title}</p>
                  <p className="text-xs text-zinc-500">
                    {format(new Date(event.startDate), "d MMM yyyy")}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs",
                    typeColors[event.type] ?? "bg-zinc-700 text-zinc-300",
                  )}
                >
                  {event.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
