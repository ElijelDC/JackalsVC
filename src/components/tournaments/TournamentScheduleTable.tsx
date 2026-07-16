"use client";

import { useMemo, useState } from "react";
import { ShowcaseCard } from "@/components/layout/ShowcaseCard";
import { Button } from "@/components/ui/Button";
import { Label, Select } from "@/components/ui/Input";
import type { TournamentScheduleRow } from "@/lib/tournament-hub-config";
import { cn } from "@/lib/utils";

type ScheduleView = "all" | "pool-a" | "pool-b" | "games";

type TeamSlotRole = "playing" | "refereeing";

type TeamSlot = {
  time: string;
  match: string;
  court: string;
  referee: string;
  role: TeamSlotRole;
};

const GRACE_MINUTES = 2;

/** Slot times are court/arrival times; match start is +2 minutes. */
function getMatchStartTime(slotTime: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(slotTime.trim());
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  const total = hours * 60 + minutes + GRACE_MINUTES;
  const startHours = Math.floor(total / 60) % 24;
  const startMinutes = total % 60;
  return `${String(startHours).padStart(2, "0")}:${String(startMinutes).padStart(2, "0")}`;
}

function SlotTime({
  time,
  compact = false,
}: {
  time: string;
  compact?: boolean;
}) {
  const matchStart = getMatchStartTime(time);

  if (!matchStart) {
    return (
      <span className="font-display text-base font-bold tracking-wide text-white">
        {time}
      </span>
    );
  }

  if (compact) {
    return (
      <div className="leading-tight">
        <p className="font-display text-base font-bold tracking-wide text-white">
          {time}
        </p>
        <p className="mt-0.5 text-[11px] font-medium text-jackals-red-light">
          Start {matchStart}
        </p>
      </div>
    );
  }

  return (
    <div className="leading-tight">
      <p className="font-display text-lg font-bold tracking-wide text-white">
        {time}
      </p>
      <p className="mt-1 text-xs text-zinc-400">
        2 min grace ·{" "}
        <span className="font-semibold text-jackals-red-light">
          match starts {matchStart}
        </span>
      </p>
    </div>
  );
}

const VIEW_OPTIONS: { value: ScheduleView; label: string }[] = [
  { value: "all", label: "Full schedule" },
  { value: "pool-a", label: "Pool A" },
  { value: "pool-b", label: "Pool B" },
  { value: "games", label: "My Games" },
];

function teamsFromMatch(match: string) {
  return match
    .split(" vs ")
    .map((part) => part.trim())
    .filter(Boolean);
}

function matchIncludesTeam(match: string, team: string) {
  return teamsFromMatch(match).includes(team);
}

function collectTeams(schedule: TournamentScheduleRow[]) {
  const teams = new Set<string>();
  for (const row of schedule) {
    for (const team of teamsFromMatch(row.court1)) teams.add(team);
    for (const team of teamsFromMatch(row.court2)) teams.add(team);
    if (row.refereePoolA && row.refereePoolA !== "—") {
      teams.add(row.refereePoolA);
    }
    if (row.refereePoolB && row.refereePoolB !== "—") {
      teams.add(row.refereePoolB);
    }
  }
  return [...teams].sort((a, b) => a.localeCompare(b));
}

function parseSlotMinutes(time: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return Number.MAX_SAFE_INTEGER;
  return Number(match[1]) * 60 + Number(match[2]);
}

