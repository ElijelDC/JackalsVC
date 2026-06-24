"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GripVertical } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormError, SuccessBanner } from "@/components/ui/FormMessage";
import { cn } from "@/lib/utils";

export const ADMIN_FORM_ID = "admin-edit-form";
export const ADMIN_SECONDARY_FORM_ID = "admin-edit-form-secondary";
const ADMIN_FORM_HIGHLIGHT_EVENT = "admin-form-highlight";
const SCROLL_HEADER_OFFSET = 96;

function scrollFormIntoView(formId: string) {
  const el = document.getElementById(formId);
  if (!el) return false;

  const top =
    el.getBoundingClientRect().top + window.scrollY - SCROLL_HEADER_OFFSET;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  window.dispatchEvent(
    new CustomEvent(ADMIN_FORM_HIGHLIGHT_EVENT, { detail: { formId } }),
  );
  return true;
}

export function scrollToAdminForm(formId: string = ADMIN_FORM_ID) {
  const attempt = (tries = 0) => {
    if (scrollFormIntoView(formId)) return;

    if (tries < 20) {
      window.setTimeout(() => attempt(tries + 1), 50);
    }
  };

  // Defer until after React applies edit state (needed for conditional forms).
  window.setTimeout(() => attempt(), 0);
}

export function beginAdminEdit(
  prepare: () => void,
  formId: string = ADMIN_FORM_ID,
) {
  prepare();
  scrollToAdminForm(formId);
}

export function AdminFormCard({
  title,
  error,
  message,
  onSubmit,
  onCancel,
  submitLabel,
  loading,
  formId = ADMIN_FORM_ID,
  collapsible = false,
  openTriggerLabel,
  children,
}: {
  title: string;
  error: string | null;
  message: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onCancel?: () => void;
  submitLabel: string;
  loading: boolean;
  formId?: string;
  collapsible?: boolean;
  openTriggerLabel?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(() => !collapsible);
  const [highlighted, setHighlighted] = useState(false);

  useEffect(() => {
    const onHighlight = (event: Event) => {
      const targetId =
        (event as CustomEvent<{ formId?: string }>).detail?.formId ??
        ADMIN_FORM_ID;
      if (targetId !== formId) return;

      if (collapsible) setOpen(true);
      setHighlighted(true);
      window.setTimeout(() => setHighlighted(false), 2500);
    };

    window.addEventListener(ADMIN_FORM_HIGHLIGHT_EVENT, onHighlight);
    return () =>
      window.removeEventListener(ADMIN_FORM_HIGHLIGHT_EVENT, onHighlight);
  }, [formId, collapsible]);

  useEffect(() => {
    if (!collapsible || !message) return;
    setOpen(false);
  }, [collapsible, message]);

  const closePanel = () => {
    onCancel?.();
    if (collapsible) setOpen(false);
  };

  if (collapsible && !open) {
    return (
      <Card id={formId} className="mb-8 scroll-mt-24 space-y-3">
        <SuccessBanner message={message} />
        <FormError message={error} />
        <Button type="button" variant="outline" onClick={() => setOpen(true)}>
          {openTriggerLabel ?? title}
        </Button>
      </Card>
    );
  }

  return (
    <Card
      id={formId}
      className={cn(
        "mb-8 scroll-mt-24 transition-all duration-500",
        highlighted &&
          "ring-2 ring-jackals-red/70 shadow-lg shadow-jackals-red/20",
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <h3 className="font-display text-lg font-semibold text-white">
          {title}
        </h3>
        {collapsible && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0"
            onClick={closePanel}
          >
            Close
          </Button>
        )}
      </div>
      <SuccessBanner message={message} />
      <form onSubmit={onSubmit} className="space-y-4">
        {children}
        <FormError message={error} />
        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : submitLabel}
          </Button>
          {onCancel && (
            <Button type="button" variant="ghost" onClick={closePanel}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}

export function AdminListItem({
  title,
  subtitle,
  note,
  secondaryHref,
  secondaryLabel,
  actionHref,
  actionLabel,
  formAction,
  draggable,
  dragging,
  onEdit,
  onDuplicate,
  onDelete,
  deleting,
}: {
  title: string;
  subtitle: string;
  note?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  actionHref?: string;
  actionLabel?: string;
  formAction?: { label: string; onClick: () => void };
  draggable?: boolean;
  dragging?: boolean;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete: () => void;
  deleting?: boolean;
}) {
  return (
    <Card
      className={cn(
        "flex flex-col gap-4 py-4 transition-all duration-200 sm:flex-row sm:items-start sm:justify-between",
        draggable && "cursor-grab active:cursor-grabbing",
        dragging && "scale-[0.99] border-jackals-red/40 bg-jackals-red/5",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {draggable && (
            <GripVertical
              className="h-4 w-4 shrink-0 text-zinc-500"
              aria-hidden
            />
          )}
          <p className="font-medium text-white">{title}</p>
        </div>
        <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
        {note && <p className="mt-1 text-xs text-zinc-500">{note}</p>}
        {(formAction || (secondaryHref && secondaryLabel)) && (
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            {formAction && (
              <button
                type="button"
                onClick={() => formAction.onClick()}
                className="text-xs font-medium text-jackals-red-light hover:text-jackals-red"
              >
                {formAction.label}
              </button>
            )}
            {secondaryHref && secondaryLabel && (
              <Link
                href={secondaryHref}
                className="text-xs font-medium text-jackals-red-light hover:text-jackals-red"
              >
                {secondaryLabel}
              </Link>
            )}
          </div>
        )}
      </div>
      <div className="flex w-full shrink-0 flex-wrap gap-2 sm:w-auto sm:justify-end">
        {actionHref && actionLabel && (
          <Link
            href={actionHref}
            className="inline-flex items-center justify-center gap-2 rounded-sm border border-white/20 bg-transparent px-3 py-1.5 text-sm font-semibold text-white transition-all duration-300 hover:border-jackals-red/50 hover:bg-jackals-red/10"
          >
            {actionLabel}
          </Link>
        )}
        {onEdit && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onEdit()}
          >
            Edit
          </Button>
        )}
        {onDuplicate && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onDuplicate()}
          >
            Duplicate
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={deleting}
          onClick={onDelete}
          className="text-red-400 hover:text-red-300"
        >
          {deleting ? "..." : "Delete"}
        </Button>
      </div>
    </Card>
  );
}
