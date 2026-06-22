"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ClipboardList,
  Shield,
  UserRound,
  Users,
} from "lucide-react";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { StaggerIn } from "@/components/motion/StaggerIn";
import {
  TeamMemberAvatar,
  TeamMemberCard,
} from "@/components/teams/TeamMemberCard";
import {
  getSquadPositionFilters,
  playerMatchesPositionFilter,
} from "@/lib/team-positions";
import { splitTeamName } from "@/lib/teams";
import { cn } from "@/lib/utils";

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  position: string | null;
  isCaptain: boolean;
  photoUrl: string | null;
};

export type TeamDetail = {
  id: string;
  name: string;
  level: string;
  description: string;
  details: string | null;
  members: TeamMember[];
};

function SectionHeader({
  icon,
  title,
  count,
}: {
  icon: ReactNode;
  title: string;
  count?: number;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-jackals-red/15 text-jackals-red-light clip-slash-reverse">
          {icon}
        </div>
        <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
          {title}
        </h2>
      </div>
      {count !== undefined && (
        <span className="text-sm font-medium tabular-nums text-zinc-500">
          {count} {count === 1 ? "member" : "members"}
        </span>
      )}
    </div>
  );
}

function SquadPositionFilter({
  options,
  active,
  onChange,
}: {
  options: { value: string; label: string; count: number }[];
  active: string;
  onChange: (value: string) => void;
}) {
  const pills = [{ value: "all", label: "All", count: 0 }, ...options];

  return (
    <div className="-mx-4 mb-5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:mb-6 sm:overflow-visible sm:px-0">
      <div
        className="flex min-w-min gap-2 sm:flex-wrap"
        role="tablist"
        aria-label="Filter squad by position"
      >
        {pills.map((option) => {
          const isActive = active === option.value;

          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(option.value)}
              className={cn(
                "shrink-0 border px-3 py-1.5 text-xs font-medium transition-all duration-200 sm:px-4 sm:py-2 sm:text-sm",
                isActive
                  ? "border-jackals-red/40 bg-jackals-red text-white clip-slash shadow-[0_0_20px_rgba(232,34,42,0.25)]"
                  : "border-white/10 bg-jackals-surface/80 text-zinc-400 hover:border-jackals-red/30 hover:text-white",
              )}
            >
              {option.label}
              {option.value !== "all" && (
                <span
                  className={cn(
                    "ml-1.5 tabular-nums",
                    isActive ? "text-white/80" : "text-zinc-500",
                  )}
                >
                  {option.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SquadSection({ players }: { players: TeamMember[] }) {
  const [positionFilter, setPositionFilter] = useState("all");
  const positionOptions = useMemo(
    () => getSquadPositionFilters(players),
    [players],
  );
  const filteredPlayers = useMemo(
    () =>
      players.filter((player) =>
        playerMatchesPositionFilter(player, positionFilter),
      ),
    [players, positionFilter],
  );
  const showPositionFilter = positionOptions.length > 1;

  return (
    <section>
      <AnimateIn>
        <SectionHeader
          icon={<Users className="h-5 w-5" />}
          title="The squad"
          count={
            positionFilter === "all"
              ? players.length
              : filteredPlayers.length
          }
        />
      </AnimateIn>

      {showPositionFilter && (
        <SquadPositionFilter
          options={positionOptions}
          active={positionFilter}
          onChange={setPositionFilter}
        />
      )}

      {filteredPlayers.length === 0 ? (
        <p className="text-sm text-zinc-400">
          No players in this position. Try another filter.
        </p>
      ) : (
        <StaggerIn
          className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4"
          stagger={70}
        >
          {filteredPlayers.map((player) => (
            <TeamMemberCard
              key={player.id}
              name={player.name}
              subtitle={player.position}
              photoUrl={player.photoUrl}
              variant="player"
              isCaptain={player.isCaptain}
            />
          ))}
        </StaggerIn>
      )}

      {positionFilter !== "all" && filteredPlayers.length > 0 && (
        <p className="mt-4 text-center text-xs text-zinc-500 sm:text-left">
          Showing {filteredPlayers.length} of {players.length} players
        </p>
      )}
    </section>
  );
}

export function TeamDetailView({ team }: { team: TeamDetail }) {
  const coaches = team.members.filter((member) => member.role === "COACH");
  const players = team.members.filter((member) => member.role === "PLAYER");
  const detailParagraphs = team.details
    ?.split(/\n\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const { primary, accent } = splitTeamName(team.name);

  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10 bg-background hero-bg">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(232,34,42,0.18),transparent_70%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 home-hero-grid opacity-30"
        />

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <AnimateIn immediate variant="slide-left">
            <Link
              href="/teams"
              className="mb-8 inline-flex items-center gap-2 border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 backdrop-blur-sm transition-colors hover:border-jackals-red/40 hover:text-jackals-red-light clip-slash-reverse"
            >
              <ArrowLeft className="h-4 w-4" />
              All teams
            </Link>
          </AnimateIn>

          <AnimateIn immediate variant="scale-in" delay={80} className="max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 border border-jackals-red/40 bg-jackals-red/10 px-4 py-2 text-sm font-medium text-jackals-red-light clip-slash-reverse">
              <Shield className="h-4 w-4" />
              {team.level}
            </div>

            <h1 className="font-display text-4xl font-bold tracking-wide text-white sm:text-5xl lg:text-6xl">
              {primary}
              {accent && (
                <>
                  {" "}
                  <span className="bg-gradient-to-r from-jackals-red-light to-jackals-red bg-clip-text text-transparent">
                    {accent}
                  </span>
                </>
              )}
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-zinc-400">
              {team.description}
            </p>

            {(coaches.length > 0 || players.length > 0) && (
              <div className="mt-8 flex flex-wrap items-center gap-6 sm:gap-10">
                {coaches.length > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center bg-jackals-red/15 text-jackals-red-light clip-slash-reverse">
                      <UserRound className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-display text-2xl font-bold text-white">
                        {coaches.length}
                      </p>
                      <p className="text-xs uppercase tracking-wider text-zinc-500">
                        {coaches.length === 1 ? "Coach" : "Coaches"}
                      </p>
                    </div>
                  </div>
                )}
                {players.length > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center bg-jackals-red/15 text-jackals-red-light clip-slash-reverse">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-display text-2xl font-bold text-white">
                        {players.length}
                      </p>
                      <p className="text-xs uppercase tracking-wider text-zinc-500">
                        {players.length === 1 ? "Player" : "Players"}
                      </p>
                    </div>
                  </div>
                )}
                {coaches.length > 0 && (
                  <div className="flex items-center pl-2">
                    <div className="flex -space-x-3">
                      {coaches.slice(0, 4).map((coach) => (
                        <TeamMemberAvatar
                          key={coach.id}
                          name={coach.name}
                          photoUrl={coach.photoUrl}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </AnimateIn>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {detailParagraphs && detailParagraphs.length > 0 && (
          <AnimateIn className="mb-16">
            <article className="motion-hover-lift relative overflow-hidden border border-white/10 bg-jackals-surface/90 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-jackals-red via-jackals-red-light to-jackals-red"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-jackals-red/10 blur-3xl"
              />

              <div className="relative p-6 sm:p-8 lg:p-10">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center bg-jackals-red/15 text-jackals-red-light clip-slash-reverse">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                    About this team
                  </h2>
                </div>

                <div className="space-y-4">
                  {detailParagraphs.map((paragraph, index) => (
                    <p
                      key={index}
                      className="border-l-2 border-jackals-red/40 pl-4 text-base leading-relaxed text-zinc-400"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </article>
          </AnimateIn>
        )}

        {coaches.length > 0 && (
          <section className="mb-16">
            <AnimateIn>
              <SectionHeader
                icon={<UserRound className="h-5 w-5" />}
                title="Coaching staff"
                count={coaches.length}
              />
            </AnimateIn>
            <StaggerIn
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              stagger={90}
            >
              {coaches.map((coach) => (
                <TeamMemberCard
                  key={coach.id}
                  name={coach.name}
                  subtitle={coach.position ?? "Coach"}
                  photoUrl={coach.photoUrl}
                  variant="coach"
                />
              ))}
            </StaggerIn>
          </section>
        )}

        {players.length > 0 && <SquadSection players={players} />}

        {coaches.length === 0 && players.length === 0 && (
          <AnimateIn>
            <div className="relative overflow-hidden border border-dashed border-white/15 bg-jackals-surface/40 px-8 py-16 text-center">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(232,34,42,0.08),transparent_70%)]"
              />
              <Users className="relative mx-auto h-10 w-10 text-jackals-red-light/60" />
              <p className="relative mt-4 font-display text-lg font-semibold text-white">
                Roster coming soon
              </p>
              <p className="relative mt-2 text-sm text-zinc-500">
                Coaches and players will be listed here once the season roster is
                confirmed.
              </p>
            </div>
          </AnimateIn>
        )}
      </div>
    </>
  );
}
