"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminFormCard } from "@/components/admin/AdminForm";
import { GalleryBulkUpload } from "@/components/admin/GalleryBulkUpload";
import { GalleryCoverField } from "@/components/admin/GalleryCoverField";
import { GalleryPhotoGrid } from "@/components/admin/GalleryPhotoGrid";
import { AdminSection } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormMessage";
import { Checkbox, Input, Label, Select } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/InputFields";
import { GALLERY_PLACEHOLDER_COVER } from "@/lib/gallery-config";
import { apiDelete, apiGet, apiPost, apiPostForm, apiPut } from "@/lib/client-api";

type GalleryPhoto = {
  id: string;
  title: string | null;
  caption: string | null;
  imageUrl: string;
  sortOrder: number;
};

type GalleryAlbum = {
  id: string;
  title: string;
  description: string | null;
  coverImageUrl: string;
  category: string;
  featured: boolean;
  sortOrder: number;
  photos: GalleryPhoto[];
};

import { GALLERY_CATEGORIES } from "@/lib/gallery-categories";

const emptyPhotoForm = {
  title: "",
  caption: "",
  imageUrl: "",
  sortOrder: 0,
};

export function GalleryAlbumEditor({
  initialAlbum,
}: {
  initialAlbum: GalleryAlbum;
}) {
  return (
    <GalleryAlbumEditorInner
      key={albumSyncKey(initialAlbum)}
      initialAlbum={initialAlbum}
    />
  );
}

function albumSyncKey(album: GalleryAlbum) {
  return `${album.id}:${album.title}:${album.photos.length}:${album.photos.map((photo) => photo.id).join(",")}`;
}

