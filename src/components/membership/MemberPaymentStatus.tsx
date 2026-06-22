"use client";

import { format } from "date-fns";
import { CheckCircle2, Clock3, CreditCard } from "lucide-react";
import { PaymentProofUpload } from "@/components/payments/PaymentProofUpload";
import { IbanTransferDetails } from "@/components/payments/IbanTransferDetails";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { StaggerIn } from "@/components/motion/StaggerIn";
import type { PaymentSchedule } from "@/lib/membership-config";
import type { MembershipPaymentAccess } from "@/lib/membership-overdue";
import { PAYMENT_OVERDUE_GRACE_DAYS } from "@/lib/membership-overdue";
import { formatPrice } from "@/lib/utils";

type PaymentItem = {
  id: string;
  amount: number;
  description: string;
  status: string;
  paymentReference: string;
  installmentNumber: number | null;
  dueDate: string | null;
  paidAt: string | null;
  proofScreenshotUrl: string | null;
  proofSubmittedAt: string | null;
};

type MembershipInfo = {
  status: string;
  paymentSchedule: PaymentSchedule;
  planName: string;
  endDate: string;
  scheduleLabel: string;
  paymentOverdueOverride?: boolean;
};

type ClubBank = {
  accountHolder: string;
  iban: string;
  accountLabel: string;
};

function statusBadge(
  status: string,
  dueDate: string | null,
  proofSubmittedAt: string | null,
  isOverdueInstallment = false,
) {
  if (status === "COMPLETED") {
    return (
      <Badge className="border-green-500/30 bg-green-500/10 text-green-400">Paid</Badge>
    );
  }

  if (proofSubmittedAt) {
    return (
      <Badge className="border-blue-500/30 bg-blue-500/10 text-blue-300">
        Awaiting verification
      </Badge>
    );
  }

  if (isOverdueInstallment) {
    return <Badge className="border-red-500/30 bg-red-500/10 text-red-400">Overdue</Badge>;
  }

  if (dueDate && new Date(dueDate) < new Date()) {
    return <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-400">Due now</Badge>;
  }

  return (
    <Badge className="border-zinc-500/30 bg-zinc-500/10 text-zinc-300">Awaiting payment</Badge>
  );
}

export function MemberPaymentStatus({
  memberName,
  membership,
  payments,
  clubBank,
  paymentAccess = null,
}: {
  memberName: string;
  membership: MembershipInfo;
  payments: PaymentItem[];
  clubBank: ClubBank;
  paymentAccess?: MembershipPaymentAccess | null;
}) {
  const nextPayment = payments.find((payment) => payment.status === "PENDING");
  const paidCount = payments.filter((payment) => payment.status === "COMPLETED").length;
  const isActive = membership.status === "ACTIVE";
  const overdueInstallmentNumber = paymentAccess?.overduePayment?.installmentNumber ?? null;

  return (
    <StaggerIn className="mx-auto max-w-2xl space-y-6" stagger={90}>
      <Card className="py-5">
        <div className="flex items-start gap-3">
          {paymentAccess?.isOverdue ? (
            <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
          ) : isActive ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-400" />
          ) : (
            <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          )}
          <div>
            <p className="font-medium text-white">
              {paymentAccess?.isOverdue
                ? "Membership overdue"
                : isActive
                  ? "Membership active"
                  : "Awaiting your first payment"}
              {paymentAccess?.hasOverride && (
                <Badge className="ml-2 border-blue-500/30 bg-blue-500/10 text-blue-300">
                  Admin override
                </Badge>
              )}
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              {membership.planName} · {membership.scheduleLabel} · ends{" "}
              {format(new Date(membership.endDate), "d MMM yyyy")}
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              {paidCount} of {payments.length} payment{payments.length !== 1 ? "s" : ""} completed
            </p>
            {paymentAccess?.isOverdue && (
              <p className="mt-2 text-sm text-red-300/90">
                Training and match sign-ups are paused until this payment is received.
              </p>
            )}
            {paymentAccess?.isPastDue &&
              !paymentAccess.isOverdue &&
              paymentAccess.graceDaysRemaining !== null && (
                <p className="mt-2 text-sm text-amber-300/90">
                  Pay within {paymentAccess.graceDaysRemaining} day
                  {paymentAccess.graceDaysRemaining === 1 ? "" : "s"} to keep training and match
                  access ({PAYMENT_OVERDUE_GRACE_DAYS}-day grace after due date).
                </p>
              )}
          </div>
        </div>
      </Card>

      {nextPayment ? (
        <Card className="border-jackals-red/30 py-5">
          <div className="mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-jackals-red-light" />
            <h2 className="font-display text-lg font-semibold text-white">Pay now</h2>
          </div>

          <IbanTransferDetails
            accountHolder={clubBank.accountHolder}
            iban={clubBank.iban}
            accountLabel={clubBank.accountLabel}
            paymentReference={nextPayment.paymentReference}
            amount={nextPayment.amount}
          />

          <p className="mt-4 text-sm text-zinc-400">
            Use your name exactly as registered:{" "}
            <span className="font-medium text-white">{memberName}</span>
          </p>

          <PaymentProofUpload
            paymentId={nextPayment.id}
            existingProofUrl={nextPayment.proofScreenshotUrl}
            proofSubmittedAt={nextPayment.proofSubmittedAt}
          />
        </Card>
      ) : (
        <Card className="py-8 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-green-400" />
          <p className="mt-3 font-medium text-white">All payments complete</p>
          <p className="mt-1 text-sm text-zinc-400">You&apos;re fully paid up.</p>
        </Card>
      )}

      <div>
        <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
          Full schedule
        </h3>
        <StaggerIn className="space-y-3" stagger={60}>
          {payments.map((payment) => (
            <Card key={payment.id} className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-white">
                      Instalment {payment.installmentNumber ?? "—"}
                    </p>
                    {statusBadge(
                      payment.status,
                      payment.dueDate,
                      payment.proofSubmittedAt,
                      paymentAccess?.isOverdue &&
                        payment.installmentNumber === overdueInstallmentNumber,
                    )}
                  </div>
                  <p className="mt-1 text-sm text-zinc-400">{payment.description}</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {payment.status === "COMPLETED" && payment.paidAt
                      ? `Paid ${format(new Date(payment.paidAt), "d MMM yyyy")}`
                      : payment.dueDate
                        ? `Due ${format(new Date(payment.dueDate), "d MMM yyyy")}`
                        : "—"}
                  </p>
                  {payment.status === "PENDING" && (
                    <p className="mt-2 text-xs text-zinc-500">
                      Reference:{" "}
                      <code className="text-zinc-300">{payment.paymentReference}</code>
                    </p>
                  )}
                </div>
                <span className="shrink-0 font-semibold text-jackals-red-light">
                  {formatPrice(payment.amount, "EUR")}
                </span>
              </div>
            </Card>
          ))}
        </StaggerIn>
      </div>

      {!isActive && nextPayment && (
        <p className="text-center text-sm text-amber-400/90">
          Your membership activates once we receive your first bank transfer.
        </p>
      )}
    </StaggerIn>
  );
}
