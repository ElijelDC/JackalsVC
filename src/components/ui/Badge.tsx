import { cn } from "@/lib/utils";

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block bg-jackals-red/15 px-2.5 py-0.5 text-xs font-medium text-jackals-red-light",
        className,
      )}
    >
      {children}
    </span>
  );
}
