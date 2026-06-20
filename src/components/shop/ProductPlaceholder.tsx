import { cn } from "@/lib/utils";

export function ProductPlaceholder({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "text-2xl",
    md: "text-5xl",
    lg: "text-8xl",
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-jackals-surface text-zinc-600",
        className,
      )}
    >
      <span className={sizes[size]} aria-hidden>
        🏐
      </span>
    </div>
  );
}