function getTeamSlots(
  schedule: TournamentScheduleRow[],
  team: string,
): TeamSlot[] {
  const slots: TeamSlot[] = [];

  for (const row of schedule) {
    if (matchIncludesTeam(row.court1, team)) {
      slots.push({
        time: row.time,
        match: row.court1,
        court: "Court 1",
        referee: row.refereePoolB,
        role: "playing",
      });
    }
    if (matchIncludesTeam(row.court2, team)) {
      slots.push({
        time: row.time,
        match: row.court2,
        court: "Court 2",
        referee: row.refereePoolA,
        role: "playing",
      });
    }
    if (row.refereePoolB === team) {
      slots.push({
        time: row.time,
        match: row.court1,
        court: "Court 1",
        referee: team,
        role: "refereeing",
      });
    }
    if (row.refereePoolA === team) {
      slots.push({
        time: row.time,
        match: row.court2,
        court: "Court 2",
        referee: team,
        role: "refereeing",
      });
    }
  }

  return slots.sort((a, b) => {
    const timeDiff = parseSlotMinutes(a.time) - parseSlotMinutes(b.time);
    if (timeDiff !== 0) return timeDiff;
    if (a.role === b.role) return a.court.localeCompare(b.court);
    return a.role === "playing" ? -1 : 1;
  });
}

function RoleBadge({ role }: { role: TeamSlotRole }) {
  const isPlaying = role === "playing";
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
        isPlaying
          ? "bg-jackals-red/20 text-jackals-red-light"
          : "bg-white/10 text-zinc-200",
      )}
    >
      {isPlaying ? "Playing" : "Refereeing"}
    </span>
  );
}

function SlotCard({
  row,
  view,
}: {
  row: TournamentScheduleRow;
  view: "all" | "pool-a" | "pool-b";
}) {
  return (
    <article
      className={cn(
        "border border-white/10 p-4",
        row.highlight ? "bg-jackals-red/15" : "bg-white/[0.02]",
      )}
    >
      <SlotTime time={row.time} />

      {view === "all" ? (
        <div className="mt-3 space-y-3">
          <div className="border-l-2 border-jackals-red-light/70 pl-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Court 1 · Pool A
            </p>
            <p className="mt-1 text-sm font-medium text-white">{row.court1}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
              Referee:{" "}
              <span className="text-zinc-300">{row.refereePoolB}</span>
              <span className="text-zinc-500"> (Pool B team)</span>
            </p>
          </div>
          <div className="border-l-2 border-white/25 pl-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Court 2 · Pool B
            </p>
            <p className="mt-1 text-sm font-medium text-white">{row.court2}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
              Referee:{" "}
              <span className="text-zinc-300">{row.refereePoolA}</span>
              <span className="text-zinc-500"> (Pool A team)</span>
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              {view === "pool-a" ? "Match · Court 1" : "Match · Court 2"}
            </p>
            <p className="mt-1 text-sm font-medium text-white">
              {view === "pool-a" ? row.court1 : row.court2}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Referee
            </p>
            <p className="mt-1 text-sm text-zinc-300">
              {view === "pool-a" ? row.refereePoolB : row.refereePoolA}
            </p>
          </div>
        </div>
      )}
    </article>
  );
}

