"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Images, Loader2, Upload } from "lucide-react";
import { AdminFormCard, AdminListItem, beginAdminEdit } from "@/components/admin/AdminForm";
import { AdminSection } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import {
  apiDelete,
  apiPatch,
  apiPost,
  apiPostForm,
} from "@/lib/client-api";
import {
  GALLERY_ACCEPTED_IMAGE_TYPES,
  GALLERY_MAX_UPLOAD_BYTES,
} from "@/lib/gallery-upload-config";
import { isAcceptedImageFile } from "@/lib/image-upload-types";
import {
  TOURNAMENT_COVER_ASPECT,
  TOURNAMENT_COVER_ASPECT_LABEL,
  TOURNAMENT_COVER_OUTPUT_WIDTH,
} from "@/lib/tournament-cover";
import {
  TOURNAMENT_WINNER_KIND_LABELS,
  TOURNAMENT_WINNER_PHOTO_ASPECT,
  TOURNAMENT_WINNER_PHOTO_ASPECT_LABEL,
  TOURNAMENT_WINNER_PHOTO_KINDS,
  TOURNAMENT_WINNER_PHOTO_OUTPUT_WIDTH,
  type TournamentWinnerPhotoKind,
} from "@/lib/tournament-winner-photo";
import { cn } from "@/lib/utils";

const ImageCropDialog = dynamic(
  () =>
    import("@/components/admin/ImageCropDialog").then(
      (mod) => mod.ImageCropDialog,
    ),
  { ssr: false },
);

type CropTarget = "cover" | "winner";

export type TournamentPhotoOption = {
  slug: string;
  title: string;
};

export type TournamentWinnerPhotoItem = {
  id: string;
  tournamentSlug: string;
  kind: string;
  imageUrl: string;
  alt: string | null;
  sortOrder: number;
};

export type TournamentLinkedAlbum = {
  id: string;
  title: string;
  tournamentSlug: string | null;
  _count: { photos: number };
};

export type TournamentCoverItem = {
  tournamentSlug: string;
  imageUrl: string;
};

