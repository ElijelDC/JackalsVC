"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const PANEL_BASE_CLASS =
  "relative my-auto w-full max-w-[min(100%,28rem)] max-h-[min(calc(100dvh-2rem),90dvh)] overflow-y-auto overscroll-y-contain rounded-xl border border-white/10 bg-zinc-950 p-5 shadow-2xl outline-none sm:max-h-[min(calc(100dvh-3rem),90dvh)] sm:p-6";

const MODAL_SHELL_PADDING =
  "p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
  variant = "panel",
  closeOnBackdrop = true,
  closeOnEscape = true,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: React.ReactNode;
  className?: string;
  variant?: "panel" | "fullscreen";
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
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
      if (event.key === "Escape" && closeOnEscape) onClose();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, closeOnEscape]);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
  }, [open]);

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
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-5 py-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
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
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6">
          <div className="my-auto flex flex-col gap-3">{children}</div>
        </div>
      </div>,
      document.body,
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-999">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        className="fixed inset-0 overflow-y-auto overscroll-y-contain"
        onClick={closeOnBackdrop ? onClose : undefined}
      >
        <div
          className={cn(
            "flex min-h-full items-center justify-center",
            MODAL_SHELL_PADDING,
          )}
        >
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
            className={cn(PANEL_BASE_CLASS, className)}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="min-w-0 pr-2">
                <h2
                  id={titleId}
                  className="font-display text-lg font-bold uppercase tracking-wide text-white sm:text-xl"
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
      </div>
    </div>,
    document.body,
  );
}
