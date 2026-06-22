"use client";

import { AdminSearchBar } from "@/components/admin/AdminSearchBar";
import { Button } from "@/components/ui/Button";
import { Label, Select } from "@/components/ui/Input";
import {
  EVENT_MONTH_CURRENT,
  EVENT_SOURCE_OPTIONS,
  EVENT_TYPE_OPTIONS,
  EventSourceFilter,
  formatEventMonthFilterLabel,
} from "@/lib/event-filters";
import type { TrainingTeam } from "@/lib/training-teams-config";
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
  monthOptions?: string[];
  trainingTeamKey?: string;
  onTrainingTeamKeyChange?: (value: string) => void;
  trainingSquads?: TrainingTeam[];
  showSource?: boolean;
  showMonth?: boolean;
  showTeam?: boolean;
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
  monthOptions = [],
  trainingTeamKey = "",
  onTrainingTeamKeyChange,
  trainingSquads = [],
  showSource = false,
  showMonth = false,
  showTeam = false,
  onClear,
  searchPlaceholder = "Search title, location, type…",
  className,
  bordered = true,
}: EventFiltersToolbarProps) {
  const showTeamFilter =
    showTeam &&
    onTrainingTeamKeyChange &&
    (!type || type === "TRAINING") &&
    trainingSquads.length > 0;

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
            onChange={(e) => {
              const nextType = e.target.value;
              onTypeChange(nextType);
              if (nextType && nextType !== "TRAINING") {
                onTrainingTeamKeyChange?.("");
              }
            }}
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
        {showTeamFilter && (
          <div>
            <Label htmlFor="event-filter-team">Team</Label>
            <Select
              id="event-filter-team"
              value={trainingTeamKey}
              onChange={(e) => {
                const nextTeam = e.target.value;
                onTrainingTeamKeyChange(nextTeam);
                if (nextTeam && type !== "TRAINING") {
                  onTypeChange("TRAINING");
                }
              }}
            >
              <option value="">All teams</option>
              {trainingSquads.map((squad) => (
                <option key={squad.key} value={squad.key}>
                  {squad.name}
                </option>
              ))}
            </Select>
          </div>
        )}
        {showMonth && onMonthChange && (
          <div>
            <Label htmlFor="event-filter-month">Month</Label>
            <Select
              id="event-filter-month"
              value={month}
              onChange={(e) => onMonthChange(e.target.value)}
            >
              <option value="">All dates</option>
              <option value={EVENT_MONTH_CURRENT}>
                {formatEventMonthFilterLabel(EVENT_MONTH_CURRENT)}
              </option>
              {monthOptions.map((monthKey) => (
                <option key={monthKey} value={monthKey}>
                  {formatEventMonthFilterLabel(monthKey)}
                </option>
              ))}
            </Select>
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
            ? `Showing ${formatEventMonthFilterLabel(month)}.`
            : "Showing all dates."}
        </p>
      )}
    </div>
  );
}
