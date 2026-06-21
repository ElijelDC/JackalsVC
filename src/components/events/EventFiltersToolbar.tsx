"use client";

import { format } from "date-fns";
import { AdminSearchBar } from "@/components/admin/AdminSearchBar";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import {
  EVENT_SOURCE_OPTIONS,
  EVENT_TYPE_OPTIONS,
  EventSourceFilter,
} from "@/lib/event-filters";
import { cn } from "@/lib/utils";

type TypeOption = { value: string; label: string };

type EventFiltersToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  type: string;
  onTypeChange: (value: string) => void;
  typeOptions?: readonly TypeOption[];
  source?: EventSourceFilter;
  onSourceChange?: (value: EventSourceFilter) => void;
  month?: string;
  onMonthChange?: (value: string) => void;
  showSource?: boolean;
  showMonth?: boolean;
  onClear?: () => void;
  searchPlaceholder?: string;
  className?: string;
  bordered?: boolean;
};

export function EventFiltersToolbar({
  search,
  onSearchChange,
  type,
  onTypeChange,
  typeOptions = EVENT_TYPE_OPTIONS,
  source = "all",
  onSourceChange,
  month = "",
  onMonthChange,
  showSource = false,
  showMonth = false,
  onClear,
  searchPlaceholder = "Search title, location, type…",
  className,
  bordered = true,
}: EventFiltersToolbarProps) {
  return (
    <div
      className={cn(
        "space-y-3",
        bordered && "rounded border border-white/10 bg-jackals-surface p-4",
        className,
      )}
    >
      <AdminSearchBar
        value={search}
        onChange={onSearchChange}
        placeholder={searchPlaceholder}
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label htmlFor="event-filter-type">Type</Label>
          <Select
            id="event-filter-type"
            value={type}
            onChange={(e) => onTypeChange(e.target.value)}
          >
            {typeOptions.map(({ value, label }) => (
              <option key={value || "all"} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        {showSource && onSourceChange && (
          <div>
            <Label htmlFor="event-filter-source">Source</Label>
            <Select
              id="event-filter-source"
              value={source}
              onChange={(e) =>
                onSourceChange(e.target.value as EventSourceFilter)
              }
            >
              {EVENT_SOURCE_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
        )}
        {showMonth && onMonthChange && (
          <div>
            <Label htmlFor="event-filter-month">Month</Label>
            <div className="flex gap-2">
              <Input
                id="event-filter-month"
                type="month"
                value={month}
                onChange={(e) => onMonthChange(e.target.value)}
                className="min-w-0 flex-1"
              />
              {month && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onMonthChange("")}
                >
                  All
                </Button>
              )}
            </div>
          </div>
        )}
        {onClear && (
          <div className="flex items-end">
            <Button type="button" variant="outline" size="sm" onClick={onClear}>
              Clear filters
            </Button>
          </div>
        )}
      </div>
      {showMonth && onMonthChange && (
        <p className="text-xs text-zinc-500">
          {month
            ? `Showing ${format(new Date(`${month}-01`), "MMMM yyyy")}. Clear month to see all dates.`
            : "Showing all dates."}
        </p>
      )}
    </div>
  );
}

export function defaultEventMonthFilter() {
  return format(new Date(), "yyyy-MM");
}
