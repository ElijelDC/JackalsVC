"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  format,
  isSameMonth,
  startOfMonth,
} from "date-fns";
import { ChevronDown, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  ALL_MONTHS_PARAM,
  formatTrainingMonthParam,
  getAdjacentTrainingMonths,
  isAllMonthsParam,
  parseTrainingMonthParam,
} from "@/lib/training-teams-config";
import { cn } from "@/lib/utils";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

type MonthNavigatorProps = {
  trailing?: React.ReactNode;
  className?: string;
  showAllMonthsOption?: boolean;
} & (
  | {
      month: Date;
      onMonthChange: (month: Date) => void;
      monthParam?: never;
      onMonthParamChange?: never;
    }
  | {
      monthParam: string;
      onMonthParamChange: (monthParam: string) => void;
      month?: never;
      onMonthChange?: never;
    }
);

export function MonthNavigator({
  trailing,
  className,
  showAllMonthsOption = false,
  ...props
}: MonthNavigatorProps) {
  const usesParamMode = "monthParam" in props && props.monthParam !== undefined;
  const monthParam = usesParamMode ? props.monthParam : undefined;
  const isAllMonths = usesParamMode && isAllMonthsParam(monthParam);
  const month = usesParamMode
    ? parseTrainingMonthParam(isAllMonths ? undefined : monthParam)
    : props.month;

  const pickerId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => month.getFullYear());

  const { previous, next } = getAdjacentTrainingMonths(month);
  const monthLabel = isAllMonths ? "All months" : format(month, "MMMM yyyy");
  const isCurrentMonth = !isAllMonths && isSameMonth(month, new Date());
  const now = new Date();

  useEffect(() => {
    if (pickerOpen) {
      setPickerYear(month.getFullYear());
    }
  }, [pickerOpen, month]);

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

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [pickerOpen]);

  const navigateToMonth = (target: Date) => {
    if (usesParamMode) {
      props.onMonthParamChange(formatTrainingMonthParam(target));
    } else {
      props.onMonthChange(target);
    }
  };

  const selectMonth = (monthIndex: number) => {
    navigateToMonth(startOfMonth(new Date(pickerYear, monthIndex, 1)));
    setPickerOpen(false);
  };

  const selectAllMonths = () => {
    if (usesParamMode) {
      props.onMonthParamChange(ALL_MONTHS_PARAM);
    }
    setPickerOpen(false);
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start sm:gap-3">
        <div className="flex items-center gap-1">
          {!isAllMonths && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateToMonth(previous)}
              aria-label="Previous month"
              className="h-9 w-9 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}

          <div ref={containerRef} className="relative min-w-[10rem] px-2">
            <button
              type="button"
              aria-expanded={pickerOpen}
              aria-controls={pickerId}
              onClick={() => setPickerOpen((open) => !open)}
              className="group w-full rounded-md px-1 py-1 text-center transition-colors hover:bg-white/5 sm:text-left"
            >
              <div className="flex items-center justify-center gap-1 sm:justify-start">
                <span className="font-display text-base font-semibold text-white group-hover:text-jackals-red-light">
                  {monthLabel}
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-zinc-500 transition-transform group-hover:text-jackals-red-light",
                    pickerOpen && "rotate-180 text-jackals-red-light",
                  )}
                />
              </div>
              {isCurrentMonth && (
                <p className="text-[11px] font-medium uppercase tracking-wider text-jackals-red-light">
                  Current month
                </p>
              )}
            </button>

            {pickerOpen &&
              createPortal(
                <div
                  ref={pickerRef}
                  id={pickerId}
                  role="dialog"
                  aria-label="Choose month"
                  className="fixed z-[100] w-[min(18rem,calc(100vw-2rem))] border border-white/10 bg-background p-4 shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
                  style={(() => {
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (!rect) return { top: 0, left: 0 };

                    const top = rect.bottom + 8;
                    const left = Math.min(
                      Math.max(16, rect.left),
                      window.innerWidth - 16 - 288,
                    );

                    return { top, left };
                  })()}
                >
                  {showAllMonthsOption && usesParamMode && (
                    <>
                      <button
                        type="button"
                        onClick={selectAllMonths}
                        className={cn(
                          "mb-3 w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors",
                          isAllMonths
                            ? "bg-jackals-red text-white"
                            : "text-zinc-300 hover:bg-white/5 hover:text-white",
                        )}
                      >
                        All months
                      </button>
                      <div className="mb-3 border-t border-white/10" />
                    </>
                  )}

                  <div className="mb-3 flex items-center justify-between">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      aria-label="Previous year"
                      onClick={() => setPickerYear((year) => year - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <p className="font-display text-sm font-semibold text-white">
                      {pickerYear}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      aria-label="Next year"
                      onClick={() => setPickerYear((year) => year + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {MONTHS.map((label, index) => {
                      const optionDate = startOfMonth(
                        new Date(pickerYear, index, 1),
                      );
                      const selected =
                        !isAllMonths && isSameMonth(optionDate, month);
                      const current = isSameMonth(optionDate, now);

                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => selectMonth(index)}
                          className={cn(
                            "rounded-md px-2 py-2 text-sm font-medium transition-colors",
                            selected
                              ? "bg-jackals-red text-white"
                              : current
                                ? "border border-jackals-red/40 bg-jackals-red/10 text-jackals-red-light hover:bg-jackals-red/20"
                                : "text-zinc-300 hover:bg-white/5 hover:text-white",
                          )}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>,
                document.body,
              )}
          </div>

          {!isAllMonths && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateToMonth(next)}
              aria-label="Next month"
              className="h-9 w-9 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        {!isAllMonths && !isCurrentMonth && (
          <button
            type="button"
            onClick={() => navigateToMonth(startOfMonth(now))}
            aria-label="Return to current month"
            className="group inline-flex shrink-0 items-center gap-1 rounded-full border border-jackals-red/30 bg-jackals-red/10 px-2 py-1 text-[11px] font-medium text-jackals-red-light transition-all hover:border-jackals-red/50 hover:bg-jackals-red/20 hover:text-white"
          >
            <RotateCcw className="h-3 w-3 transition-transform group-hover:-rotate-45" />
            Current month
          </button>
        )}
      </div>

      {trailing}
    </div>
  );
}
