import type { LucideIcon } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";

export function StatCard({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <div className="mb-3 flex h-10 w-10 items-center justify-center bg-jackals-red/15 text-jackals-red-light clip-slash-reverse">
        <Icon className="h-5 w-5" />
      </div>
      <CardTitle>{title}</CardTitle>
      <CardDescription className="mt-2">{children}</CardDescription>
    </Card>
  );
}
