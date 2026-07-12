import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const getPublicTeamById = cache(async (id: string) =>
  prisma.clubTeam.findUnique({
    where: { id },
    include: {
      members: {
        where: { hidden: false },
        orderBy: [{ role: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  }),
);

export const getPublicGalleryAlbumById = cache(async (id: string) =>
  prisma.galleryAlbum.findUnique({
    where: { id },
    include: {
      photos: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  }),
);
