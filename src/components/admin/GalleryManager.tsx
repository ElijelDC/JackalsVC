"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminFormCard, AdminListItem } from "@/components/admin/AdminForm";
import { AdminSection } from "@/components/admin/AdminShell";
import { Checkbox, Input, Label, Select } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/InputFields";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/client-api";

type GalleryItem = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  category: string;
  featured: boolean;
};

const CATEGORIES = ["MATCH", "TRAINING", "SOCIAL", "EVENT"] as const;

const emptyForm = {
  title: "",
  description: "",
  imageUrl: "",
  category: "TRAINING" as (typeof CATEGORIES)[number],
  featured: false,
};

export function GalleryManager({
  initialImages,
}: {
  initialImages: GalleryItem[];
}) {
  const router = useRouter();
  const [images, setImages] = useState(initialImages);
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

  const loadImages = useCallback(async () => {
    const result = await apiGet<{ images: GalleryItem[] }>("/api/admin/gallery");
    if (result.ok) setImages(result.data.images);
  }, []);

  const startEdit = (image: GalleryItem) => {
    setEditingId(image.id);
    setForm({
      title: image.title,
      description: image.description ?? "",
      imageUrl: image.imageUrl,
      category: image.category as (typeof CATEGORIES)[number],
      featured: image.featured,
    });
    setError(null);
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const payload = {
      title: form.title,
      description: form.description || undefined,
      imageUrl: form.imageUrl,
      category: form.category,
      featured: form.featured,
    };

    const result = editingId
      ? await apiPut(`/api/admin/gallery/${editingId}`, payload)
      : await apiPost("/api/admin/gallery", payload);

    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setMessage(editingId ? "Image updated." : "Image added.");
    resetForm();
    await loadImages();
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this gallery image?")) return;
    setDeletingId(id);
    const result = await apiDelete(`/api/admin/gallery/${id}`);
    setDeletingId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (editingId === id) resetForm();
    await loadImages();
    router.refresh();
  };

  useEffect(() => {
    setImages(initialImages);
  }, [initialImages]);

  return (
    <AdminSection
      title="Gallery"
      description="Manage photos shown on the public Gallery page."
    >
      <AdminFormCard
        title={editingId ? "Edit image" : "Add new image"}
        error={error}
        message={message}
        onSubmit={handleSubmit}
        onCancel={editingId ? resetForm : undefined}
        submitLabel={editingId ? "Save changes" : "Add image"}
        loading={loading}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="gallery-title">Title</Label>
            <Input
              id="gallery-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="gallery-category">Category</Label>
            <Select
              id="gallery-category"
              value={form.category}
              onChange={(e) =>
                setForm({
                  ...form,
                  category: e.target.value as (typeof CATEGORIES)[number],
                })
              }
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="gallery-url">Image URL</Label>
            <Input
              id="gallery-url"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="/gallery/match-1.jpg"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="gallery-description">Description (optional)</Label>
            <Textarea
              id="gallery-description"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <Checkbox
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
            />
            Show on homepage
          </label>
        </div>
      </AdminFormCard>

      <div className="space-y-3">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Current images ({images.length})
        </h3>
        {images.map((image) => (
          <AdminListItem
            key={image.id}
            title={image.title}
            subtitle={`${image.category}${image.featured ? " · Featured" : ""} · ${image.imageUrl}`}
            onEdit={() => startEdit(image)}
            onDelete={() => handleDelete(image.id)}
            deleting={deletingId === image.id}
          />
        ))}
      </div>
    </AdminSection>
  );
}
