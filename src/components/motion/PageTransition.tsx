"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

function subscribe(onStoreChange: () => void) {
  if (typeof document === "undefined") return () => undefined;
  const onReady = () => onStoreChange();
  if (document.readyState === "complete") {
    queueMicrotask(onReady);
  } else {
    window.addEventListener("load", onReady, { once: true });
  }
  return () => window.removeEventListener("load", onReady);
}

function getSnapshot() {
  return typeof document !== "undefined" && document.readyState === "complete";
}

function getServerSnapshot() {
  return false;
}

/**
 * Page enter animation runs only after mount so styles are loaded first.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const ready = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return <div className={cn(ready && "motion-page-enter")}>{children}</div>;
}
