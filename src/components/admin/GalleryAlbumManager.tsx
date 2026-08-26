"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSyncedListState } from "@/hooks/useSyncedListState";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { AdminFormCard } from "@/components/admin/AdminForm";
import { GalleryCoverField } from "@/components/admin/GalleryCoverField";
import { AdminSection } from "@/components/admin/AdminShell";
import {
  AdminSearchBar,
  matchesAdminSearch,
} from "@/components/admin/AdminSearchBar";
import { Checkbox, Input, Label, Select } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/InputFields";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormMessage";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/client-api";
import { isGalleryPlaceholderCover } from "@/lib/gallery-config";
import { cn } from "@/lib/utils";

type AlbumItem = {
  id: string;
  title: string;
  description: string | null;
  coverImageUrl: string;
  category: string;
  featured: boolean;
  sortOrder: number;
  _count: { photos: number };
};

import { GALLERY_CATEGORIES } from "@/lib/gallery-categories";

type AlbumFormState = {
  title: string;
  description: string;
  coverImageUrl: string;
  category: (typeof GALLERY_CATEGORIES)[number];
  featured: boolean;
  position: number;
};

const emptyFormBase = {
  title: "",
  description: "",
  coverImageUrl: "",
  category: "TRAINING" as (typeof GALLERY_CATEGORIES)[number],
  featured: false,
};

