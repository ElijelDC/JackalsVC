"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { MemberSignInForm } from "@/components/auth/MemberSignInForm";
import { MemberRegisterWizard } from "@/components/auth/MemberRegisterWizard";

type AuthMode = "signin" | "register";

type AuthModalContextValue = {
  openAuth: (mode?: AuthMode, callbackUrl?: string) => void;
  closeAuth: () => void;
};

type ManualAuthState = {
  open: boolean;
  mode: AuthMode;
  callbackUrl: string;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error("useAuthModal must be used within AuthModalProvider");
  }
  return context;
}

function parseAuthMode(value: string | null): AuthMode | null {
  if (value === "signin" || value === "login") return "signin";
  if (value === "register") return "register";
  return null;
}

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [manual, setManual] = useState<ManualAuthState | null>(null);

  const authFromUrl = useMemo(() => {
    const authParam = parseAuthMode(searchParams.get("auth"));
    if (!authParam) return null;
    return {
      mode: authParam,
      callbackUrl: searchParams.get("callbackUrl") ?? "/dashboard",
    };
  }, [searchParams]);

  const open = manual?.open ?? authFromUrl !== null;
  const mode = manual?.mode ?? authFromUrl?.mode ?? "signin";
  const callbackUrl = manual?.callbackUrl ?? authFromUrl?.callbackUrl ?? "/dashboard";

  const closeAuth = useCallback(() => {
    setManual(null);

    const params = new URLSearchParams(searchParams.toString());
    if (params.has("auth") || params.has("callbackUrl")) {
      params.delete("auth");
      params.delete("callbackUrl");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }
  }, [pathname, router, searchParams]);

  const openAuth = useCallback((nextMode: AuthMode = "signin", nextCallbackUrl = "/dashboard") => {
    setManual({ open: true, mode: nextMode, callbackUrl: nextCallbackUrl });
  }, []);

  const setMode = useCallback(
    (nextMode: AuthMode) => {
      setManual((prev) => ({
        open: true,
        mode: nextMode,
        callbackUrl: prev?.callbackUrl ?? authFromUrl?.callbackUrl ?? "/dashboard",
      }));
    },
    [authFromUrl?.callbackUrl],
  );

  const value = useMemo(() => ({ openAuth, closeAuth }), [openAuth, closeAuth]);

  const title =
    mode === "signin"
      ? "Members only"
      : "Member register";
  const description =
    mode === "signin" ? (
      "Sign in with your email and password to access member areas."
    ) : (
      <>
        <p className="mt-3 font-display text-base font-bold uppercase leading-snug tracking-wide text-jackals-red">
          Only for Registered Members
        </p>
        <p className="mt-2 text-sm text-zinc-400">
          Verify your VLY number and upload your membership photo for approval.
        </p>
      </>
    );

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      <Modal open={open} onClose={closeAuth} title={title} description={description}>
        {mode === "signin" ? (
          <MemberSignInForm
            callbackUrl={callbackUrl}
            onSuccess={closeAuth}
            onRegister={() => setMode("register")}
          />
        ) : (
          <MemberRegisterWizard
            callbackUrl={callbackUrl}
            onSuccess={closeAuth}
            onSignIn={() => setMode("signin")}
          />
        )}
      </Modal>
    </AuthModalContext.Provider>
  );
}
