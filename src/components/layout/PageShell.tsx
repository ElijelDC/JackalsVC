import { cn } from "@/lib/utils";

export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  className,
  centered = false,
}: {
  title: string;
  description?: string;
  className?: string;
  centered?: boolean;
}) {
  return (
    <div
      className={cn(
        "mb-10",
        centered && "text-center",
        className,
      )}
    >
      <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">
        {title}
      </h1>
      {description && (
        <p
          className={cn(
            "mt-3 max-w-2xl text-zinc-400",
            centered && "mx-auto",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
