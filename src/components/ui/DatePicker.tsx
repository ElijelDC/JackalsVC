"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  format,
  isToday,
  getDate,
  getDaysInMonth,
  startOfMonth,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

type DatePickerProps = {
  id?: string;
  value: string;
  onChange: (date: string) => void;
  label?: string;
};

export function DatePicker({ id, value, onChange, label }: DatePickerProps) {
  const pickerId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(() => {
    if (value) {
      return new Date(value);
    }
    return new Date();
  });

  const currentDate = value ? new Date(value) : null;
  const formattedDate = value ? format(new Date(value), "MMM d, yyyy") : "";

  useEffect(() => {
    if (!pickerOpen) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        containerRef.current?.contains(target) ||
        pickerRef.current?.contains(target)
      ) {
        return;
      }
      setPickerOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setPickerOpen(false);
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [pickerOpen]);

  const firstDay = startOfMonth(pickerMonth);
  const daysInMonth = getDaysInMonth(pickerMonth);
  const startingDayOfWeek = firstDay.getDay();
  const days = [];

  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }

  // Add days of month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth(), day));
  }

  const handleDateSelect = (day: Date) => {
    onChange(format(day, "yyyy-MM-dd"));
    setPickerOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setPickerOpen(false);
  };

  const prevMonth = () => setPickerMonth(subMonths(pickerMonth, 1));
  const nextMonth = () => setPickerMonth(addMonths(pickerMonth, 1));
  const today = () => {
    const now = new Date();
    setPickerMonth(now);
    handleDateSelect(now);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setPickerOpen(!pickerOpen)}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition-all",
        "hover:border-jackals-red/30 hover:bg-white/8",
        "focus:outline-none focus:ring-2 focus:ring-jackals-red/50",
        pickerOpen && "border-jackals-red/30 bg-white/8",
        )}
      >
        <span className={formattedDate ? "text-white" : "text-zinc-500"}>
          {formattedDate || "Select date"}
        </span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", pickerOpen && "rotate-180")} />
      </button>

      {pickerOpen &&
        createPortal(
          <div
            ref={pickerRef}
            className="fixed z-50 rounded-lg border border-white/10 bg-zinc-900 p-4 shadow-lg"
            style={{
              top: containerRef.current
                ? containerRef.current.getBoundingClientRect().bottom + 8
                : 0,
              left: containerRef.current
                ? containerRef.current.getBoundingClientRect().left
                : 0,
              minWidth: "300px",
            }}
          >
            {/* Month/Year Header */}
            <div className="mb-4 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={prevMonth}
                className="rounded p-1 hover:bg-white/10"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex-1 text-center text-sm font-medium">
                {format(pickerMonth, "MMMM yyyy")}
              </div>
              <button
                type="button"
                onClick={nextMonth}
                className="rounded p-1 hover:bg-white/10"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Weekday Headers */}
            <div className="mb-2 grid grid-cols-7 gap-1">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-zinc-500"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="mb-4 grid grid-cols-7 gap-1">
              {days.map((day, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => day && handleDateSelect(day)}
                  disabled={!day}
                  className={cn(
                    "h-8 rounded text-xs font-medium transition-all",
                    !day && "invisible",
                    day &&
                      !isSameDay(day, currentDate) &&
                      "text-white hover:bg-white/10",
                    day &&
                      isSameDay(day, currentDate) &&
                      "bg-jackals-red text-white hover:bg-jackals-red-dark",
                    day &&
                      isToday(day) &&
                      !isSameDay(day, currentDate) &&
                      "ring-1 ring-jackals-red/40",
                  )}
                >
                  {day ? getDate(day) : ""}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={today}
                className="flex-1"
              >
                Today
              </Button>
              {value && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleClear}
                  className="flex-1 text-zinc-400 hover:text-red-400"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
