"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { AlertBanner } from "@/components/ui/FormMessage";
import { apiPost } from "@/lib/client-api";
import { formatPrice, parseJsonArray } from "@/lib/utils";

type Plan = {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMonths: number;
  features: string;
};

export function MembershipPlans({ plans }: { plans: Plan[] }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const subscribe = async (planId: string) => {
    if (!session) {
      router.push("/login?callbackUrl=/membership");
      return;
    }

    setLoading(planId);
    setMessage(null);

    const result = await apiPost("/api/membership", { planId });

    setLoading(null);

    if (!result.ok) {
      setMessage(result.error);
      return;
    }

    setMessage("Membership activated! Visit your dashboard to view details.");
    router.refresh();
  };

  return (
    <>
      <AlertBanner message={message} />

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan, index) => {
          const features = parseJsonArray(plan.features);
          const isPopular = index === 1;

          return (
            <Card
              key={plan.id}
              className={
                isPopular
                  ? "relative border-jackals-red/50 ring-1 ring-jackals-red/30"
                  : ""
              }
            >
              {isPopular && (
                <span className="absolute -top-3 left-1/2 -tranzinc-x-1/2 bg-jackals-red px-3 py-0.5 text-xs font-semibold text-white">
                  Most popular
                </span>
              )}
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription className="mt-2">{plan.description}</CardDescription>

              <div className="my-6">
                <span className="text-3xl font-bold text-white">
                  {formatPrice(plan.price)}
                </span>
                <span className="text-zinc-500">
                  /{plan.durationMonths} month{plan.durationMonths > 1 ? "s" : ""}
                </span>
              </div>

              <ul className="mb-6 space-y-2">
                {features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-zinc-300"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-jackals-red-light" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                variant={isPopular ? "primary" : "outline"}
                disabled={loading === plan.id}
                onClick={() => subscribe(plan.id)}
              >
                {loading === plan.id ? "Processing..." : "Choose plan"}
              </Button>
            </Card>
          );
        })}
      </div>
    </>
  );
}