export function TournamentWinnerPhotosManager({
  tournaments,
  initialPhotos,
  initialAlbums,
  initialCovers,
}: {
  tournaments: TournamentPhotoOption[];
  initialPhotos: TournamentWinnerPhotoItem[];
  initialAlbums: TournamentLinkedAlbum[];
  initialCovers: TournamentCoverItem[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState(initialPhotos);
  const [albums, setAlbums] = useState(initialAlbums);
  const [covers, setCovers] = useState(initialCovers);
  const tournamentParam = searchParams.get("tournament")?.trim() ?? "";
  const initialSlug =
    (tournamentParam &&
      tournaments.some((t) => t.slug === tournamentParam) &&
      tournamentParam) ||
    tournaments[0]?.slug ||
    "";
  const [slug, setSlug] = useState(initialSlug);
  const [kind, setKind] = useState<TournamentWinnerPhotoKind>("PODIUM");
  const [alt, setAlt] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [coverLoading, setCoverLoading] = useState(false);
  const [albumLoading, setAlbumLoading] = useState(false);
  const [linkAlbumId, setLinkAlbumId] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<CropTarget | null>(null);

  useEffect(() => {
    setAlbums(initialAlbums);
  }, [initialAlbums]);

  useEffect(() => {
    setCovers(initialCovers);
  }, [initialCovers]);

  useEffect(() => {
    if (
      tournamentParam &&
      tournaments.some((t) => t.slug === tournamentParam) &&
      tournamentParam !== slug
    ) {
      setSlug(tournamentParam);
    }
  }, [tournamentParam, tournaments, slug]);

  const selectTournament = (nextSlug: string) => {
    setSlug(nextSlug);
    const params = new URLSearchParams(searchParams.toString());
    if (nextSlug) params.set("tournament", nextSlug);
    else params.delete("tournament");
    const query = params.toString();
    router.replace(
      query
        ? `/admin/tournament-photos?${query}`
        : "/admin/tournament-photos",
      { scroll: false },
    );
  };

  useEffect(() => {
    return () => {
      if (cropSrc) URL.revokeObjectURL(cropSrc);
    };
  }, [cropSrc]);

  const filtered = useMemo(
    () => photos.filter((photo) => photo.tournamentSlug === slug),
    [photos, slug],
  );

  const linkedAlbum = useMemo(
    () => albums.find((album) => album.tournamentSlug === slug) ?? null,
    [albums, slug],
  );

  const linkableAlbums = useMemo(
    () =>
      albums.filter((album) => album.tournamentSlug !== slug),
    [albums, slug],
  );

  const tournamentTitleBySlug = useMemo(() => {
    const map = new Map(tournaments.map((t) => [t.slug, t.title]));
    return map;
  }, [tournaments]);

  useEffect(() => {
    setLinkAlbumId("");
  }, [slug]);

  const coverUrl = useMemo(
    () => covers.find((cover) => cover.tournamentSlug === slug)?.imageUrl ?? null,
    [covers, slug],
  );

  const selectedTitle =
    tournaments.find((t) => t.slug === slug)?.title ?? slug;

  const clearCrop = () => {
    setCropSrc((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    setCropTarget(null);
  };

  const openCrop = (file: File, target: CropTarget) => {
    if (!slug) {
      setError("Choose a tournament first.");
      return;
    }
    if (!isAcceptedImageFile(file)) {
      setError("Only image files can be uploaded.");
      return;
    }
    if (file.size > GALLERY_MAX_UPLOAD_BYTES) {
      setError("Image must be smaller than 15 MB.");
      return;
    }
    setError(null);
    setCropTarget(target);
    setCropSrc((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
  };

  const openCoverCrop = (file: File) => openCrop(file, "cover");
  const openWinnerCrop = (file: File) => openCrop(file, "winner");

  const uploadCover = async (file: File) => {
    setCoverLoading(true);
    setError(null);
    setMessage(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("tournamentSlug", slug);
    const result = await apiPostForm<{ cover: TournamentCoverItem }>(
      "/api/admin/tournament-photos/cover",
      formData,
      "Cover upload failed.",
    );
    setCoverLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCovers((current) => {
      const without = current.filter((c) => c.tournamentSlug !== slug);
      return [...without, result.data.cover];
    });
    clearCrop();
    setMessage("Tournament cover updated.");
    router.refresh();
  };

  const removeCover = async () => {
    if (!slug) return;
    setCoverLoading(true);
    setError(null);
    setMessage(null);
    const result = await apiDelete(
      `/api/admin/tournament-photos/cover?tournamentSlug=${encodeURIComponent(slug)}`,
      "Could not remove cover.",
    );
    setCoverLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCovers((current) => current.filter((c) => c.tournamentSlug !== slug));
    setMessage("Cover removed — overview will use the default image.");
    router.refresh();
  };

  const ensureAlbum = async () => {
    if (!slug) {
      setError("Choose a tournament first.");
      return;
    }
    setAlbumLoading(true);
    setError(null);
    setMessage(null);
    const result = await apiPost<{
      album: TournamentLinkedAlbum;
      created: boolean;
    }>(
      "/api/admin/tournament-photos/album",
      { tournamentSlug: slug },
      "Could not create gallery album.",
    );
    setAlbumLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setAlbums((current) => {
      const without = current.filter(
        (album) =>
          album.tournamentSlug !== slug && album.id !== result.data.album.id,
      );
      return [...without, result.data.album];
    });
    setMessage(
      result.data.created
        ? "Gallery album created — add day photos there."
        : "Opening existing gallery album.",
    );
    router.push(`/admin/gallery/${result.data.album.id}`);
    router.refresh();
  };

  const linkAlbum = async () => {
    if (!slug) {
      setError("Choose a tournament first.");
      return;
    }
    if (!linkAlbumId) {
      setError("Choose an existing album to link.");
      return;
    }
    setAlbumLoading(true);
    setError(null);
    setMessage(null);
    const result = await apiPatch<{ album: TournamentLinkedAlbum | null }>(
      "/api/admin/tournament-photos/album",
      { tournamentSlug: slug, albumId: linkAlbumId },
      "Could not link gallery album.",
    );
    setAlbumLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (!result.data.album) {
      setError("Could not link gallery album.");
      return;
    }
    setAlbums((current) =>
      current.map((album) => {
        if (album.id === result.data.album!.id) {
          return result.data.album!;
        }
        if (album.tournamentSlug === slug) {
          return { ...album, tournamentSlug: null };
        }
        return album;
      }),
    );
    setLinkAlbumId("");
    setMessage("Existing gallery album linked to this tournament.");
    router.refresh();
  };

  const unlinkAlbum = async () => {
    if (!slug || !linkedAlbum) return;
    setAlbumLoading(true);
    setError(null);
    setMessage(null);
    const result = await apiPatch<{ album: TournamentLinkedAlbum | null }>(
      "/api/admin/tournament-photos/album",
      { tournamentSlug: slug, albumId: null },
      "Could not unlink gallery album.",
    );
    setAlbumLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setAlbums((current) =>
      current.map((album) =>
        album.tournamentSlug === slug
          ? { ...album, tournamentSlug: null }
          : album,
      ),
    );
    setMessage("Gallery album unlinked from this tournament.");
    router.refresh();
  };

  const uploadWinnerFile = async (file: File) => {
    if (!slug) {
      setError("Choose a tournament first.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("tournamentSlug", slug);

    const upload = await apiPostForm<{ imageUrl: string }>(
      "/api/admin/tournament-photos/upload",
      formData,
      "Image upload failed.",
    );

    if (!upload.ok) {
      setLoading(false);
      setError(upload.error);
      return;
    }

    if (editingId) {
      const update = await apiPatch<{ photo: TournamentWinnerPhotoItem }>(
        "/api/admin/tournament-photos",
        {
          id: editingId,
          kind,
          alt: alt.trim() || null,
          imageUrl: upload.data.imageUrl,
        },
        "Could not update photo.",
      );
      setLoading(false);
      if (!update.ok) {
        setError(update.error);
        return;
      }
      setPhotos((current) =>
        current.map((photo) =>
          photo.id === update.data.photo.id ? update.data.photo : photo,
        ),
      );
      clearCrop();
      setMessage("Photo image updated.");
      router.refresh();
      return;
    }

    const create = await apiPost<{ photo: TournamentWinnerPhotoItem }>(
      "/api/admin/tournament-photos",
      {
        tournamentSlug: slug,
        kind,
        imageUrl: upload.data.imageUrl,
        alt: alt.trim() || undefined,
      },
      "Could not save photo.",
    );

    setLoading(false);

    if (!create.ok) {
      setError(create.error);
      return;
    }

    setAlt("");
    clearCrop();
    setMessage("Photo added.");
    setPhotos((current) => [...current, create.data.photo]);
    router.refresh();
  };

  const startEdit = (photo: TournamentWinnerPhotoItem) => {
    beginAdminEdit(() => {
      setEditingId(photo.id);
      selectTournament(photo.tournamentSlug);
      setKind(
        (TOURNAMENT_WINNER_PHOTO_KINDS as readonly string[]).includes(photo.kind)
          ? (photo.kind as TournamentWinnerPhotoKind)
          : "OTHER",
      );
      setAlt(photo.alt ?? "");
      setError(null);
      setMessage(null);
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setKind("PODIUM");
    setAlt("");
    setError(null);
    setMessage(null);
    if (cropTarget === "winner") clearCrop();
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    const result = await apiPatch<{ photo: TournamentWinnerPhotoItem }>(
      "/api/admin/tournament-photos",
      {
        id: editingId,
        kind,
        alt: alt.trim() || null,
      },
      "Could not update photo.",
    );
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setPhotos((current) =>
      current.map((photo) =>
        photo.id === result.data.photo.id ? result.data.photo : photo,
      ),
    );
    cancelEdit();
    setMessage("Photo updated.");
    router.refresh();
  };

  const onDelete = async (id: string) => {
    setDeletingId(id);
    setError(null);
    setMessage(null);
    const result = await apiDelete(
      `/api/admin/tournament-photos?id=${encodeURIComponent(id)}`,
      "Could not delete photo.",
    );
    setDeletingId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (editingId === id) cancelEdit();
    setMessage("Photo removed.");
    setPhotos((current) => current.filter((photo) => photo.id !== id));
    router.refresh();
  };

  return (
    <AdminSection
      title="Tournament photos"
      description="Set the Our Tournaments cover (with crop), upload podium / winner shots (cropped to 4∶3), and link a gallery album for the full day."
    >
      <div className="mb-6 border border-white/10 bg-white/[0.02] px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
          <div className="relative aspect-[2.2/1] w-full max-w-md overflow-hidden border border-white/10 bg-black lg:max-w-sm">
            {coverUrl ? (
              <Image
                src={coverUrl}
                alt={`${selectedTitle} cover`}
                fill
                className="object-cover"
                sizes="400px"
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center px-4 text-center text-sm text-zinc-500">
                No custom cover yet
              </div>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-jackals-red-light">
                Our Tournaments cover
              </p>
              <p className="mt-1 font-display text-lg font-bold text-white">
                {selectedTitle || "Select a tournament"}
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                Cropped to {TOURNAMENT_COVER_ASPECT_LABEL} to match the public
                card exactly. Pick a photo, then drag/zoom to frame it.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                ref={coverInputRef}
                type="file"
                accept={GALLERY_ACCEPTED_IMAGE_TYPES}
                className="hidden"
                disabled={coverLoading || !slug}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) openCoverCrop(file);
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                size="sm"
                disabled={coverLoading || !slug}
                onClick={() => coverInputRef.current?.click()}
              >
                {coverLoading ? "Saving…" : coverUrl ? "Change cover" : "Upload cover"}
              </Button>
              {coverUrl ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={coverLoading}
                  onClick={() => void removeCover()}
                >
                  Remove cover
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 border border-white/10 bg-white/[0.02] px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-jackals-red-light">
                Gallery album
              </p>
              {linkedAlbum ? (
                <>
                  <p className="mt-1 font-display text-lg font-bold text-white">
                    {linkedAlbum.title}
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">
                    {linkedAlbum._count.photos} photo
                    {linkedAlbum._count.photos === 1 ? "" : "s"} · linked to this
                    tournament
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-1 font-display text-lg font-bold text-white">
                    No album yet
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">
                    Create a new album, or link an existing gallery album for{" "}
                    {selectedTitle || "this tournament"}.
                  </p>
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {linkedAlbum ? (
                <>
                  <Link href={`/admin/gallery/${linkedAlbum.id}`}>
                    <Button type="button" size="sm" className="gap-2">
                      <Images className="h-3.5 w-3.5" />
                      Manage album
                    </Button>
                  </Link>
                  <Link href={`/gallery/${linkedAlbum.id}`} target="_blank">
                    <Button type="button" size="sm" variant="outline">
                      View public album
                    </Button>
                  </Link>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={albumLoading}
                    onClick={() => void unlinkAlbum()}
                  >
                    Unlink
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  className="gap-2"
                  disabled={albumLoading || !slug}
                  onClick={() => void ensureAlbum()}
                >
                  {albumLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Images className="h-3.5 w-3.5" />
                  )}
                  Create gallery album
                </Button>
              )}
            </div>
          </div>

          {!linkedAlbum ? (
            <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1">
                <Label htmlFor="link-album">Add existing album</Label>
                <Select
                  id="link-album"
                  value={linkAlbumId}
                  onChange={(e) => setLinkAlbumId(e.target.value)}
                  disabled={albumLoading || !slug || linkableAlbums.length === 0}
                >
                  <option value="">
                    {linkableAlbums.length === 0
                      ? "No other albums available"
                      : "Choose an album…"}
                  </option>
                  {linkableAlbums.map((album) => {
                    const linkedTitle = album.tournamentSlug
                      ? tournamentTitleBySlug.get(album.tournamentSlug) ??
                        album.tournamentSlug
                      : null;
                    return (
                      <option key={album.id} value={album.id}>
                        {album.title} ({album._count.photos} photo
                        {album._count.photos === 1 ? "" : "s"})
                        {linkedTitle ? ` — linked to ${linkedTitle}` : ""}
                      </option>
                    );
                  })}
                </Select>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={albumLoading || !slug || !linkAlbumId}
                onClick={() => void linkAlbum()}
              >
                {albumLoading ? "Linking…" : "Link album"}
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <AdminFormCard
          title={editingId ? "Edit winner photo" : "Add winner photo"}
          error={error}
          message={message}
          submitLabel={
            loading
              ? editingId
                ? "Saving…"
                : "Uploading…"
              : editingId
                ? "Save changes"
                : "Choose image"
          }
          loading={loading}
          onCancel={editingId ? cancelEdit : undefined}
          onSubmit={(e) => {
            e.preventDefault();
            if (editingId) {
              void saveEdit();
              return;
            }
            inputRef.current?.click();
          }}
        >
          <p className="-mt-1 text-sm text-zinc-500">
            Winner shots are cropped to {TOURNAMENT_WINNER_PHOTO_ASPECT_LABEL} to
            match the public gallery tiles.
          </p>
          <div>
            <Label htmlFor="tournament-slug">Tournament</Label>
            <Select
              id="tournament-slug"
              value={slug}
              onChange={(e) => selectTournament(e.target.value)}
              disabled={loading || Boolean(editingId) || tournaments.length === 0}
            >
              {tournaments.length === 0 ? (
                <option value="">No tournaments configured</option>
              ) : (
                tournaments.map((t) => (
                  <option key={t.slug} value={t.slug}>
                    {t.title}
                  </option>
                ))
              )}
            </Select>
          </div>

          <div>
            <Label htmlFor="photo-kind">Photo type</Label>
            <Select
              id="photo-kind"
              value={kind}
              onChange={(e) =>
                setKind(e.target.value as TournamentWinnerPhotoKind)
              }
              disabled={loading}
            >
              {TOURNAMENT_WINNER_PHOTO_KINDS.map((value) => (
                <option key={value} value={value}>
                  {TOURNAMENT_WINNER_KIND_LABELS[value]}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="photo-alt">Caption</Label>
            <Input
              id="photo-alt"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder={`e.g. ${selectedTitle} champions`}
              disabled={loading}
            />
          </div>

          {editingId ? (
            <div className="space-y-3">
              <p className="text-sm text-zinc-400">
                Update the photo type or caption, then save. To reframe heads and
                feet, replace the image — you&apos;ll crop to{" "}
                {TOURNAMENT_WINNER_PHOTO_ASPECT_LABEL} before it uploads.
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={loading || !slug}
                onClick={() => inputRef.current?.click()}
              >
                Replace &amp; crop image
              </Button>
            </div>
          ) : (
            <div
              className={cn(
                "relative flex flex-col items-center justify-center gap-3 border border-dashed border-white/20 bg-white/[0.02] px-4 py-8 text-center transition-colors",
                dragging && "border-jackals-red/50 bg-jackals-red/5",
                loading && "opacity-60",
              )}
              onDragEnter={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) openWinnerCrop(file);
              }}
            >
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin text-jackals-red-light" />
              ) : (
                <Upload className="h-6 w-6 text-jackals-red-light" />
              )}
              <p className="text-sm text-zinc-400">
                Drop an image here to crop to {TOURNAMENT_WINNER_PHOTO_ASPECT_LABEL}
                , or browse below
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={loading || !slug}
                onClick={() => inputRef.current?.click()}
              >
                Browse files
              </Button>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={GALLERY_ACCEPTED_IMAGE_TYPES}
            className="hidden"
            disabled={loading || !slug}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) openWinnerCrop(file);
              e.target.value = "";
            }}
          />
        </AdminFormCard>

        <div className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-jackals-red-light">
                Current photos
              </p>
              <h3 className="mt-1 font-display text-xl font-bold text-white">
                {selectedTitle || "Select a tournament"}
              </h3>
            </div>
            <p className="text-sm text-zinc-500">
              {filtered.length} photo{filtered.length === 1 ? "" : "s"}
            </p>
          </div>

          {filtered.length === 0 ? (
            <p className="border border-white/10 bg-white/[0.02] px-4 py-8 text-sm text-zinc-500">
              No winner photos yet for this tournament. Upload a podium shot or
              separate place photos.
            </p>
          ) : (
            filtered.map((photo) => (
              <AdminListItem
                key={photo.id}
                title={
                  TOURNAMENT_WINNER_KIND_LABELS[
                    photo.kind as TournamentWinnerPhotoKind
                  ] ?? photo.kind
                }
                subtitle={photo.alt || "No caption"}
                note={photo.imageUrl}
                onEdit={() => startEdit(photo)}
                onDelete={() => void onDelete(photo.id)}
                deleting={deletingId === photo.id}
                formAction={{
                  label: "Preview",
                  onClick: () => window.open(photo.imageUrl, "_blank"),
                }}
              />
            ))
          )}

          {filtered.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {filtered.map((photo) => (
                <div
                  key={`${photo.id}-thumb`}
                  className="relative aspect-[4/3] overflow-hidden border border-white/10 bg-black"
                >
                  <Image
                    src={photo.imageUrl}
                    alt={photo.alt ?? "Winner photo"}
                    fill
                    className="object-cover"
                    sizes="200px"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <ImageCropDialog
        key={cropTarget === "cover" ? cropSrc ?? "cover-closed" : "cover-idle"}
        open={Boolean(cropSrc) && cropTarget === "cover"}
        imageSrc={cropSrc}
        aspect={TOURNAMENT_COVER_ASPECT}
        aspectLabel={TOURNAMENT_COVER_ASPECT_LABEL}
        title="Crop tournament cover"
        confirmLabel={coverLoading ? "Saving…" : "Save cover"}
        fileNamePrefix="tournament-cover"
        outputWidth={TOURNAMENT_COVER_OUTPUT_WIDTH}
        description={`Drag to position, pinch or use the slider to zoom. Frame is locked to ${TOURNAMENT_COVER_ASPECT_LABEL} so it matches the Our Tournaments card exactly.`}
        onCancel={() => {
          if (coverLoading) return;
          clearCrop();
        }}
        onConfirm={(file) => uploadCover(file)}
      />

      <ImageCropDialog
        key={cropTarget === "winner" ? cropSrc ?? "winner-closed" : "winner-idle"}
        open={Boolean(cropSrc) && cropTarget === "winner"}
        imageSrc={cropSrc}
        aspect={TOURNAMENT_WINNER_PHOTO_ASPECT}
        aspectLabel={TOURNAMENT_WINNER_PHOTO_ASPECT_LABEL}
        title={editingId ? "Recrop winner photo" : "Crop winner photo"}
        confirmLabel={
          loading
            ? "Saving…"
            : editingId
              ? "Save cropped image"
              : "Upload cropped photo"
        }
        fileNamePrefix="tournament-winner"
        outputWidth={TOURNAMENT_WINNER_PHOTO_OUTPUT_WIDTH}
        description={`Drag to position, pinch or use the slider to zoom. Frame is locked to ${TOURNAMENT_WINNER_PHOTO_ASPECT_LABEL} so heads and feet stay in frame on the public gallery.`}
        onCancel={() => {
          if (loading) return;
          clearCrop();
        }}
        onConfirm={(file) => uploadWinnerFile(file)}
      />
    </AdminSection>
  );
}
