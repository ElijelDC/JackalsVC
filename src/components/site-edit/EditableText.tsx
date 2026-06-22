"use client";

import { useState, type ElementType, type KeyboardEvent } from "react";
import { Pencil } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/InputFields";
import { FormError } from "@/components/ui/FormMessage";
import { useSiteEdit } from "@/components/providers/SiteEditProvider";
import { cn } from "@/lib/utils";

export function EditableText({
  contentKey,
  fallback,
  as: Tag = "span",
  className,
  multiline = false,
  label,
}: {
  contentKey: string;
  fallback: string;
  as?: ElementType;
  className?: string;
  multiline?: boolean;
  label?: string;
}) {
  const siteEdit = useSiteEdit();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(fallback);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const text = siteEdit?.getText(contentKey, fallback) ?? fallback;
  const canEdit = Boolean(siteEdit?.isAdmin && siteEdit.editMode);

  const openEditor = () => {
    if (!canEdit || !siteEdit) return;
    setDraft(text);
    setError(null);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!siteEdit) return;
    setSaving(true);
    setError(null);
    const result = await siteEdit.saveText(contentKey, draft);
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOpen(false);
  };

  return (
    <>
      <Tag
        className={cn(
          className,
          canEdit &&
            "relative cursor-pointer rounded-sm outline-dashed outline-1 outline-offset-4 outline-jackals-red/50 transition-colors hover:bg-jackals-red/10",
        )}
        onClick={canEdit ? openEditor : undefined}
        onKeyDown={
          canEdit
            ? (event: KeyboardEvent) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openEditor();
                }
              }
            : undefined
        }
        role={canEdit ? "button" : undefined}
        tabIndex={canEdit ? 0 : undefined}
        data-content-key={contentKey}
      >
        {text}
        {canEdit && (
          <Pencil
            className="ml-1.5 inline h-3.5 w-3.5 shrink-0 align-middle text-jackals-red-light opacity-70"
            aria-hidden
          />
        )}
      </Tag>

      <Modal
        open={open}
        onClose={() => !saving && setOpen(false)}
        title={label ?? "Edit text"}
        description={
          <p className="text-sm text-zinc-500">
            Changes appear across the site once saved.
          </p>
        }
        className="max-w-lg"
      >
        <div className="space-y-4">
          <Textarea
            rows={multiline ? 6 : 3}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            autoFocus
          />
          <FormError message={error} />
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              disabled={saving}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" disabled={saving} onClick={handleSave}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export function EditableBlock({
  contentKey,
  fallback,
  className,
  label,
}: {
  contentKey: string;
  fallback: string;
  className?: string;
  label?: string;
}) {
  return (
    <EditableText
      contentKey={contentKey}
      fallback={fallback}
      as="p"
      className={className}
      multiline
      label={label}
    />
  );
}
