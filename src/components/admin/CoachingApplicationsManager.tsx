"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Loader2,
  Mail,
  Phone,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormMessage";
import {
  COACHING_APPLICATION_STATUS_LABELS,
  type CoachingApplicationRecord,
} from "@/lib/coaching-application-config";
import {
  coachingCommuteLabel,
  coachingQualificationLabel,
} from "@/lib/coaching-recruitment-config";
import { apiGet, apiPatch } from "@/lib/client-api";
import { cn } from "@/lib/utils";

type ViewMode = "pending" | "all";

function formatSubmittedAt(value: string) {
  return new Date(value).toLocaleString("en-IE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function ApplicationDetails({ application }: { application: CoachingApplicationRecord }) {
  return (
    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
      <div>
        <dt className="text-zinc-500">Age</dt>
        <dd className="text-white">{application.age}</dd>
      </div>
      <div>
        <dt className="text-zinc-500">Experience</dt>
        <dd className="text-white">{application.yearsExperience} years</dd>
      </div>
      <div>
        <dt className="text-zinc-500">VLY Ireland coach level</dt>
        <dd className="text-white">
          {coachingQualificationLabel(application.qualificationLevel)}
        </dd>
      </div>
      <div>
        <dt className="text-zinc-500">Commute to both venues</dt>
        <dd className="text-white">
          {coachingCommuteLabel(application.canCommuteToBothVenues)}
        </dd>
      </div>
      <div className="sm:col-span-2">
        <dt className="text-zinc-500">Why interested</dt>
        <dd className="mt-1 whitespace-pre-wrap text-white">
          {application.whyInterested}
        </dd>
      </div>
    </dl>
  );
}

export function CoachingApplicationsManager({
  initialApplications,
  initialView = "pending",
}: {
  initialApplications: CoachingApplicationRecord[];
  initialView?: ViewMode;
}) {
  const router = useRouter();
  const [applications, setApplications] = useState(initialApplications);
  const [view, setView] = useState<ViewMode>(initialView);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pendingCount = applications.filter((item) => item.status === "NEW").length;

  const refresh = async (nextView: ViewMode = view) => {
    setRefreshing(true);
    setError(null);

    const query = nextView === "pending" ? "?status=NEW" : "";
    const result = await apiGet<{ applications: CoachingApplicationRecord[] }>(
      `/api/admin/coaching-applications${query}`,
      "refresh the coaching applications list",
    );

    setRefreshing(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setApplications(result.data.applications);
  };

  const changeView = async (nextView: ViewMode) => {
    setView(nextView);
    await refresh(nextView);
  };

  const act = async (id: string, action: "review" | "dismiss") => {
    setLoadingId(id);
    setError(null);

    const result = await apiPatch<{ application: CoachingApplicationRecord }>(
      `/api/admin/coaching-applications/${id}`,
      { action },
      action === "review" ? "mark this application as reviewed" : "dismiss this application",
    );

    setLoadingId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    if (view === "pending") {
      setApplications((current) => current.filter((item) => item.id !== id));
    } else {
      setApplications((current) =>
        current.map((item) =>
          item.id === id ? result.data.application : item,
        ),
      );
    }

    router.refresh();
  };

  const emptyPending = view === "pending" && applications.length === 0;
  const emptyAll = view === "all" && applications.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={view === "pending" ? "primary" : "outline"}
            onClick={() => void changeView("pending")}
          >
            Pending
            {pendingCount > 0 && view === "pending" ? ` (${pendingCount})` : ""}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={view === "all" ? "primary" : "outline"}
            onClick={() => void changeView("all")}
          >
            All applications
          </Button>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={refreshing}
          onClick={() => void refresh()}
        >
          {refreshing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Refreshing
            </>
          ) : (
            "Refresh"
          )}
        </Button>
      </div>

      <FormError message={error} />

      {emptyPending ? (
        <div className="rounded-xl border border-white/10 bg-white/3 p-8 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-green-400/80" />
          <p className="mt-4 font-display text-lg font-semibold text-white">
            No pending coaching applications
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            New applications from the Coach With Us page will appear here.
          </p>
        </div>
      ) : emptyAll ? (
        <div className="rounded-xl border border-white/10 bg-white/3 p-8 text-center">
          <p className="font-display text-lg font-semibold text-white">
            No coaching applications yet
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            Submissions from the public coaching form will be listed here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => {
            const isPending = application.status === "NEW";
            const isLoading = loadingId === application.id;

            return (
              <article
                key={application.id}
                className="overflow-hidden rounded-xl border border-white/10 bg-white/3"
              >
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display text-lg font-semibold text-white">
                          {application.fullName}
                        </h2>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-xs font-medium",
                            application.status === "NEW" &&
                              "bg-amber-500/15 text-amber-300",
                            application.status === "REVIEWED" &&
                              "bg-green-500/15 text-green-300",
                            application.status === "DISMISSED" &&
                              "bg-zinc-500/15 text-zinc-300",
                          )}
                        >
                          {COACHING_APPLICATION_STATUS_LABELS[application.status]}
                        </span>
                      </div>

                      <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-400">
                        <Clock3 className="h-3.5 w-3.5 shrink-0" />
                        Submitted {formatSubmittedAt(application.createdAt)}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-3 text-sm">
                        <a
                          href={`mailto:${application.contactEmail}`}
                          className="inline-flex items-center gap-1.5 text-jackals-gold hover:underline"
                        >
                          <Mail className="h-4 w-4" />
                          {application.contactEmail}
                        </a>
                        <a
                          href={`tel:${application.contactNumber}`}
                          className="inline-flex items-center gap-1.5 text-zinc-300 hover:text-white"
                        >
                          <Phone className="h-4 w-4" />
                          {application.contactNumber}
                        </a>
                      </div>

                      <ApplicationDetails application={application} />
                    </div>

                    {isPending ? (
                      <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
                        <Button
                          type="button"
                          size="sm"
                          disabled={isLoading}
                          onClick={() => void act(application.id, "review")}
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Mark reviewed
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isLoading}
                          onClick={() => void act(application.id, "dismiss")}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Dismiss
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
