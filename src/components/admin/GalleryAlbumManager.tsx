"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSyncedListState } from "@/hooks/useSyncedListState";
import { useRouter } from "next/navigation";
import { AdminFormCard, beginAdminEdit } from "@/components/admin/AdminForm";
import { GalleryCoverField } from "@/components/admin/GalleryCoverField";
import { AdminSection } from "@/components/admin/AdminShell";
import {
  AdminSearchBar,
  matchesAdminSearch,
} from "@/components/admin/AdminSearchBar";
import { Checkbox, Input, Label, Select } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/InputFields";
import { Button } from "@/components/ui/Button";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/client-api";
import { isGalleryPlaceholderCover } from "@/lib/gallery-config";

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

const emptyForm = {
  title: "",
  description: "",
  coverImageUrl: "",
  category: "TRAINING" as (typeof GALLERY_CATEGORIES)[number],
  featured: false,
  position: 1,
};

export function GalleryAlbumManager({
  initialAlbums,
}: {
  initialAlbums: AlbumItem[];
}) {
  const router = useRouter();
  const [albums, setAlbums] = useSyncedListState(initialAlbums);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    ...emptyForm,
    position: initialAlbums.length + 1,
  });
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
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

  const resetForm = () => {
    setForm({
      ...emptyForm,
      position: albums.length + 1,
    });
    setEditingId(null);
    setError(null);
  };

  const loadAlbums = useCallback(async () => {
    const result = await apiGet<{ albums: AlbumItem[] }>("/api/admin/gallery");
    if (result.ok) setAlbums(result.data.albums);
  }, [setAlbums]);

  const startEdit = (album: AlbumItem) => {
    beginAdminEdit(() => {
      setEditingId(album.id);
      setForm({
        title: album.title,
        description: album.description ?? "",
        coverImageUrl: album.coverImageUrl,
        category: album.category as (typeof GALLERY_CATEGORIES)[number],
        featured: album.featured,
        position: album.sortOrder + 1,
      });
      setError(null);
      setMessage(null);
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const payload = {
      title: form.title,
      description: form.description || undefined,
      coverImageUrl: form.coverImageUrl.trim() || undefined,
      category: form.category,
      featured: form.featured,
      sortOrder: Math.max(0, form.position - 1),
    };

    if (editingId) {
      const result = await apiPut(`/api/admin/gallery/${editingId}`, payload);
      setLoading(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage("Album updated.");
      resetForm();
      await loadAlbums();
      router.refresh();
      return;
    }

    const result = await apiPost<{ album: AlbumItem }>("/api/admin/gallery", payload);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    router.push(`/admin/gallery/${result.data.album.id}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this album and all its photos?")) return;
    setDeletingId(id);
    const result = await apiDelete(`/api/admin/gallery/${id}`);
    setDeletingId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (editingId === id) resetForm();
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
    setError(null);
    setMessage(null);

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
        setError(result.error);
        return;
      }
    }

    setSavingOrder(false);
    setMessage("Album order updated.");
    await loadAlbums();
    router.refresh();
  };

  return (
    <AdminSection
      title="Gallery albums"
      description="Create an album, then upload photos on the next screen. The first photo can become the cover automatically."
    >
      <AdminFormCard
        collapsible
        openTriggerLabel="Create album"
        title={editingId ? "Edit album" : "Create album"}
        error={error}
        message={message}
        onSubmit={handleSubmit}
        onCancel={editingId ? resetForm : undefined}
        submitLabel={editingId ? "Save album" : "Create & add photos"}
        loading={loading}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="album-title">Album title</Label>
            <Input
              id="album-title"
              value={form.title}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
              placeholder="e.g. Spring tournament 2026"
              required
            />
          </div>
          <div>
            <Label htmlFor="album-category">Category</Label>
            <Select
              id="album-category"
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
          {editingId && (
            <div className="sm:col-span-2">
              <GalleryCoverField
                coverImageUrl={form.coverImageUrl}
                onCoverChange={(url) => setForm({ ...form, coverImageUrl: url })}
                onUpload={async () => {
                  setError("Upload a cover from the album photos page.");
                }}
              />
            </div>
          )}
          <div className="sm:col-span-2">
            <Label htmlFor="album-description">Description (optional)</Label>
            <Textarea
              id="album-description"
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
            <Label htmlFor="album-position">Position</Label>
            <Input
              id="album-position"
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
        {visibleAlbums.length === 0 ? (
          <p className="text-sm text-zinc-400">
            {search.trim()
              ? "No albums match your search."
              : "No albums yet."}
          </p>
        ) : (
          visibleAlbums.map((album) => (
          <div
            key={album.id}
            draggable={!search.trim()}
            onDragStart={() => setDraggingAlbumId(album.id)}
            onDragEnd={() => setDraggingAlbumId(null)}
            onDragOver={(event) => {
              if (!search.trim()) event.preventDefault();
            }}
            onDrop={() => {
              if (search.trim() || !draggingAlbumId) return;
              moveAlbumBefore(draggingAlbumId, album.id);
            }}
            className="flex cursor-grab flex-col gap-3 rounded-sm border border-white/10 bg-jackals-inset/30 p-4 sm:flex-row sm:items-center"
          >
            <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-sm border border-white/10 bg-jackals-surface">
              {!isGalleryPlaceholderCover(album.coverImageUrl) ? (
                <Image
                  src={album.coverImageUrl}
                  alt=""
                  fill
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
              <Button type="button" variant="outline" size="sm" onClick={() => startEdit(album)}>
                Edit album
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={deletingId === album.id}
                onClick={() => handleDelete(album.id)}
                className="text-red-400 hover:text-red-300"
              >
                {deletingId === album.id ? "..." : "Delete"}
              </Button>
            </div>
          </div>
          ))
        )}
        {!search.trim() && (
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-zinc-500">
              Drag album cards to change order.
            </p>
            <Button
              type="button"
              size="sm"
              disabled={!hasOrderChanges || savingOrder}
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
