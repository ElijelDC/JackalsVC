"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { ShowcaseHero } from "@/components/layout/ShowcaseHero";
import { ShowcaseCtaBand } from "@/components/layout/ShowcaseCard";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { StaggerIn } from "@/components/motion/StaggerIn";
import { Button } from "@/components/ui/Button";
import { CommitteeInterestButton } from "@/components/committee/CommitteeInterestForm";
import {
  COMMITTEE_ROLES,
  type CommitteeRole,
} from "@/lib/committee-roles-config";
import { cn } from "@/lib/utils";

function TaskList({ tasks }: { tasks: string[] }) {
  return (
    <ul className="space-y-2.5">
      {tasks.map((task) => (
        <li
          key={task}
          className="flex gap-3 text-sm leading-relaxed text-zinc-400"
        >
          <span
            aria-hidden
            className="mt-2 h-1.5 w-1.5 shrink-0 bg-jackals-red-light"
          />
          <span>{task}</span>
        </li>
      ))}
    </ul>
  );
}

function RoleCard({
  role,
  index,
  tasksOpen,
  onToggleTasks,
}: {
  role: CommitteeRole;
  index: number;
  tasksOpen: boolean;
  onToggleTasks: (anchor: HTMLElement) => void;
}) {
  const Icon = role.icon;

  return (
    <article className="motion-hover-pop flex h-full flex-col border border-white/10 bg-white/[0.02]">
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="motion-icon-pop flex h-10 w-10 shrink-0 items-center justify-center bg-jackals-red/15 text-jackals-red-light clip-slash-reverse">
            <Icon className="h-5 w-5" aria-hidden />
          </div>
          <span className="font-display text-sm font-semibold tabular-nums text-zinc-500">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
        <h3 className="font-display text-lg font-semibold leading-snug text-white">
          {role.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          {role.summary}
        </p>
      </div>

      <div className="border-t border-white/10">
        <button
          type="button"
          onClick={(event) => onToggleTasks(event.currentTarget)}
          className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left text-sm font-medium text-zinc-300 transition-colors hover:bg-white/[0.03] hover:text-white sm:px-6"
          aria-expanded={tasksOpen}
        >
          <span>Tasks &amp; responsibilities</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-zinc-500 transition-transform",
              tasksOpen && "rotate-180",
            )}
            aria-hidden
          />
        </button>
        {tasksOpen ? (
          <div className="border-t border-white/5 px-5 pb-5 pt-3 sm:px-6 sm:pb-6">
            <TaskList tasks={role.tasks} />
          </div>
        ) : null}
      </div>
    </article>
  );
}

