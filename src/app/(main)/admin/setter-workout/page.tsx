import Link from "next/link";

export const metadata = {
  title: "Admin · Setter season workout",
};

const SEASON_URL = "/agent/setter-season-workout-app.html";

export default function AdminSetterWorkoutPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl space-y-1">
          <h1 className="text-2xl font-bold text-white">Setter season workout (D2M 2026–27)</h1>
          <p className="text-sm text-zinc-400">
            Private in-season S&amp;C tracker. Static file under /agent — not loaded by the public
            site. Progress stays in the athlete&apos;s browser.
          </p>
        </div>
        <Link
          href={SEASON_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-jackals-red px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-jackals-red/90"
        >
          Open full screen
        </Link>
      </div>
    </div>
  );
}
