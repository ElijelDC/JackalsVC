import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Banknote,
  Calendar,
  CheckCircle2,
  GraduationCap,
  Shirt,
  ShoppingBag,
  UserPlus,
  Volleyball,
  Wallet,
} from "lucide-react";
import type { AdminActionQueueEntry } from "@/lib/admin-action-queue";
import { cn } from "@/lib/utils";

const ENTRY_ICONS = {
  registration: UserPlus,
  payment: Banknote,
  "kit-payment": Shirt,
  "merchandise-payment": ShoppingBag,
  "coach-payment": Wallet,
  "coaching-application": GraduationCap,
  "trials-application": Volleyball,
  "trial-session-signup": Calendar,
} as const;

function ActionQueueCard({ entry }: { entry: AdminActionQueueEntry }) {
  const Icon = ENTRY_ICONS[entry.kind];
  const hasUrgent = (entry.urgentCount ?? 0) > 0;

  return (
    <Link
      href={entry.href}
      className={cn(
        "group block rounded-xl border bg-white/[0.03] p-4 transition-colors sm:p-5",
        hasUrgent
          ? "border-amber-500/35 hover:border-amber-500/50 hover:bg-amber-500/[0.04]"
          : "border-white/10 hover:border-jackals-red/35 hover:bg-white/[0.05]",
      )}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg sm:h-11 sm:w-11",
            hasUrgent ? "bg-amber-500/15 text-amber-300" : "bg-jackals-red/15 text-jackals-red-light",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-base font-semibold text-white sm:text-lg">
              {entry.title}
            </h3>
            <span
              className={cn(
                "inline-flex min-h-6 items-center rounded-full px-2.5 text-xs font-semibold",
                hasUrgent
                  ? "bg-amber-500/20 text-amber-200"
                  : "bg-jackals-red/20 text-jackals-red-light",
              )}
            >
              {entry.count}
            </span>
            {hasUrgent && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-300">
                <AlertCircle className="h-3.5 w-3.5" />
                {entry.urgentCount} overdue
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-zinc-400">{entry.summary}</p>

          {entry.previews.length > 0 && (
            <p className="mt-2 line-clamp-2 text-xs text-zinc-500">
              {entry.previews.join(" · ")}
              {entry.count > entry.previews.length
                ? ` · +${entry.count - entry.previews.length} more`
                : ""}
            </p>
          )}

          <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-jackals-red-light transition-colors group-hover:text-white">
            Review now
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </p>
        </div>
      </div>
    </Link>
  );
}

export function AdminActionQueue({
  entries,
  totalCount,
}: {
  entries: AdminActionQueueEntry[];
  totalCount: number;
}) {
  return (
    <section className="mb-8 sm:mb-10">
      <div className="mb-4 sm:mb-5">
        <h2 className="font-display text-lg font-bold text-white sm:text-xl">
          Needs your attention
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          {totalCount > 0
            ? "Review these items so members and coaches are not left waiting."
            : "You are all caught up — nothing is waiting for review right now."}
        </p>
      </div>

      {totalCount === 0 ? (
        <div className="rounded-xl border border-green-500/25 bg-green-500/[0.06] px-4 py-5 sm:px-6 sm:py-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-green-400" />
            <div>
              <p className="font-medium text-green-100">All caught up</p>
              <p className="mt-1 text-sm text-green-200/70">
                New member registrations, payment proofs, and session
                requests will show up here as soon as someone submits them.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 sm:px-5">
            <p className="flex items-center gap-2 text-sm font-medium text-amber-100">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {totalCount} item{totalCount === 1 ? "" : "s"} waiting for review
            </p>
          </div>

          <div className="grid gap-3 sm:gap-4">
            {entries.map((entry) => (
              <ActionQueueCard key={entry.kind} entry={entry} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