function GalleryAlbumEditorInner({
  initialAlbum,
}: {
  initialAlbum: GalleryAlbum;
}) {
  const router = useRouter();
  const [album, setAlbum] = useState(initialAlbum);
  const [albumForm, setAlbumForm] = useState({
    title: initialAlbum.title,
    description: initialAlbum.description ?? "",
    coverImageUrl: initialAlbum.coverImageUrl,
    category: initialAlbum.category as (typeof GALLERY_CATEGORIES)[number],
    featured: initialAlbum.featured,
    sortOrder: initialAlbum.sortOrder,
  });
  const [createPhotoForm, setCreatePhotoForm] = useState(emptyPhotoForm);
  const [editPhotoForm, setEditPhotoForm] = useState(emptyPhotoForm);
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [albumLoading, setAlbumLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const loadAlbum = useCallback(async () => {
    const result = await apiGet<{ album: GalleryAlbum }>(
      `/api/admin/gallery/${initialAlbum.id}`,
    );
    if (result.ok) {
      setAlbum(result.data.album);
      setAlbumForm((current) => ({
        ...current,
        coverImageUrl: result.data.album.coverImageUrl,
      }));
    }
  }, [initialAlbum.id]);

  const cancelEditPhoto = () => {
    setEditingPhotoId(null);
    setEditPhotoForm(emptyPhotoForm);
    setPhotoError(null);
  };

  const startEditPhoto = (photo: GalleryPhoto) => {
    setEditingPhotoId(photo.id);
    setEditPhotoForm({
      title: photo.title ?? "",
      caption: photo.caption ?? "",
      imageUrl: photo.imageUrl,
      sortOrder: photo.sortOrder,
    });
    setPhotoError(null);
    setError(null);
    setMessage(null);
  };

  const handleAlbumSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setAlbumLoading(true);
    setError(null);
    setMessage(null);

    const payload = {
      title: albumForm.title,
      description: albumForm.description || undefined,
      coverImageUrl: albumForm.coverImageUrl.trim() || GALLERY_PLACEHOLDER_COVER,
      category: albumForm.category,
      featured: albumForm.featured,
      sortOrder: albumForm.sortOrder,
    };

    const result = await apiPut(`/api/admin/gallery/${album.id}`, payload);
    setAlbumLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setMessage("Album details saved.");
    await loadAlbum();
    router.refresh();
  };

  const handleCreatePhoto = async (event: React.FormEvent) => {
    event.preventDefault();
    setPhotoLoading(true);
    setError(null);
    setMessage(null);

    const result = await apiPost(`/api/admin/gallery/${album.id}/photos`, {
      title: createPhotoForm.title || undefined,
      caption: createPhotoForm.caption || undefined,
      imageUrl: createPhotoForm.imageUrl,
      sortOrder: createPhotoForm.sortOrder,
    });

    setPhotoLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setMessage("Photo added.");
    setCreatePhotoForm(emptyPhotoForm);
    await loadAlbum();
    router.refresh();
  };

  const handleUpdatePhoto = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingPhotoId) return;

    setPhotoLoading(true);
    setPhotoError(null);
    setMessage(null);

    const result = await apiPut(
      `/api/admin/gallery/${album.id}/photos/${editingPhotoId}`,
      {
        title: editPhotoForm.title || undefined,
        caption: editPhotoForm.caption || undefined,
        imageUrl: editPhotoForm.imageUrl,
        sortOrder: editPhotoForm.sortOrder,
      },
    );

    setPhotoLoading(false);

    if (!result.ok) {
      setPhotoError(result.error);
      return;
    }

    setMessage("Photo updated.");
    cancelEditPhoto();
    await loadAlbum();
    router.refresh();
  };

  const uploadCover = async (file: File) => {
    setCoverUploading(true);
    setError(null);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    const result = await apiPostForm<{ coverImageUrl: string }>(
      `/api/admin/gallery/${album.id}/cover`,
      formData,
      "Cover upload failed.",
    );

    setCoverUploading(false);

    if (!result.ok) {
      throw new Error(result.error);
    }

    setAlbumForm((current) => ({
      ...current,
      coverImageUrl: result.data.coverImageUrl,
    }));
    setAlbum((current) => ({
      ...current,
      coverImageUrl: result.data.coverImageUrl,
    }));
    setMessage("Cover image uploaded.");
    await loadAlbum();
    router.refresh();
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm("Remove this photo from the album?")) return;
    setDeletingPhotoId(photoId);
    const result = await apiDelete(
      `/api/admin/gallery/${album.id}/photos/${photoId}`,
    );
    setDeletingPhotoId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    if (editingPhotoId === photoId) cancelEditPhoto();
    await loadAlbum();
    router.refresh();
  };

  return (
    <AdminSection
      title={album.title}
      description="Edit album details and manage photos inside this album."
    >
      <Link
        href="/admin/gallery"
        className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-jackals-red-light"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to albums
      </Link>

      <AdminFormCard
        collapsible
        openTriggerLabel="Edit album details"
        title="Album details"
        error={error}
        message={message}
        onSubmit={handleAlbumSubmit}
        submitLabel="Save album details"
        loading={albumLoading}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="album-title">Album title</Label>
            <Input
              id="album-title"
              value={albumForm.title}
              onChange={(event) =>
                setAlbumForm({ ...albumForm, title: event.target.value })
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="album-category">Category</Label>
            <Select
              id="album-category"
              value={albumForm.category}
              onChange={(event) =>
                setAlbumForm({
                  ...albumForm,
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
          <div>
            <Label htmlFor="album-sort">Sort order</Label>
            <Input
              id="album-sort"
              type="number"
              min={0}
              value={albumForm.sortOrder}
              onChange={(event) =>
                setAlbumForm({
                  ...albumForm,
                  sortOrder: Number(event.target.value) || 0,
                })
              }
            />
          </div>
          <div className="sm:col-span-2">
            <GalleryCoverField
              coverImageUrl={albumForm.coverImageUrl}
              onCoverChange={(url) =>
                setAlbumForm({ ...albumForm, coverImageUrl: url })
              }
              onUpload={uploadCover}
              uploading={coverUploading}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="album-description">Description</Label>
            <Textarea
              id="album-description"
              rows={3}
              value={albumForm.description}
              onChange={(event) =>
                setAlbumForm({ ...albumForm, description: event.target.value })
              }
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <Checkbox
              checked={albumForm.featured}
              onChange={(event) =>
                setAlbumForm({ ...albumForm, featured: event.target.checked })
              }
            />
            Show on homepage
          </label>
        </div>
      </AdminFormCard>

      <GalleryBulkUpload
        albumId={album.id}
        onUploaded={async (result) => {
          if (result?.coverImageUrl) {
            setAlbumForm((current) => ({
              ...current,
              coverImageUrl: result.coverImageUrl!,
            }));
          }
          await loadAlbum();
          router.refresh();
        }}
      />

      <AdminFormCard
        collapsible
        openTriggerLabel="Advanced: add photo by URL"
        title="Advanced: add photo by URL"
        error={editingPhotoId ? null : error}
        message={editingPhotoId ? null : message}
        onSubmit={handleCreatePhoto}
        submitLabel="Add photo"
        loading={photoLoading && !editingPhotoId}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="photo-create-sort">Sort order</Label>
            <Input
              id="photo-create-sort"
              type="number"
              min={0}
              value={createPhotoForm.sortOrder}
              onChange={(event) =>
                setCreatePhotoForm({
                  ...createPhotoForm,
                  sortOrder: Number(event.target.value) || 0,
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="photo-create-title">Title (optional)</Label>
            <Input
              id="photo-create-title"
              value={createPhotoForm.title}
              onChange={(event) =>
                setCreatePhotoForm({
                  ...createPhotoForm,
                  title: event.target.value,
                })
              }
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="photo-create-url">Image URL</Label>
            <Input
              id="photo-create-url"
              value={createPhotoForm.imageUrl}
              onChange={(event) =>
                setCreatePhotoForm({
                  ...createPhotoForm,
                  imageUrl: event.target.value,
                })
              }
              placeholder="/uploads/gallery/photo.jpg"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="photo-create-caption">Caption (optional)</Label>
            <Textarea
              id="photo-create-caption"
              rows={2}
              value={createPhotoForm.caption}
              onChange={(event) =>
                setCreatePhotoForm({
                  ...createPhotoForm,
                  caption: event.target.value,
                })
              }
            />
          </div>
        </div>
      </AdminFormCard>

      {!editingPhotoId && (error || message) && (
        <p
          className={`mb-4 text-sm ${error ? "text-red-400" : "text-green-400"}`}
        >
          {error ?? message}
        </p>
      )}

      <div className="space-y-3">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Photos in album ({album.photos.length})
        </h3>
        {message && editingPhotoId ? (
          <p className="text-sm text-emerald-300">{message}</p>
        ) : null}
        <GalleryPhotoGrid
          photos={album.photos}
          editingPhotoId={editingPhotoId}
          deletingPhotoId={deletingPhotoId}
          onEdit={startEditPhoto}
          onDelete={handleDeletePhoto}
          editForm={
            editingPhotoId ? (
              <form
                onSubmit={(e) => void handleUpdatePhoto(e)}
                className="space-y-3 border-t border-jackals-red/30 bg-jackals-red/5 p-3"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="photo-edit-sort">Sort order</Label>
                    <Input
                      id="photo-edit-sort"
                      type="number"
                      min={0}
                      value={editPhotoForm.sortOrder}
                      onChange={(event) =>
                        setEditPhotoForm({
                          ...editPhotoForm,
                          sortOrder: Number(event.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="photo-edit-title">Title (optional)</Label>
                    <Input
                      id="photo-edit-title"
                      value={editPhotoForm.title}
                      onChange={(event) =>
                        setEditPhotoForm({
                          ...editPhotoForm,
                          title: event.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="photo-edit-url">Image URL</Label>
                    <Input
                      id="photo-edit-url"
                      value={editPhotoForm.imageUrl}
                      onChange={(event) =>
                        setEditPhotoForm({
                          ...editPhotoForm,
                          imageUrl: event.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="photo-edit-caption">
                      Caption (optional)
                    </Label>
                    <Textarea
                      id="photo-edit-caption"
                      rows={2}
                      value={editPhotoForm.caption}
                      onChange={(event) =>
                        setEditPhotoForm({
                          ...editPhotoForm,
                          caption: event.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <FormError message={photoError} />
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" size="sm" disabled={photoLoading}>
                    {photoLoading ? "Saving..." : "Save photo"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={cancelEditPhoto}
                    disabled={photoLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : null
          }
        />
      </div>
    </AdminSection>
  );
}
