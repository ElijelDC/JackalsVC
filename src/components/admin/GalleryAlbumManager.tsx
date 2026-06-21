"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminFormCard, AdminListItem } from "@/components/admin/AdminForm";
import { AdminSection } from "@/components/admin/AdminShell";
import { Checkbox, Input, Label, Select } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/InputFields";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/client-api";

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

const CATEGORIES = ["MATCH", "TRAINING", "SOCIAL", "EVENT"] as const;

const emptyForm = {
  title: "",
  description: "",
  coverImageUrl: "",
  category: "TRAINING" as (typeof CATEGORIES)[number],
  featured: false,
  sortOrder: 0,
};

export function GalleryAlbumManager({
  initialAlbums,
}: {
  initialAlbums: AlbumItem[];
}) {
  const router = useRouter();
  const [albums, setAlbums] = useState(initialAlbums);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError(null);
  };

  const loadAlbums = useCallback(async () => {
    const result = await apiGet<{ albums: AlbumItem[] }>("/api/admin/gallery");
    if (result.ok) setAlbums(result.data.albums);
  }, []);

  const startEdit = (album: AlbumItem) => {
    setEditingId(album.id);
    setForm({
      title: album.title,
      description: album.description ?? "",
      coverImageUrl: album.coverImageUrl,
      category: album.category as (typeof CATEGORIES)[number],
      featured: album.featured,
      sortOrder: album.sortOrder,
    });
    setError(null);
    setMessage(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const payload = {
      title: form.title,
      description: form.description || undefined,
      coverImageUrl: form.coverImageUrl,
      category: form.category,
      featured: form.featured,
      sortOrder: form.sortOrder,
    };

    const result = editingId
      ? await apiPut(`/api/admin/gallery/${editingId}`, payload)
      : await apiPost("/api/admin/gallery", payload);

    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setMessage(editingId ? "Album updated." : "Album created.");
    resetForm();
    await loadAlbums();
    router.refresh();
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

  useEffect(() => {
    setAlbums(initialAlbums);
  }, [initialAlbums]);

  return (
    <AdminSection
      title="Gallery albums"
      description="Create albums with a cover photo, then add more photos inside each album."
    >
      <AdminFormCard
        title={editingId ? "Edit album" : "Create album"}
        error={error}
        message={message}
        onSubmit={handleSubmit}
        onCancel={editingId ? resetForm : undefined}
        submitLabel={editingId ? "Save album" : "Create album"}
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
                  category: event.target.value as (typeof CATEGORIES)[number],
                })
              }
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="album-sort">Sort order</Label>
            <Input
              id="album-sort"
              type="number"
              min={0}
              value={form.sortOrder}
              onChange={(event) =>
                setForm({
                  ...form,
                  sortOrder: Number(event.target.value) || 0,
                })
              }
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="album-cover">Cover image URL</Label>
            <Input
              id="album-cover"
              value={form.coverImageUrl}
              onChange={(event) =>
                setForm({ ...form, coverImageUrl: event.target.value })
              }
              placeholder="/gallery/cover.jpg"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="album-description">Description (optional)</Label>
            <Textarea
              id="album-description"
              rows={3}
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <Checkbox
              checked={form.featured}
              onChange={(event) =>
                setForm({ ...form, featured: event.target.checked })
              }
            />
            Show on homepage
          </label>
        </div>
      </AdminFormCard>

      <div className="space-y-3">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Current albums ({albums.length})
        </h3>
        {albums.map((album) => (
          <AdminListItem
            key={album.id}
            title={album.title}
            subtitle={`${album.category} · ${album._count.photos} photo${album._count.photos === 1 ? "" : "s"}${album.featured ? " · Featured" : ""}`}
            note={album.coverImageUrl}
            secondaryHref={`/admin/gallery/${album.id}`}
            secondaryLabel="Manage photos →"
            onEdit={() => startEdit(album)}
            onDelete={() => handleDelete(album.id)}
            deleting={deletingId === album.id}
          />
        ))}
      </div>
    </AdminSection>
  );
}
