import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  className,
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border border-dashed border-white/15 bg-jackals-surface/40 px-6 py-12 text-center",
        className,
      )}
    >
      <p className="font-medium text-zinc-300">{title}</p>
      {description && (
        <p className="mt-2 text-sm text-zinc-500">{description}</p>
      )}
    </div>
  );
}
