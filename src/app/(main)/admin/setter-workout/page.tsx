import Link from "next/link";

export const metadata = {
  title: "Admin · Setter preseason workout",
};

const WORKOUT_URL = "/agent/setter-preseason-workout-plan.html";

export default function AdminSetterWorkoutPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl space-y-1">
          <h1 className="text-2xl font-bold text-white">Setter preseason workout</h1>
          <p className="text-sm text-zinc-400">
            Private, noindex training app for setters. Progress and plan edits are stored in the
            athlete&apos;s browser (not on the server). Share the link only with people who should
            have access.
          </p>
        </div>
        <Link
          href={WORKOUT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-jackals-red px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-jackals-red/90"
        >
          Open full screen
        </Link>
      </div>
      <iframe
        src={WORKOUT_URL}
        title="Setter preseason workout plan"
        className="min-h-[min(72vh,900px)] w-full flex-1 rounded-xl border border-white/10 bg-[#202121]"
      />
    </div>
  );
}
