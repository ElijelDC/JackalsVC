"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/client-error-report";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError({
      message: error.message || "Application error",
      stack: error.stack,
      component: "global-error-boundary",
    });
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-[#202121] text-white antialiased">
        <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
          <h1 className="text-2xl font-bold">Jackals VC</h1>
          <p className="mt-4 text-sm leading-relaxed text-zinc-400">
            The site hit an unexpected error. Admins have been notified. Please
            refresh the page or try again shortly.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-8 border border-[#e8222a]/50 bg-[#e8222a]/20 px-5 py-2.5 text-sm font-medium text-white"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