function TeamSlotCard({ slot }: { slot: TeamSlot }) {
  const isPlaying = slot.role === "playing";

  return (
    <article
      className={cn(
        "border p-4",
        isPlaying
          ? "border-jackals-red/35 bg-jackals-red/10"
          : "border-white/10 bg-white/[0.02]",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <SlotTime time={slot.time} />
        <RoleBadge role={slot.role} />
      </div>
      <div className="mt-3 space-y-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            {isPlaying ? "Your match" : "Match you are refereeing"}
          </p>
          <p className="mt-1 text-sm font-medium text-white">{slot.match}</p>
        </div>
        <p className="text-sm text-zinc-400">{slot.court}</p>
        {isPlaying ? (
          <p className="text-sm text-zinc-400">
            Referee: <span className="text-zinc-300">{slot.referee}</span>
          </p>
        ) : null}
      </div>
    </article>
  );
}

function DesktopTable({
  schedule,
  view,
}: {
  schedule: TournamentScheduleRow[];
  view: "all" | "pool-a" | "pool-b";
}) {
  if (view === "all") {
    return (
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.04] text-xs uppercase tracking-wider text-zinc-400">
            <th className="px-4 py-4 font-semibold">
              Court time
              <span className="mt-1 block font-normal normal-case tracking-normal text-zinc-500">
                Match start +2 min
              </span>
            </th>
            <th className="px-4 py-4 font-semibold">Court 1 · Pool A</th>
            <th className="px-4 py-4 font-semibold">Referee (Pool B)</th>
            <th className="px-4 py-4 font-semibold">Court 2 · Pool B</th>
            <th className="px-4 py-4 font-semibold">Referee (Pool A)</th>
          </tr>
        </thead>
        <tbody>
          {schedule.map((row, index) => (
            <tr
              key={row.time}
              className={cn(
                "border-b border-white/5 transition-colors",
                row.highlight
                  ? "bg-jackals-red/15 text-zinc-100"
                  : "text-zinc-300 hover:bg-white/[0.03]",
                !row.highlight && index % 2 === 1 && "bg-white/[0.015]",
              )}
            >
              <td className="px-4 py-3.5">
                <SlotTime time={row.time} compact />
              </td>
              <td className="px-4 py-3.5 font-medium">{row.court1}</td>
              <td className="px-4 py-3.5 text-zinc-400">{row.refereePoolB}</td>
              <td className="px-4 py-3.5 font-medium">{row.court2}</td>
              <td className="px-4 py-3.5 text-zinc-400">{row.refereePoolA}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <table className="w-full border-collapse text-left text-sm">
      <thead>
        <tr className="border-b border-white/10 bg-white/[0.04] text-xs uppercase tracking-wider text-zinc-400">
          <th className="px-4 py-4 font-semibold">
            Court time
            <span className="mt-1 block font-normal normal-case tracking-normal text-zinc-500">
              Match start +2 min
            </span>
          </th>
          <th className="px-4 py-4 font-semibold">
            {view === "pool-a" ? "Match · Court 1" : "Match · Court 2"}
          </th>
          <th className="px-4 py-4 font-semibold">Referee</th>
        </tr>
      </thead>
      <tbody>
        {schedule.map((row, index) => (
          <tr
            key={row.time}
            className={cn(
              "border-b border-white/5 transition-colors",
              row.highlight
                ? "bg-jackals-red/15 text-zinc-100"
                : "text-zinc-300 hover:bg-white/[0.03]",
              !row.highlight && index % 2 === 1 && "bg-white/[0.015]",
            )}
          >
            <td className="px-4 py-3.5">
              <SlotTime time={row.time} compact />
            </td>
            <td className="px-4 py-3.5 font-medium">
              {view === "pool-a" ? row.court1 : row.court2}
            </td>
            <td className="px-4 py-3.5 text-zinc-400">
              {view === "pool-a" ? row.refereePoolB : row.refereePoolA}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TeamSlotsTable({ slots }: { slots: TeamSlot[] }) {
  return (
    <table className="w-full border-collapse text-left text-sm">
      <thead>
        <tr className="border-b border-white/10 bg-white/[0.04] text-xs uppercase tracking-wider text-zinc-400">
          <th className="px-4 py-4 font-semibold">
            Court time
            <span className="mt-1 block font-normal normal-case tracking-normal text-zinc-500">
              Match start +2 min
            </span>
          </th>
          <th className="px-4 py-4 font-semibold">Role</th>
          <th className="px-4 py-4 font-semibold">Match</th>
          <th className="px-4 py-4 font-semibold">Court</th>
          <th className="px-4 py-4 font-semibold">Referee</th>
        </tr>
      </thead>
      <tbody>
        {slots.map((slot, index) => (
          <tr
            key={`${slot.time}-${slot.court}-${slot.role}`}
            className={cn(
              "border-b border-white/5 transition-colors",
              slot.role === "playing"
                ? "bg-jackals-red/10 text-zinc-200"
                : "text-zinc-300 hover:bg-white/[0.03]",
              slot.role !== "playing" &&
                index % 2 === 1 &&
                "bg-white/[0.015]",
            )}
          >
            <td className="px-4 py-3.5">
              <SlotTime time={slot.time} compact />
            </td>
            <td className="px-4 py-3.5">
              <RoleBadge role={slot.role} />
            </td>
            <td className="px-4 py-3.5 font-medium text-white">{slot.match}</td>
            <td className="px-4 py-3.5 text-zinc-400">{slot.court}</td>
            <td className="px-4 py-3.5 text-zinc-400">
              {slot.role === "playing" ? slot.referee : "You"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function TournamentScheduleTable({
  schedule,
}: {
  schedule: TournamentScheduleRow[];
}) {
  const [view, setView] = useState<ScheduleView>("all");
  const [selectedTeam, setSelectedTeam] = useState("");

  const teams = useMemo(() => collectTeams(schedule), [schedule]);
  const teamSlots = useMemo(
    () => (selectedTeam ? getTeamSlots(schedule, selectedTeam) : []),
    [schedule, selectedTeam],
  );

  const showingTeamView = view === "games";
  const playingCount = teamSlots.filter((slot) => slot.role === "playing").length;
  const refereeingCount = teamSlots.filter(
    (slot) => slot.role === "refereeing",
  ).length;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-jackals-red/25 bg-jackals-red/10 px-4 py-3 text-center text-sm leading-relaxed text-zinc-300">
        <span className="font-semibold text-white">2-minute grace period:</span>{" "}
        a <span className="text-white">10:00</span> slot means be ready at 10:00 —
        the match starts strictly at{" "}
        <span className="font-semibold text-jackals-red-light">10:02</span>. If a
        team is not present by the strict start time, they forfeit the match.
      </div>

      <div
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
        role="group"
        aria-label="Schedule filter"
      >
        {VIEW_OPTIONS.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={view === option.value ? "primary" : "outline"}
            className="w-full px-2 text-xs sm:text-sm"
            onClick={() => setView(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {view === "pool-a" ? (
        <p className="text-center text-sm text-zinc-400">
          Pool A matches on Court 1, with the team refereeing each game.
        </p>
      ) : null}
      {view === "pool-b" ? (
        <p className="text-center text-sm text-zinc-400">
          Pool B matches on Court 2, with the team refereeing each game.
        </p>
      ) : null}

      {showingTeamView ? (
        <div className="mx-auto w-full max-w-md space-y-3">
          <div>
            <Label htmlFor="team-filter">Your team</Label>
            <Select
              id="team-filter"
              value={selectedTeam}
              onChange={(event) => setSelectedTeam(event.target.value)}
            >
              <option value="" disabled>
                Select your team
              </option>
              {teams.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </Select>
          </div>
          {selectedTeam ? (
            <p className="text-center text-sm text-zinc-400">
              <span className="text-white">{selectedTeam}</span>
              {" · "}
              <span className="text-jackals-red-light">
                {playingCount} playing
              </span>
              {" · "}
              <span className="text-zinc-300">{refereeingCount} refereeing</span>
            </p>
          ) : (
            <p className="text-center text-sm text-zinc-500">
              Choose your team to see your matches and referee slots.
            </p>
          )}
        </div>
      ) : null}

      {showingTeamView ? (
        selectedTeam ? (
          teamSlots.length > 0 ? (
            <>
              <div className="space-y-3 md:hidden">
                {teamSlots.map((slot) => (
                  <TeamSlotCard
                    key={`${slot.time}-${slot.court}-${slot.role}`}
                    slot={slot}
                  />
                ))}
              </div>
              <ShowcaseCard
                padding={false}
                interactive={false}
                className="hidden overflow-hidden md:block"
              >
                <TeamSlotsTable slots={teamSlots} />
              </ShowcaseCard>
            </>
          ) : (
            <p className="py-8 text-center text-sm text-zinc-500">
              No games or referee slots found for this team.
            </p>
          )
        ) : null
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {schedule.map((row) => (
              <SlotCard key={row.time} row={row} view={view} />
            ))}
          </div>
          <ShowcaseCard
            padding={false}
            interactive={false}
            className="hidden overflow-hidden md:block"
          >
            <DesktopTable schedule={schedule} view={view} />
          </ShowcaseCard>
        </>
      )}
    </div>
  );
}
