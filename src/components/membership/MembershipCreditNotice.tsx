import Link from "next/link";
import { Wallet } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { withDashboardReturn } from "@/lib/dashboard-return";
import { formatEuroFee } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function MembershipCreditNotice({
  creditEur,
  note,
  variant = "upcoming",
  className,
}: {
  creditEur: number;
  note?: string | null;
  /** pending = not yet applied; applied = already reduced next instalment */
  variant?: "upcoming" | "applied";
  className?: string;
}) {
  if (creditEur <= 0) return null;

  const reason = note?.trim() || "merch / fun session overpayment";

  return (
    <Card
      className={cn(
        "border-emerald-500/30 bg-emerald-500/10",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
          <Wallet className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <CardTitle className="text-base text-emerald-100">
            {formatEuroFee(creditEur)} membership credit
          </CardTitle>
          <CardDescription className="mt-1.5 text-sm leading-relaxed text-emerald-100/80">
            {variant === "applied" ? (
              <>
                Already applied to your upcoming membership payment
                {reason ? ` (${reason})` : ""}. Transfer the reduced amount
                shown on your payment page.
              </>
            ) : (
              <>
                This will come off your upcoming membership payment
                {reason ? ` (${reason})` : ""}. You only need to pay the
                reduced amount after it is applied.
              </>
            )}
          </CardDescription>
          <Link
            href={withDashboardReturn("/membership")}
            className="mt-3 inline-flex text-sm font-medium text-emerald-200 underline-offset-2 hover:text-emerald-100 hover:underline"
          >
            View membership payments
          </Link>
        </div>
      </div>
    </Card>
  );
}
