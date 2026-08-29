"use client";

import Image from "next/image";
import Link from "next/link";
import { Download, Printer } from "lucide-react";
import {
  formatMatchdayRoleLabel,
  type MatchdaySheetData,
  type MatchdaySheetEntry,
} from "@/lib/matchday-sheet-config";
import { formatMatchDateTime } from "@/lib/match-config";

function SheetEntryCard({ entry }: { entry: MatchdaySheetEntry }) {
  const { name, vlyNumber, vlyMembershipPhotoUrl } = entry;
  const roleLabel = formatMatchdayRoleLabel(entry);
  return (
    <article className="overflow-hidden rounded-lg border border-zinc-300 bg-white text-zinc-900">
      <div className="flex aspect-[3/4] items-center justify-center bg-zinc-100">
        {vlyMembershipPhotoUrl ? (
          <Image
            src={vlyMembershipPhotoUrl}
            alt={`${name} VLY membership photo`}
            width={180}
            height={240}
            className="h-full w-full object-cover"
            unoptimized
          />
        ) : (
          <span className="px-3 text-center text-xs text-zinc-500">No photo</span>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold">{name}</p>
        <p className="mt-1 font-mono text-xs text-red-700">
          {vlyNumber ?? "VLY pending"}
        </p>
        <p className="mt-1 text-xs text-zinc-600">{roleLabel}</p>
      </div>
    </article>
  );
}

function SheetSection({
  title,
  entries,
}: {
  title: string;
  entries: MatchdaySheetData["players"];
}) {
  if (entries.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-600">
        {title}
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 print:grid-cols-4">
        {entries.map((entry) => (
          <SheetEntryCard
            key={`${title}-${entry.vlyNumber ?? entry.name}`}
            entry={entry}
          />
        ))}
      </div>
    </section>
  );
}

export function MatchdaySheetView({
  data,
  downloadUrl,
  backHref,
}: {
  data: MatchdaySheetData;
  downloadUrl: string;
  backHref: string;
}) {
  const { dateLabel, timeLabel } = formatMatchDateTime(
    data.match.warmUpTime,
    data.match.matchStart,
  );

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <div className="border-b border-zinc-200 bg-zinc-50 px-6 py-4 print:hidden">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <Link
            href={backHref}
            className="text-sm text-zinc-600 hover:text-zinc-900"
          >
            Back to match
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={downloadUrl}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
            >
              <Download className="h-4 w-4" />
              Download sheet
            </a>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              <Printer className="h-4 w-4" />
              Print / save PDF
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-6 py-8 print:px-4 print:py-4">
        <header>
          <h1 className="text-2xl font-bold">{data.match.title}</h1>
          <p className="mt-1 text-zinc-700">{data.team.name}</p>
          <p className="mt-2 text-sm text-zinc-600">
            {dateLabel} · {timeLabel} · {data.match.location}
          </p>
          <p className="mt-3 text-sm text-zinc-500 print:hidden">
            Only players marked as attending and coaches who are not marked as
            can&apos;t attend are included.
          </p>
        </header>

        <SheetSection title="Players" entries={data.players} />
        <SheetSection title="Coaches" entries={data.coaches} />
      </main>
    </div>
  );
}
