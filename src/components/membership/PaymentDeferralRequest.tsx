"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { AlertBanner } from "@/components/ui/FormMessage";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { apiPost } from "@/lib/client-api";

export function PaymentDeferralRequest({
  existingExcuse,
  existingDueDate,
  existingRequestedAt,
}: {
  existingExcuse: string | null;
  existingDueDate: string | null;
  existingRequestedAt: string | null;
}) {
  const router = useRouter();
  const [excuse, setExcuse] = useState(existingExcuse ?? "");
  const [dueDate, setDueDate] = useState(
    existingDueDate ? format(new Date(existingDueDate), "yyyy-MM-dd") : "",
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const result = await apiPost(
      "/api/membership/deferral",
      { excuse, dueDate },
      "Failed to send extension request",
    );

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setMessage("Extension request sent to admins.");
    router.refresh();
  };

  return (
    <Card className="border-amber-500/25 py-5">
      <h2 className="font-display text-lg font-semibold text-white">
        Can&apos;t pay yet?
      </h2>
      <p className="mt-2 text-sm text-zinc-400">
        Tell admins why you need more time and when you expect to pay. They can
        temporarily restore training and match access until that date.
      </p>

      {existingRequestedAt && existingDueDate && (
        <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-zinc-300">
          <p className="font-medium text-amber-200">Request on file</p>
          <p className="mt-1">
            Pay-by date requested:{" "}
            <span className="text-white">
              {format(new Date(existingDueDate), "d MMM yyyy")}
            </span>
          </p>
          <p className="mt-2 whitespace-pre-wrap text-zinc-400">{existingExcuse}</p>
          <p className="mt-2 text-xs text-zinc-500">
            Sent {format(new Date(existingRequestedAt), "d MMM yyyy 'at' HH:mm")}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <AlertBanner message={error} />
        {message && <p className="text-sm text-green-400">{message}</p>}

        <div>
          <Label htmlFor="deferral-due-date">When can you pay?</Label>
          <Input
            id="deferral-due-date"
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="deferral-excuse">Why do you need more time?</Label>
          <Textarea
            id="deferral-excuse"
            value={excuse}
            onChange={(event) => setExcuse(event.target.value)}
            rows={4}
            required
            placeholder="e.g. Waiting on payday next Friday — will transfer as soon as salary lands."
            className="mt-1"
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? "Sending..." : existingRequestedAt ? "Update request" : "Send request"}
        </Button>
      </form>
    </Card>
  );
}
