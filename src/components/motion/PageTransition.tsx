"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Page enter animation runs only after mount so styles are loaded first.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <div className={cn(ready && "motion-page-enter")}>{children}</div>
  );
}
