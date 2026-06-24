"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormMessage";
import { Input, Label } from "@/components/ui/Input";
import { MemberForgotPasswordForm } from "@/components/auth/MemberForgotPasswordForm";

export function MemberSignInForm({
  callbackUrl,
  onSuccess,
  onRegister,
}: {
  callbackUrl: string;
  onSuccess?: () => void;
  onRegister: () => void;
}) {
  const router = useRouter();
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetNotice, setResetNotice] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (showForgotPassword) {
    return (
      <MemberForgotPasswordForm
        initialEmail={email}
        onBackToSignIn={() => setShowForgotPassword(false)}
        onSuccess={(message) => {
          setResetNotice(message);
          setShowForgotPassword(false);
          setError(null);
        }}
      />
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
      return;
    }

    onSuccess?.();
    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="member-signin-email">Email</Label>
          <Input
            id="member-signin-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <Label htmlFor="member-signin-password" className="mb-0">
              Password
            </Label>
            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(true);
                setError(null);
                setResetNotice(null);
              }}
              className="text-xs font-medium text-jackals-red-light hover:text-jackals-red"
            >
              Forgot password?
            </button>
          </div>
          <Input
            id="member-signin-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        <FormError message={error} />
        {resetNotice && (
          <p className="text-sm text-green-400">{resetNotice}</p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-zinc-400">
        Don&apos;t have an account yet?{" "}
        <button
          type="button"
          onClick={onRegister}
          className="font-medium text-jackals-red-light hover:text-jackals-red"
        >
          Member register
        </button>
      </p>
    </>
  );
}
