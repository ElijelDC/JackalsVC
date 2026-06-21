import Link from "next/link";
import { ArrowRight, UserRound, Users } from "lucide-react";
import { TeamMemberAvatar } from "@/components/teams/TeamMemberCard";
import { countTeamMembers, splitTeamName } from "@/lib/teams";

export type TeamCardData = {
  id: string;
  name: string;
  level: string;
  description: string;
  members: {
    id: string;
    name: string;
    role: string;
    photoUrl: string | null;
  }[];
};

export function TeamCard({ team }: { team: TeamCardData }) {
  const { coaches, players } = countTeamMembers(team.members);
  const previewMembers = [
    ...team.members.filter((member) => member.role === "COACH"),
    ...team.members.filter((member) => member.role === "PLAYER"),
  ].slice(0, 5);
  const { primary, accent } = splitTeamName(team.name);

  return (
    <Link href={`/teams/${team.id}`} className="group block h-full">
      <article className="motion-hover-lift relative flex h-full flex-col overflow-hidden border border-white/10 bg-jackals-surface/90 shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition-all duration-300 hover:border-jackals-red/40 hover:shadow-[0_24px_70px_rgba(232,34,42,0.12)]">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-jackals-red via-jackals-red-light to-jackals-red"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-jackals-red/10 blur-3xl opacity-60 transition-opacity group-hover:opacity-100"
        />

        <div className="relative flex flex-1 flex-col p-6 sm:p-8">
          <div className="mb-4 inline-flex w-fit items-center gap-2 border border-jackals-red/30 bg-jackals-red/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-jackals-red-light">
            {team.level}
          </div>

          <h2 className="font-display text-xl font-bold leading-tight text-white sm:text-2xl">
            {primary}
            {accent && (
              <>
                {" "}
                <span className="bg-gradient-to-r from-jackals-red-light to-jackals-red bg-clip-text text-transparent">
                  {accent}
                </span>
              </>
            )}
          </h2>

          <p className="mt-4 text-sm leading-relaxed text-zinc-400 sm:text-base">
            {team.description}
          </p>

          <div className="mt-auto flex flex-wrap items-center gap-4 pt-6">
            {coaches > 0 && (
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <UserRound className="h-4 w-4 text-jackals-red-light" />
                <span>
                  {coaches} {coaches === 1 ? "coach" : "coaches"}
                </span>
              </div>
            )}
            {players > 0 && (
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Users className="h-4 w-4 text-jackals-red-light" />
                <span>
                  {players} {players === 1 ? "player" : "players"}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="relative border-t border-white/10 bg-jackals-inset/40 p-6 sm:p-8">
          {previewMembers.length > 0 ? (
            <>
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Squad preview
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex -space-x-2">
                  {previewMembers.map((member) => (
                    <TeamMemberAvatar
                      key={member.id}
                      name={member.name}
                      photoUrl={member.photoUrl}
                      className="h-10 w-10 transition-transform group-hover:translate-y-[-2px]"
                    />
                  ))}
                </div>
                {team.members.length > previewMembers.length && (
                  <span className="text-xs font-medium text-zinc-500">
                    +{team.members.length - previewMembers.length} more
                  </span>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-zinc-500">Roster coming soon</p>
          )}

          <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-jackals-red-light transition-colors group-hover:text-white">
            View squad
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </article>
    </Link>
  );
}
