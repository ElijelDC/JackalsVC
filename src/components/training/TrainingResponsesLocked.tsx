import { format } from "date-fns";
import { Lock } from "lucide-react";
import { TRAINING_RESPONSE_OPENS_DAYS } from "@/lib/training-attendance-config";
import { cn } from "@/lib/utils";

export function TrainingResponsesLockedBadge({
  opensOn,
  className,
}: {
  opensOn: Date;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-zinc-500/50 bg-zinc-500/15 px-2.5 py-1 text-xs font-semibold text-zinc-300",
        className,
      )}
    >
      <Lock className="h-3 w-3 shrink-0" aria-hidden />
      Not open yet · Opens {format(opensOn, "d MMM")}
    </span>
  );
}

export function TrainingResponsesLockedNotice({
  opensOn,
  className,
  itemLabel = "session",
}: {
  opensOn: Date;
  className?: string;
  itemLabel?: string;
}) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border border-zinc-600/50 bg-zinc-500/10 px-4 py-3",
        className,
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-500/40 bg-zinc-500/15">
        <Lock className="h-4 w-4 text-zinc-400" aria-hidden />
      </div>
      <div>
        <p className="text-sm font-medium text-zinc-300">Responses not open yet</p>
        <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
          You can respond from {format(opensOn, "d MMMM")} —{" "}
          {TRAINING_RESPONSE_OPENS_DAYS} days before the {itemLabel}.
        </p>
      </div>
    </div>
  );
}
