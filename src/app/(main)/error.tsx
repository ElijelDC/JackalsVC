"use client";

import { useEffect } from "react";
import Link from "next/link";
import { reportClientError } from "@/lib/client-error-report";

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError({
      message: error.message || "Page failed to load",
      stack: error.stack,
      component: "main-error-boundary",
    });
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="font-display text-2xl font-bold text-white">
        Something went wrong
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">
        This page didn&apos;t load correctly. Our admins have been notified.
        Try again in a moment, or head back to the homepage.
      </p>
      {error.message && (
        <p className="mt-4 rounded border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-500">
          {error.message}
        </p>
      )}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="border border-jackals-red/50 bg-jackals-red/20 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-jackals-red/30"
        >
          Try again
        </button>
        <Link
          href="/"
          className="border border-white/15 px-5 py-2.5 text-sm text-zinc-300 transition-colors hover:border-white/30 hover:text-white"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
