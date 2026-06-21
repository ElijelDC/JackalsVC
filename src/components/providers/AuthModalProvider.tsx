"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { MemberSignInForm } from "@/components/auth/MemberSignInForm";
import { MemberRegisterWizard } from "@/components/auth/MemberRegisterWizard";

type AuthMode = "signin" | "register";

type AuthModalContextValue = {
  openAuth: (mode?: AuthMode, callbackUrl?: string) => void;
  closeAuth: () => void;
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
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("signin");
  const [callbackUrl, setCallbackUrl] = useState("/dashboard");

  const closeAuth = useCallback(() => {
    setOpen(false);

    const params = new URLSearchParams(searchParams.toString());
    if (params.has("auth") || params.has("callbackUrl")) {
      params.delete("auth");
      params.delete("callbackUrl");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }
  }, [pathname, router, searchParams]);

  const openAuth = useCallback((nextMode: AuthMode = "signin", nextCallbackUrl = "/dashboard") => {
    setMode(nextMode);
    setCallbackUrl(nextCallbackUrl);
    setOpen(true);
  }, []);

  useEffect(() => {
    const authParam = parseAuthMode(searchParams.get("auth"));
    if (!authParam) return;

    setMode(authParam);
    setCallbackUrl(searchParams.get("callbackUrl") ?? "/dashboard");
    setOpen(true);
  }, [searchParams]);

  const value = useMemo(() => ({ openAuth, closeAuth }), [openAuth, closeAuth]);

  const title =
    mode === "signin"
      ? "Members only"
      : "Member register";
  const description =
    mode === "signin"
      ? "Sign in with your email and password to access member areas."
      : "Verify your VLY number and email, then create your password.";

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
