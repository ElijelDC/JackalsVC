import { prisma } from "@/lib/prisma";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";

export const metadata = {
  title: "Gallery",
};

export default async function GalleryPage() {
  const images = await prisma.galleryImage.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <PageContainer>
      <PageHeader
        title="Gallery"
        description="Match highlights, training sessions, and club socials — captured on and off the court."
      />
      <GalleryGrid images={images} />
    </PageContainer>
  );
}
