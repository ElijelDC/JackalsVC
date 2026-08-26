"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Copy, GripVertical, Pencil, Trash2, X } from "lucide-react";
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
    <div
      className={cn(
        "flex items-start justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-3 transition",
        draggable && "cursor-grab active:cursor-grabbing",
        dragging && "border-jackals-red/40 bg-jackals-red/5",
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
          <p className="truncate font-medium text-white">{title}</p>
        </div>
        <p className="mt-0.5 line-clamp-2 text-sm text-zinc-500">{subtitle}</p>
        {note ? <p className="mt-1 text-xs text-zinc-600">{note}</p> : null}
        {(formAction || (secondaryHref && secondaryLabel)) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            {formAction && (
              <button
                type="button"
                draggable={false}
                onClick={() => formAction.onClick()}
                className="text-xs font-medium text-jackals-gold hover:underline"
              >
                {formAction.label}
              </button>
            )}
            {secondaryHref && secondaryLabel && (
              <Link
                href={secondaryHref}
                draggable={false}
                className="text-xs font-medium text-jackals-gold hover:underline"
              >
                {secondaryLabel}
              </Link>
            )}
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {actionHref && actionLabel ? (
          <Link
            href={actionHref}
            draggable={false}
            className="rounded px-2 py-1.5 text-xs font-medium text-zinc-300 hover:bg-white/5 hover:text-white"
          >
            {actionLabel}
          </Link>
        ) : null}
        {onEdit ? (
          <button
            type="button"
            title="Edit"
            draggable={false}
            onClick={() => onEdit()}
            className="rounded p-1.5 text-zinc-500 hover:bg-white/5 hover:text-white"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        ) : null}
        {onDuplicate ? (
          <button
            type="button"
            title="Duplicate"
            draggable={false}
            onClick={() => onDuplicate()}
            className="rounded p-1.5 text-zinc-500 hover:bg-white/5 hover:text-white"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        ) : null}
        <button
          type="button"
          title="Delete"
          draggable={false}
          disabled={deleting}
          onClick={onDelete}
          className="rounded p-1.5 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-40"
        >
          {deleting ? (
            <span className="px-1 text-xs">…</span>
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}

/** List row that expands in place into an edit form (instead of scrolling to a top form). */
export function AdminInlineEditCard({
  isEditing,
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
  editHeading,
  onCancelEdit,
  onSubmit,
  loading,
  submitLabel = "Save changes",
  error,
  children,
  afterForm,
}: {
  isEditing: boolean;
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
  editHeading?: string;
  onCancelEdit: () => void;
  onSubmit: (e: React.FormEvent) => void;
  loading?: boolean;
  submitLabel?: string;
  error?: string | null;
  children: React.ReactNode;
  afterForm?: React.ReactNode;
}) {
  if (!isEditing) {
    return (
      <AdminListItem
        title={title}
        subtitle={subtitle}
        note={note}
        secondaryHref={secondaryHref}
        secondaryLabel={secondaryLabel}
        actionHref={actionHref}
        actionLabel={actionLabel}
        formAction={formAction}
        draggable={draggable}
        dragging={dragging}
        onEdit={onEdit}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        deleting={deleting}
      />
    );
  }

  return (
    <div className="rounded-lg border border-jackals-red/40 bg-jackals-red/5 shadow-lg shadow-jackals-red/10">
      <form onSubmit={onSubmit} className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-jackals-red-light">
              Editing
            </p>
            <h4 className="mt-0.5 truncate font-medium text-white">
              {editHeading ?? title}
            </h4>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0"
            onClick={onCancelEdit}
            disabled={loading}
          >
            <X className="h-4 w-4" />
            Close
          </Button>
        </div>

        {children}

        <FormError message={error ?? null} />

        <div className="flex flex-col gap-3 pt-1 sm:flex-row">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : submitLabel}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onCancelEdit}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </form>
      {afterForm}
    </div>
  );
}
