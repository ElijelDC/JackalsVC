"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormError, SuccessBanner } from "@/components/ui/FormMessage";
import { cn } from "@/lib/utils";

export const ADMIN_FORM_ID = "admin-edit-form";
const ADMIN_FORM_HIGHLIGHT_EVENT = "admin-form-highlight";
const SCROLL_HEADER_OFFSET = 96;

function scrollFormIntoView() {
  const el = document.getElementById(ADMIN_FORM_ID);
  if (!el) return false;

  const top =
    el.getBoundingClientRect().top + window.scrollY - SCROLL_HEADER_OFFSET;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  window.dispatchEvent(new CustomEvent(ADMIN_FORM_HIGHLIGHT_EVENT));
  return true;
}

export function scrollToAdminForm() {
  const attempt = (tries = 0) => {
    if (scrollFormIntoView()) return;

    if (tries < 20) {
      window.setTimeout(() => attempt(tries + 1), 50);
    }
  };

  // Defer until after React applies edit state (needed for conditional forms).
  window.setTimeout(() => attempt(), 0);
}

export function AdminFormCard({
  title,
  error,
  message,
  onSubmit,
  onCancel,
  submitLabel,
  loading,
  children,
}: {
  title: string;
  error: string | null;
  message: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onCancel?: () => void;
  submitLabel: string;
  loading: boolean;
  children: React.ReactNode;
}) {
  const [highlighted, setHighlighted] = useState(false);

  useEffect(() => {
    const onHighlight = () => {
      setHighlighted(true);
      window.setTimeout(() => setHighlighted(false), 2500);
    };

    window.addEventListener(ADMIN_FORM_HIGHLIGHT_EVENT, onHighlight);
    return () =>
      window.removeEventListener(ADMIN_FORM_HIGHLIGHT_EVENT, onHighlight);
  }, []);

  return (
    <Card
      id={ADMIN_FORM_ID}
      className={cn(
        "mb-8 scroll-mt-24 transition-all duration-500",
        highlighted &&
          "ring-2 ring-jackals-red/70 shadow-lg shadow-jackals-red/20",
      )}
    >
      <h3 className="font-display mb-4 text-lg font-semibold text-white">
        {title}
      </h3>
      <SuccessBanner message={message} />
      <form onSubmit={onSubmit} className="space-y-4">
        {children}
        <FormError message={error} />
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : submitLabel}
          </Button>
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
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
  onEdit,
  onDelete,
  deleting,
}: {
  title: string;
  subtitle: string;
  note?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  onEdit?: () => void;
  onDelete: () => void;
  deleting?: boolean;
}) {
  return (
    <Card className="flex items-start justify-between gap-4 py-4">
      <div>
        <p className="font-medium text-white">{title}</p>
        <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
        {note && <p className="mt-1 text-xs text-zinc-500">{note}</p>}
        {secondaryHref && secondaryLabel && (
          <Link
            href={secondaryHref}
            className="mt-2 inline-block text-xs font-medium text-jackals-red-light hover:text-jackals-red"
          >
            {secondaryLabel}
          </Link>
        )}
      </div>
      <div className="flex shrink-0 gap-2">
        {onEdit && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onEdit();
              scrollToAdminForm();
            }}
          >
            Edit
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
