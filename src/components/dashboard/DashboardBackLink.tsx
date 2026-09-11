import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardBackLink({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] py-1.5 pl-1.5 pr-3.5",
        "text-xs font-medium text-zinc-300 transition-colors",
        "hover:border-jackals-red/35 hover:bg-jackals-red/[0.08] hover:text-white",
        className ?? "mb-6",
      )}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-jackals-red/15 text-jackals-red-light transition-colors group-hover:bg-jackals-red/25">
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.25} />
      </span>
      <span>
        Back to <span className="text-white">{label}</span>
      </span>
    </Link>
  );
}
