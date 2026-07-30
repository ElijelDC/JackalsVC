import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function DashboardBackLink({
  href,
  label,
  className = "mb-6",
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-jackals-red-light ${className}`}
    >
      <ArrowLeft className="h-4 w-4" />
      Back to {label}
    </Link>
  );
}
