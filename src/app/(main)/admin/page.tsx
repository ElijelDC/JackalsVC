import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { AdminSection } from "@/components/admin/AdminShell";
import { Calendar, Camera, Dumbbell, Package } from "lucide-react";

export const metadata = {
  title: "Admin",
};

const SECTIONS = [
  {
    href: "/admin/training",
    title: "Training",
    description: "Weekly session times and locations",
    icon: Dumbbell,
    countKey: "training" as const,
  },
  {
    href: "/admin/events",
    title: "Events",
    description: "Calendar events and tournaments",
    icon: Calendar,
    countKey: "events" as const,
  },
  {
    href: "/admin/products",
    title: "Products",
    description: "Club shop inventory",
    icon: Package,
    countKey: "products" as const,
  },
  {
    href: "/admin/gallery",
    title: "Gallery",
    description: "Photos and highlights",
    icon: Camera,
    countKey: "gallery" as const,
  },
];

export default async function AdminPage() {
  const [training, events, products, gallery] = await Promise.all([
    prisma.trainingSession.count(),
    prisma.event.count(),
    prisma.product.count(),
    prisma.galleryImage.count(),
  ]);

  const counts = { training, events, products, gallery };

  return (
    <AdminSection
      title="Overview"
      description="Manage club content from here. Changes go live on the public site immediately."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map(({ href, title, description, icon: Icon, countKey }) => (
          <Link key={href} href={href}>
            <Card className="h-full transition-colors hover:border-jackals-red/40">
              <div className="mb-3 flex h-10 w-10 items-center justify-center bg-jackals-red/15 text-jackals-red-light">
                <Icon className="h-5 w-5" />
              </div>
              <CardTitle>{title}</CardTitle>
              <CardDescription className="mt-2">{description}</CardDescription>
              <p className="mt-4 text-sm font-medium text-jackals-red-light">
                {counts[countKey]} item{counts[countKey] !== 1 ? "s" : ""} →
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </AdminSection>
  );
}
