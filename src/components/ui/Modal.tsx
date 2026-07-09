"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
  variant = "panel",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: React.ReactNode;
  className?: string;
  variant?: "panel" | "fullscreen";
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = "modal-title";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  if (variant === "fullscreen") {
    return createPortal(
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
          className={cn(
            "fixed inset-0 z-9999 flex min-h-dvh flex-col bg-zinc-950 outline-none",
            className,
          )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="font-display text-xl font-bold uppercase tracking-wide text-white sm:text-2xl"
            >
              {title}
            </h2>
            {description && <div className="mt-2">{description}</div>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-1 flex-col px-5 py-6 sm:px-6">
          <div className="mt-auto flex flex-col gap-3">{children}</div>
        </div>
      </div>,
      document.body,
    );
  }

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-998 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-999 flex items-center justify-center overflow-y-auto p-4 sm:p-6">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className={cn(
            "my-auto w-full max-w-md rounded-xl border border-white/10 bg-zinc-950 p-6 shadow-2xl outline-none",
            className,
          )}
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2
                id={titleId}
                className="font-display text-xl font-bold uppercase tracking-wide text-white"
              >
                {title}
              </h2>
              {description && <div className="mt-2">{description}</div>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded p-1 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </>,
    document.body,
  );
}