function MobileRoleRow({
  role,
  index,
  open,
  onToggle,
}: {
  role: CommitteeRole;
  index: number;
  open: boolean;
  onToggle: () => void;
}) {
  const Icon = role.icon;
  const panelId = `committee-role-panel-${role.value}`;

  return (
    <li className="border-b border-white/10 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.03] active:bg-white/[0.05]"
      >
        <span className="w-7 shrink-0 font-display text-xs font-semibold tabular-nums text-zinc-500">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-jackals-red/15 text-jackals-red-light clip-slash-reverse">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[15px] font-semibold leading-snug text-white">
            {role.title}
          </span>
          {!open ? (
            <span className="mt-0.5 block truncate text-xs leading-snug text-zinc-500">
              {role.summary}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-zinc-500 transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      {open ? (
        <div id={panelId} className="space-y-4 px-4 pb-4 pl-[3.25rem]">
          <p className="text-sm leading-relaxed text-zinc-400">{role.summary}</p>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Tasks
            </p>
            <TaskList tasks={role.tasks} />
          </div>
        </div>
      ) : null}
    </li>
  );
}

export function CommitteeRolesShowcase() {
  const [tasksOpen, setTasksOpen] = useState(false);
  const [openRoles, setOpenRoles] = useState<Set<string>>(() => new Set());

  const allMobileOpen = openRoles.size === COMMITTEE_ROLES.length;

  const toggleDesktopTasks = (anchor: HTMLElement) => {
    const topBefore = anchor.getBoundingClientRect().top;
    setTasksOpen((value) => !value);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const topAfter = anchor.getBoundingClientRect().top;
        const delta = topAfter - topBefore;
        if (Math.abs(delta) > 0.5) {
          window.scrollBy(0, delta);
        }
      });
    });
  };

  const toggleMobileRole = (value: string) => {
    setOpenRoles((current) => {
      const next = new Set(current);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const toggleAllMobile = () => {
    if (allMobileOpen) {
      setOpenRoles(new Set());
      return;
    }
    setOpenRoles(new Set(COMMITTEE_ROLES.map((role) => role.value)));
  };

  return (
    <>
      <ShowcaseHero
        title="Committee"
        highlight="Roles"
        description={
          <>
            <span className="mb-4 block text-sm font-semibold uppercase tracking-[0.2em] text-jackals-red-light">
              Season 2026 / 27
            </span>
            Help run the club behind the scenes. Browse the roles below, then
            tell us your top three preferences — name and ranked choices only.
          </>
        }
      />

      <section className="border-b border-white/10 bg-jackals-red/5 py-10 sm:py-12">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <AnimateIn variant="spring-up">
            <p className="text-xs font-semibold uppercase tracking-widest text-jackals-red-light">
              How it works
            </p>
            <h2 className="mt-3 font-display text-2xl font-bold text-white sm:text-3xl">
              Pick three roles that fit you
            </h2>
            <ol className="mx-auto mt-8 grid max-w-lg gap-4 text-left sm:max-w-none sm:grid-cols-2 sm:gap-5">
              <li className="flex gap-3 border border-white/10 bg-background/40 px-4 py-4">
                <span className="font-display text-lg font-bold tabular-nums text-jackals-red-light">
                  01
                </span>
                <span className="text-sm leading-relaxed text-zinc-300">
                  Read the role summaries and open the task lists for detail.
                </span>
              </li>
              <li className="flex gap-3 border border-white/10 bg-background/40 px-4 py-4">
                <span className="font-display text-lg font-bold tabular-nums text-jackals-red-light">
                  02
                </span>
                <span className="text-sm leading-relaxed text-zinc-300">
                  Submit your name with a 1st, 2nd, and 3rd preference.
                </span>
              </li>
            </ol>
            <div className="mt-8 flex justify-center">
              <CommitteeInterestButton label="Express interest" />
            </div>
          </AnimateIn>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <AnimateIn variant="blur-in" className="mb-8 text-center sm:mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-jackals-red-light">
            Open roles
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold text-white">
            What each role covers
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400">
            <span className="md:hidden">
              Tap a role for its summary and tasks — or expand them all at once.
            </span>
            <span className="hidden md:inline">
              Short summary first — open any card to expand the full task list on
              every role.
            </span>
          </p>
        </AnimateIn>

        {/* Mobile: compact accordion list */}
        <div className="md:hidden">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-zinc-500">
              {COMMITTEE_ROLES.length} roles
            </p>
            <button
              type="button"
              onClick={toggleAllMobile}
              className="text-xs font-semibold text-jackals-red-light transition-colors hover:text-white"
            >
              {allMobileOpen ? "Collapse all" : "Expand all"}
            </button>
          </div>
          <ul className="overflow-hidden border border-white/10 bg-white/[0.02]">
            {COMMITTEE_ROLES.map((role, index) => (
              <MobileRoleRow
                key={role.value}
                role={role}
                index={index}
                open={openRoles.has(role.value)}
                onToggle={() => toggleMobileRole(role.value)}
              />
            ))}
          </ul>
        </div>

        {/* Desktop / tablet: card grid */}
        <StaggerIn
          className="hidden grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 md:grid lg:grid-cols-3"
          stagger={50}
          variant="pop"
        >
          {COMMITTEE_ROLES.map((role, index) => (
            <RoleCard
              key={role.value}
              role={role}
              index={index}
              tasksOpen={tasksOpen}
              onToggleTasks={toggleDesktopTasks}
            />
          ))}
        </StaggerIn>

        <AnimateIn variant="spring-up" className="mt-12 sm:mt-16">
          <ShowcaseCtaBand
            className="motion-cta-glow"
            title="Ready to choose?"
            description="Share your top three roles when you're ready — or get in touch if you want to talk a role through first."
          >
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <CommitteeInterestButton
                label="Express interest"
                className="w-full whitespace-nowrap sm:w-auto"
              />
              <Link href="/contact" className="inline-flex w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full whitespace-nowrap"
                >
                  Contact us
                </Button>
              </Link>
            </div>
          </ShowcaseCtaBand>
        </AnimateIn>
      </div>
    </>
  );
}
