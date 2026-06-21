"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormError, SuccessBanner } from "@/components/ui/FormMessage";

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
  return (
    <Card className="mb-8">
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
  onEdit,
  onDelete,
  deleting,
}: {
  title: string;
  subtitle: string;
  onEdit: () => void;
  onDelete: () => void;
  deleting?: boolean;
}) {
  return (
    <Card className="flex items-start justify-between gap-4 py-4">
      <div>
        <p className="font-medium text-white">{title}</p>
        <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onEdit}>
          Edit
        </Button>
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