function AlbumFields({
  form,
  setForm,
  idPrefix,
  showCover,
  onCoverUploadError,
}: {
  form: AlbumFormState;
  setForm: (next: AlbumFormState) => void;
  idPrefix: string;
  showCover?: boolean;
  onCoverUploadError?: (message: string) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label htmlFor={`${idPrefix}-title`}>Album title</Label>
        <Input
          id={`${idPrefix}-title`}
          value={form.title}
          onChange={(event) =>
            setForm({ ...form, title: event.target.value })
          }
          placeholder="e.g. Spring tournament 2026"
          required
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-category`}>Category</Label>
        <Select
          id={`${idPrefix}-category`}
          value={form.category}
          onChange={(event) =>
            setForm({
              ...form,
              category: event.target.value as (typeof GALLERY_CATEGORIES)[number],
            })
          }
        >
          {GALLERY_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </Select>
      </div>
      {showCover ? (
        <div className="sm:col-span-2">
          <GalleryCoverField
            coverImageUrl={form.coverImageUrl}
            onCoverChange={(url) => setForm({ ...form, coverImageUrl: url })}
            onUpload={async () => {
              onCoverUploadError?.(
                "Upload a cover from the album photos page.",
              );
            }}
          />
        </div>
      ) : null}
      <div className="sm:col-span-2">
        <Label htmlFor={`${idPrefix}-description`}>Description (optional)</Label>
        <Textarea
          id={`${idPrefix}-description`}
          rows={3}
          value={form.description}
          onChange={(event) =>
            setForm({ ...form, description: event.target.value })
          }
          placeholder="Short note shown on the gallery page"
        />
      </div>
      <label className="sm:col-span-2 flex items-center gap-2 text-sm text-zinc-300">
        <Checkbox
          checked={form.featured}
          onChange={(event) =>
            setForm({ ...form, featured: event.target.checked })
          }
        />
        Show on homepage
      </label>
      <div className="sm:col-span-2 sm:max-w-xs">
        <Label htmlFor={`${idPrefix}-position`}>Position</Label>
        <Input
          id={`${idPrefix}-position`}
          type="number"
          min={1}
          value={form.position}
          onChange={(event) =>
            setForm({
              ...form,
              position: Math.max(1, Number(event.target.value) || 1),
            })
          }
        />
      </div>
    </div>
  );
}

export function GalleryAlbumManager({
  initialAlbums,
}: {
  initialAlbums: AlbumItem[];
}) {
  const router = useRouter();
  const [albums, setAlbums] = useSyncedListState(initialAlbums);
  const [createForm, setCreateForm] = useState<AlbumFormState>({
    ...emptyFormBase,
    position: initialAlbums.length + 1,
  });
  const [editForm, setEditForm] = useState<AlbumFormState>({
    ...emptyFormBase,
    position: 1,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [listMessage, setListMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [albumOrder, setAlbumOrder] = useState<string[]>(
    initialAlbums.map((album) => album.id),
  );
  const [draggingAlbumId, setDraggingAlbumId] = useState<string | null>(null);

  const filteredAlbums = useMemo(
    () =>
      albums.filter((album) =>
        matchesAdminSearch(
          search,
          album.title,
          album.description ?? "",
          album.category,
        ),
      ),
    [albums, search],
  );

  const albumsById = useMemo(
    () => Object.fromEntries(albums.map((album) => [album.id, album])),
    [albums],
  );

  useEffect(() => {
    setAlbumOrder((current) => {
      const existing = new Set(albums.map((album) => album.id));
      const kept = current.filter((id) => existing.has(id));
      const missing = albums
        .map((album) => album.id)
        .filter((id) => !kept.includes(id));
      return [...kept, ...missing];
    });
  }, [albums]);

  const visibleAlbums = useMemo(() => {
    if (search.trim()) return filteredAlbums;
    return albumOrder
      .map((id) => albumsById[id])
      .filter((album): album is AlbumItem => Boolean(album));
  }, [search, filteredAlbums, albumOrder, albumsById]);

  const hasOrderChanges = useMemo(() => {
    if (search.trim()) return false;
    return albumOrder.some((id, index) => albumsById[id]?.sortOrder !== index);
  }, [search, albumOrder, albumsById]);

  const cancelEdit = () => {
    setEditingId(null);
    setEditError(null);
  };

  const loadAlbums = useCallback(async () => {
    const result = await apiGet<{ albums: AlbumItem[] }>("/api/admin/gallery");
    if (result.ok) setAlbums(result.data.albums);
  }, [setAlbums]);

  const startEdit = (album: AlbumItem) => {
    setEditingId(album.id);
    setEditForm({
      title: album.title,
      description: album.description ?? "",
      coverImageUrl: album.coverImageUrl,
      category: album.category as (typeof GALLERY_CATEGORIES)[number],
      featured: album.featured,
      position: album.sortOrder + 1,
    });
    setEditError(null);
    setListMessage(null);
    setCreateMessage(null);
  };

  const payloadFrom = (form: AlbumFormState) => ({
    title: form.title,
    description: form.description || undefined,
    coverImageUrl: form.coverImageUrl.trim() || undefined,
    category: form.category,
    featured: form.featured,
    sortOrder: Math.max(0, form.position - 1),
  });

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setCreateError(null);
    setCreateMessage(null);

    const result = await apiPost<{ album: AlbumItem }>(
      "/api/admin/gallery",
      payloadFrom(createForm),
    );
    setLoading(false);
    if (!result.ok) {
      setCreateError(result.error);
      return;
    }

    router.push(`/admin/gallery/${result.data.album.id}`);
  };

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingId) return;

    setLoading(true);
    setEditError(null);
    setListMessage(null);

    const result = await apiPut(
      `/api/admin/gallery/${editingId}`,
      payloadFrom(editForm),
    );
    setLoading(false);
    if (!result.ok) {
      setEditError(result.error);
      return;
    }

    setListMessage("Album updated.");
    cancelEdit();
    await loadAlbums();
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this album and all its photos?")) return;
    setDeletingId(id);
    const result = await apiDelete(`/api/admin/gallery/${id}`);
    setDeletingId(null);
    if (!result.ok) {
      setEditError(result.error);
      return;
    }
    if (editingId === id) cancelEdit();
    setListMessage("Album deleted.");
    await loadAlbums();
    router.refresh();
  };

  const moveAlbumBefore = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;

    setAlbumOrder((current) => {
      const next = [...current];
      const from = next.indexOf(sourceId);
      const to = next.indexOf(targetId);
      if (from < 0 || to < 0) return current;
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const saveOrder = async () => {
    setSavingOrder(true);
    setEditError(null);
    setListMessage(null);

    for (const [index, id] of albumOrder.entries()) {
      const album = albumsById[id];
      if (!album || album.sortOrder === index) continue;

      const result = await apiPut(
        `/api/admin/gallery/${id}`,
        {
          title: album.title,
          description: album.description ?? undefined,
          coverImageUrl: album.coverImageUrl,
          category: album.category,
          featured: album.featured,
          sortOrder: index,
        },
        "Failed to save album order.",
      );

      if (!result.ok) {
        setSavingOrder(false);
        setEditError(result.error);
        return;
      }
    }

    setSavingOrder(false);
    setListMessage("Album order updated.");
    await loadAlbums();
    router.refresh();
  };

  const canDrag = !search.trim() && !editingId;

  return (
    <AdminSection
      title="Gallery albums"
      description="Create an album, then upload photos on the next screen. The first photo can become the cover automatically."
    >
      <AdminFormCard
        collapsible
        openTriggerLabel="Create album"
        title="Create album"
        error={createError}
        message={createMessage}
        onSubmit={handleCreate}
        submitLabel="Create & add photos"
        loading={loading && !editingId}
      >
        <AlbumFields
          form={createForm}
          setForm={setCreateForm}
          idPrefix="album-create"
        />
      </AdminFormCard>

      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Current albums ({visibleAlbums.length}
            {search.trim() ? ` of ${albums.length}` : ""})
          </h3>
          <div className="w-full sm:max-w-xs">
            <AdminSearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search title, category…"
            />
          </div>
        </div>
        {listMessage ? (
          <p className="text-sm text-emerald-300">{listMessage}</p>
        ) : null}
        {editError && !editingId ? (
          <p className="text-sm text-jackals-red-light">{editError}</p>
        ) : null}
        {visibleAlbums.length === 0 ? (
          <p className="text-sm text-zinc-400">
            {search.trim()
              ? "No albums match your search."
              : "No albums yet."}
          </p>
        ) : (
          visibleAlbums.map((album) => {
            const isEditing = editingId === album.id;

            return (
              <div
                key={album.id}
                draggable={canDrag}
                onDragStart={() => {
                  if (!canDrag) return;
                  setDraggingAlbumId(album.id);
                }}
                onDragEnd={() => setDraggingAlbumId(null)}
                onDragOver={(event) => {
                  if (canDrag) event.preventDefault();
                }}
                onDrop={() => {
                  if (!canDrag || !draggingAlbumId) return;
                  moveAlbumBefore(draggingAlbumId, album.id);
                }}
                className={cn(
                  "rounded-sm border p-4 transition",
                  isEditing
                    ? "border-jackals-red/40 bg-jackals-red/5 shadow-lg shadow-jackals-red/10"
                    : "border-white/10 bg-jackals-inset/30",
                  canDrag && "cursor-grab active:cursor-grabbing",
                  draggingAlbumId === album.id &&
                    "border-jackals-red/40 bg-jackals-red/5",
                )}
              >
                {isEditing ? (
                  <form
                    onSubmit={(e) => void handleUpdate(e)}
                    className="space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-jackals-red-light">
                          Editing
                        </p>
                        <h4 className="mt-0.5 font-medium text-white">
                          {album.title}
                        </h4>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                        onClick={cancelEdit}
                        disabled={loading}
                      >
                        <X className="h-4 w-4" />
                        Close
                      </Button>
                    </div>

                    <AlbumFields
                      form={editForm}
                      setForm={setEditForm}
                      idPrefix={`album-edit-${album.id}`}
                      showCover
                      onCoverUploadError={setEditError}
                    />

                    <FormError message={editError} />

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button type="submit" disabled={loading}>
                        {loading ? "Saving..." : "Save album"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={cancelEdit}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-sm border border-white/10 bg-jackals-surface">
                      {!isGalleryPlaceholderCover(album.coverImageUrl) ? (
                        <Image
                          src={album.coverImageUrl}
                          alt=""
                          fill
                          unoptimized
                          sizes="112px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-zinc-600">
                          No cover
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-white">{album.title}</p>
                      <p className="mt-1 text-sm text-zinc-500">
                        {album.category} · {album._count.photos} photo
                        {album._count.photos === 1 ? "" : "s"}
                        {album.featured ? " · Featured" : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/gallery/${album.id}`}
                        className="rounded-sm border border-jackals-red/30 bg-jackals-red/10 px-3 py-2 text-sm font-medium text-jackals-red-light transition-colors hover:bg-jackals-red/20"
                      >
                        Manage photos
                      </Link>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(album)}
                      >
                        Edit album
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={deletingId === album.id}
                        onClick={() => void handleDelete(album.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        {deletingId === album.id ? "..." : "Delete"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
        {!search.trim() && (
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-zinc-500">
              {editingId
                ? "Finish or cancel editing to reorder albums."
                : "Drag album cards to change order."}
            </p>
            <Button
              type="button"
              size="sm"
              disabled={!hasOrderChanges || savingOrder || Boolean(editingId)}
              onClick={() => void saveOrder()}
            >
              {savingOrder ? "Saving..." : "Save order"}
            </Button>
          </div>
        )}
      </div>
    </AdminSection>
  );
}
