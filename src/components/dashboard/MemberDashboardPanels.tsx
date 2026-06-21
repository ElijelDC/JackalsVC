"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Calendar, CreditCard, MapPin } from "lucide-react";
import { IbanTransferDetails } from "@/components/payments/IbanTransferDetails";
import { PaymentProofUpload } from "@/components/payments/PaymentProofUpload";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AlertBanner } from "@/components/ui/FormMessage";
import { formatPaymentScheduleLabel, type PaymentSchedule } from "@/lib/membership-config";
import { apiDelete, apiPost } from "@/lib/client-api";
import { formatPrice } from "@/lib/utils";

type SignupEvent = {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  type: string;
  location: string | null;
};

type MemberEventsPanelProps = {
  upcomingEvents: SignupEvent[];
  signedUpEventIds: string[];
};

export function MemberEventsPanel({
  upcomingEvents,
  signedUpEventIds: initialSignedUpIds,
}: MemberEventsPanelProps) {
  const router = useRouter();
  const [signedUpIds, setSignedUpIds] = useState(new Set(initialSignedUpIds));
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const toggleSignup = async (eventId: string, isSignedUp: boolean) => {
    setLoadingId(eventId);
    setMessage(null);

    const result = isSignedUp
      ? await apiDelete(`/api/event-signups?eventId=${eventId}`, "Failed to cancel signup")
      : await apiPost("/api/event-signups", { eventId }, "Failed to sign up");

    setLoadingId(null);

    if (!result.ok) {
      setMessage(result.error);
      return;
    }

    setSignedUpIds((prev) => {
      const next = new Set(prev);
      if (isSignedUp) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
    router.refresh();
  };

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="font-display text-xl font-semibold text-white">
          Trainings &amp; games
        </h2>
        <Link
          href="/calendar"
          className="text-sm text-jackals-red-light hover:text-jackals-red"
        >
          Full calendar
        </Link>
      </div>

      <AlertBanner message={message} />

      {upcomingEvents.length === 0 ? (
        <Card className="py-8 text-center text-zinc-400">
          No upcoming events to sign up for right now. Check the{" "}
          <Link href="/training" className="text-jackals-red-light hover:text-jackals-red">
            training schedule
          </Link>{" "}
          for weekly sessions.
        </Card>
      ) : (
        <div className="space-y-3">
          {upcomingEvents.map((event) => {
            const isSignedUp = signedUpIds.has(event.id);
            const startDate = new Date(event.startDate);

            return (
              <Card key={event.id} className="py-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-white">{event.title}</p>
                      <Badge>{event.type}</Badge>
                      {isSignedUp && (
                        <Badge className="border-green-500/30 bg-green-500/10 text-green-400">
                          Signed up
                        </Badge>
                      )}
                    </div>
                    {event.description && (
                      <p className="mt-1 text-sm text-zinc-400">{event.description}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(startDate, "EEE, d MMM yyyy · HH:mm")}
                        {event.endDate &&
                          ` – ${format(new Date(event.endDate), "EEE, d MMM")}`}
                      </span>
                      {event.location && (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          {event.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant={isSignedUp ? "outline" : "primary"}
                    size="sm"
                    className="shrink-0"
                    disabled={loadingId === event.id}
                    onClick={() => toggleSignup(event.id, isSignedUp)}
                  >
                    {loadingId === event.id
                      ? "Saving..."
                      : isSignedUp
                        ? "Cancel signup"
                        : "Sign up"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}

type PaymentRecord = {
  id: string;
  amount: number;
  description: string;
  status: string;
  method: string;
  paymentReference: string;
  installmentNumber: number | null;
  dueDate: string | null;
  paidAt: string | null;
  proofScreenshotUrl: string | null;
  proofSubmittedAt: string | null;
  createdAt: string;
};

type MembershipRecord = {
  id: string;
  status: string;
  paymentSchedule: PaymentSchedule;
  startDate: string;
  endDate: string;
  plan: { name: string; price: number };
};

type ClubBankDetails = {
  accountHolder: string;
  iban: string;
  accountLabel: string;
};

type MemberPaymentsPanelProps = {
  memberships: MembershipRecord[];
  payments: PaymentRecord[];
  clubBank: ClubBankDetails;
};

function paymentStatusBadge(
  status: string,
  dueDate: string | null,
  proofSubmittedAt: string | null,
) {
  if (status === "COMPLETED") {
    return (
      <Badge className="border-green-500/30 bg-green-500/10 text-green-400">Paid</Badge>
    );
  }

  if (proofSubmittedAt) {
    return (
      <Badge className="border-blue-500/30 bg-blue-500/10 text-blue-300">Checking</Badge>
    );
  }

  if (dueDate && new Date(dueDate) < new Date()) {
    return (
      <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-400">Due</Badge>
    );
  }

  return (
    <Badge className="border-zinc-500/30 bg-zinc-500/10 text-zinc-300">Awaiting transfer</Badge>
  );
}

export function MemberPaymentsPanel({
  memberships,
  payments,
  clubBank,
}: MemberPaymentsPanelProps) {
  const currentMembership = memberships.find((m) => new Date(m.endDate) > new Date());
  const activeMembership =
    currentMembership?.status === "ACTIVE" ? currentMembership : undefined;
  const pendingMembership =
    currentMembership?.status === "PENDING_PAYMENT" ? currentMembership : undefined;

  const pendingPayments = payments.filter((payment) => payment.status === "PENDING");
  const nextPayment = pendingPayments[0];
  const completedTotal = payments
    .filter((payment) => payment.status === "COMPLETED")
    .reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="font-display text-xl font-semibold text-white">
          Membership &amp; payments
        </h2>
        {!currentMembership && (
          <Link
            href="/membership"
            className="text-sm text-jackals-red-light hover:text-jackals-red"
          >
            Choose schedule
          </Link>
        )}
        {currentMembership && (
          <Link
            href="/membership/payments"
            className="text-sm text-jackals-red-light hover:text-jackals-red"
          >
            Payment status
          </Link>
        )}
      </div>

      <Card className="mb-4 py-4">
        <div className="flex items-start gap-3">
          <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-jackals-red-light" />
          <div>
            <p className="font-medium text-white">Current membership</p>
            {currentMembership ? (
              <>
                <p className="mt-1 text-sm text-zinc-400">
                  {activeMembership ? (
                    <span className="text-green-400">Active</span>
                  ) : (
                    <span className="text-amber-400">Awaiting first payment</span>
                  )}{" "}
                  — {currentMembership.plan.name} ·{" "}
                  {formatPaymentScheduleLabel(currentMembership.paymentSchedule)} · expires{" "}
                  {format(new Date(currentMembership.endDate), "d MMM yyyy")}
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  Paid {formatPrice(completedTotal, "EUR")} so far · schedule locked
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-zinc-400">
                No membership yet.{" "}
                <Link href="/membership" className="text-jackals-red-light hover:text-jackals-red">
                  Choose your payment schedule
                </Link>{" "}
                — this choice is final for the season.
              </p>
            )}
          </div>
        </div>
      </Card>

      {nextPayment && (
        <Card className="mb-4 py-4">
          <p className="mb-3 font-medium text-white">Next payment</p>
          <IbanTransferDetails
            accountHolder={clubBank.accountHolder}
            iban={clubBank.iban}
            accountLabel={clubBank.accountLabel}
            paymentReference={nextPayment.paymentReference}
            amount={nextPayment.amount}
          />
          <p className="mt-3 text-xs text-zinc-500">
            After you transfer, upload a screenshot below to confirm payment and start the SumUp
            check.
          </p>
          <PaymentProofUpload
            paymentId={nextPayment.id}
            existingProofUrl={nextPayment.proofScreenshotUrl}
            proofSubmittedAt={nextPayment.proofSubmittedAt}
          />
        </Card>
      )}

      {payments.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            Payment schedule
          </h3>
          {payments.map((payment) => (
            <Card key={payment.id} className="py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-white">
                      {payment.installmentNumber
                        ? `Instalment ${payment.installmentNumber}`
                        : "Payment"}
                    </p>
                    {paymentStatusBadge(
                      payment.status,
                      payment.dueDate,
                      payment.proofSubmittedAt,
                    )}
                  </div>
                  <p className="mt-1 text-sm text-zinc-400">{payment.description}</p>
                  <p className="text-sm text-zinc-500">
                    {payment.status === "COMPLETED" && payment.paidAt
                      ? `Paid ${format(new Date(payment.paidAt), "d MMM yyyy")}`
                      : payment.dueDate
                        ? `Due ${format(new Date(payment.dueDate), "d MMM yyyy")}`
                        : format(new Date(payment.createdAt), "d MMM yyyy")}{" "}
                    · {payment.method.replace("_", " ")}
                  </p>
                  {payment.status === "PENDING" && (
                    <p className="mt-1 text-xs text-zinc-500">
                      Reference:{" "}
                      <code className="text-zinc-300">{payment.paymentReference}</code>
                    </p>
                  )}
                </div>
                <span className="font-semibold text-jackals-red-light">
                  {formatPrice(payment.amount, "EUR")}
                </span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="py-6 text-center text-sm text-zinc-400">
          No payments yet. Your season payment schedule will appear here after you confirm a plan.
        </Card>
      )}

      {pendingMembership && (
        <p className="mt-4 text-sm text-amber-400/90">
          Your membership activates once your first bank transfer is matched.
        </p>
      )}

      {pendingPayments.length > 1 && (
        <p className="mt-4 text-sm text-zinc-500">
          {pendingPayments.length} payments remaining on your locked schedule.
        </p>
      )}
    </section>
  );
}
