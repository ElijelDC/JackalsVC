"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthModal } from "@/components/providers/AuthModalProvider";

export function AuthRedirect({ mode }: { mode: "signin" | "register" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openAuth } = useAuthModal();

  useEffect(() => {
    const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
    openAuth(mode, callbackUrl);
    router.replace("/");
  }, [mode, openAuth, router, searchParams]);

  return null;
}
