"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function TournamentCollapsibleSection({
  eyebrow,
  title,
  description,
  toggleLabel,
  defaultOpen = false,
  children,
  className,
  contentClassName,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  /** Short label used in the View/Hide button, e.g. "standings". */
  toggleLabel: string;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <section className={cn("border-t border-white/10", className)}>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-jackals-red-light">
            {eyebrow}
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">
            {title}
          </h2>
          {description ? (
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
              {description}
            </p>
          ) : null}
          <button
            type="button"
            className="mt-6 inline-flex items-center gap-2 border border-white/15 bg-white/[0.03] px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:border-jackals-red/45 hover:bg-jackals-red/10"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "Hide" : "View"} {toggleLabel}
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                open && "rotate-180",
              )}
              aria-hidden
            />
          </button>
        </div>

        <div
          id={panelId}
          hidden={!open}
          className={cn(open && "mt-10 sm:mt-12", contentClassName)}
        >
          {open ? children : null}
        </div>
      </div>
    </section>
  );
}
