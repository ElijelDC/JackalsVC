import { useEffect, type RefObject } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return <p className="text-sm text-red-400">{message}</p>;
}

/** Prominent inline alert for form validation and submit errors. */
export function FormErrorAlert({
  message,
  className,
  ref,
}: {
  message: string | null;
  className?: string;
  ref?: RefObject<HTMLDivElement | null>;
}) {
  if (!message) return null;
  return (
    <div
      ref={ref}
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100",
        className,
      )}
    >
      <AlertCircle
        className="mt-0.5 h-4 w-4 shrink-0 text-red-400"
        aria-hidden
      />
      <p className="leading-relaxed">{message}</p>
    </div>
  );
}

/** Scroll the error alert into view when a message appears. */
export function useFormErrorFocus(
  message: string | null,
  ref: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!message) return;
    ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [message, ref]);
}

export function AlertBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="mb-6 border border-jackals-red/30 bg-jackals-red/10 px-4 py-3 text-sm text-jackals-red-light">
      {message}
    </div>
  );
}

export function SuccessBanner({
  message,
  ref,
}: {
  message: string | null;
  ref?: React.Ref<HTMLDivElement>;
}) {
  if (!message) return null;
  return (
    <div
      ref={ref}
      className="mb-6 border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400"
    >
      {message}
    </div>
  );
}

export function WarningBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
      {message}
    </div>
  );
}
