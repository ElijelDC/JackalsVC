"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormMessage";
import { Input, Label } from "@/components/ui/Input";
import { apiPost } from "@/lib/client-api";

type RegisterStep = "vly" | "email" | "verify" | "password";

function StepHint({ step }: { step: RegisterStep }) {
  const labels: Record<RegisterStep, string> = {
    vly: "Step 1 of 4 · VLY number",
    email: "Step 2 of 4 · Email address",
    verify: "Step 3 of 4 · Confirm email",
    password: "Step 4 of 4 · Create password",
  };

  return (
    <p className="mb-4 text-xs font-medium uppercase tracking-wide text-zinc-500">
      {labels[step]}
    </p>
  );
}

function VerifiedBanner({
  memberName,
  vlyNumber,
  email,
}: {
  memberName: string;
  vlyNumber: string;
  email?: string;
}) {
  return (
    <div className="mb-4 flex items-start gap-3 rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-sm">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
      <div>
        <p className="font-medium text-green-300">
          {email ? "Email verified" : "VLY number verified"}
        </p>
        <p className="mt-1 text-zinc-300">
          {memberName} · {vlyNumber}
          {email ? ` · ${email}` : ""}
        </p>
      </div>
    </div>
  );
}

export function MemberRegisterWizard({
  callbackUrl,
  onSuccess,
  onSignIn,
}: {
  callbackUrl: string;
  onSuccess?: () => void;
  onSignIn: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState<RegisterStep>("vly");
  const [vlyNumber, setVlyNumber] = useState("");
  const [memberName, setMemberName] = useState("");
  const [registrationToken, setRegistrationToken] = useState("");
  const [email, setEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [codeMessage, setCodeMessage] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validateVly = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await apiPost(
      "/api/auth/validate-vly",
      { vlyNumber },
      "Could not verify VLY number",
    );

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    const payload = result.data as {
      vlyNumber: string;
      name: string;
      registrationToken: string;
    };

    setVlyNumber(payload.vlyNumber);
    setMemberName(payload.name);
    setRegistrationToken(payload.registrationToken);
    setStep("email");
  };

  const sendCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setCodeMessage(null);
    setDevCode(null);

    const result = await apiPost(
      "/api/auth/send-email-code",
      { email, vlyNumber, registrationToken },
      "Could not send verification code",
    );

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    const payload = result.data as {
      message?: string;
      devCode?: string;
      delivered?: boolean;
    };

    setCodeMessage(
      payload.message ?? "Verification code sent — check your email (and spam folder).",
    );
    setDevCode(payload.devCode ?? null);
    setEmailCode("");
    setStep("verify");
  };

  const verifyCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await apiPost(
      "/api/auth/verify-email-code",
      { email, vlyNumber, registrationToken, code: emailCode },
      "Could not verify code",
    );

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setCodeMessage(null);
    setStep("password");
  };

  const createAccount = async (event: React.FormEvent) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await apiPost(
      "/api/auth/register",
      {
        vlyNumber,
        registrationToken,
        email,
        emailCode,
        password,
        confirmPassword,
      },
      "Registration failed",
    );

    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    const signInResult = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (signInResult?.error) {
      setError("Account created but sign-in failed. Please sign in manually.");
      onSignIn();
      return;
    }

    onSuccess?.();
    router.push(callbackUrl);
    router.refresh();
  };

  if (step === "vly") {
    return (
      <>
        <StepHint step="vly" />
        <form onSubmit={validateVly} className="space-y-4">
          <div>
            <Label htmlFor="member-vly-number">VLY number</Label>
            <Input
              id="member-vly-number"
              value={vlyNumber}
              onChange={(event) => setVlyNumber(event.target.value.toUpperCase())}
              required
              placeholder="e.g. VLY123"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <FormError message={error} />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Checking..." : "Continue"}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs leading-relaxed text-zinc-500">
          Your VLY number must match the club roster maintained by the committee.
        </p>

        <p className="mt-5 text-center text-sm text-zinc-400">
          Already registered?{" "}
          <button
            type="button"
            onClick={onSignIn}
            className="font-medium text-jackals-red-light hover:text-jackals-red"
          >
            Sign in
          </button>
        </p>
      </>
    );
  }

  if (step === "email") {
    return (
      <>
        <StepHint step="email" />
        <VerifiedBanner memberName={memberName} vlyNumber={vlyNumber} />

        <form onSubmit={sendCode} className="space-y-4">
          <div>
            <Label htmlFor="member-register-email">Email address</Label>
            <Input
              id="member-register-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
            <p className="mt-1 text-xs text-zinc-500">
              We&apos;ll send a 6-digit code to confirm this email belongs to you.
            </p>
          </div>

          <FormError message={error} />

          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              className="gap-1.5"
              onClick={() => {
                setStep("vly");
                setError(null);
              }}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button type="submit" className="flex-1" disabled={loading || !email.trim()}>
              {loading ? "Sending..." : "Send verification code"}
            </Button>
          </div>
        </form>
      </>
    );
  }

  if (step === "verify") {
    return (
      <>
        <StepHint step="verify" />
        <VerifiedBanner memberName={memberName} vlyNumber={vlyNumber} />

        <form onSubmit={verifyCode} className="space-y-4">
          <div>
            <Label htmlFor="member-verify-email-display">Email</Label>
            <Input
              id="member-verify-email-display"
              type="email"
              value={email}
              readOnly
              className="text-zinc-400"
            />
          </div>

          <div>
            <Label htmlFor="member-register-email-code">Verification code</Label>
            <Input
              id="member-register-email-code"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={emailCode}
              onChange={(event) =>
                setEmailCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              required
              placeholder="Enter 6-digit code"
              autoComplete="one-time-code"
              className="tracking-[0.3em]"
            />
            {codeMessage && (
              <p className="mt-1 text-xs text-zinc-500">{codeMessage}</p>
            )}
            {devCode && (
              <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
                <p className="font-medium text-amber-200">Development mode</p>
                <p className="mt-1 text-zinc-300">
                  Email is not configured yet. Use this code to continue:
                </p>
                <p className="mt-2 font-mono text-2xl font-bold tracking-[0.35em] text-white">
                  {devCode}
                </p>
              </div>
            )}
          </div>

          <FormError message={error} />

          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              className="gap-1.5"
              onClick={() => {
                setStep("email");
                setError(null);
              }}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading || emailCode.length !== 6}
            >
              {loading ? "Checking..." : "Confirm email"}
            </Button>
          </div>

          <button
            type="button"
            onClick={() => {
              setStep("email");
              setError(null);
            }}
            className="w-full text-center text-sm text-zinc-400 hover:text-jackals-red-light"
          >
            Didn&apos;t get a code? Change email or resend
          </button>
        </form>
      </>
    );
  }

  return (
    <>
      <StepHint step="password" />
      <VerifiedBanner memberName={memberName} vlyNumber={vlyNumber} email={email} />

      <form onSubmit={createAccount} className="space-y-4">
        <div>
          <Label htmlFor="member-register-password">Create password</Label>
          <Input
            id="member-register-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
        <div>
          <Label htmlFor="member-register-confirm-password">Confirm password</Label>
          <Input
            id="member-register-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
          <p className="mt-1 text-xs text-zinc-500">At least 8 characters</p>
        </div>

        <FormError message={error} />

        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            className="gap-1.5"
            onClick={() => {
              setStep("verify");
              setError(null);
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </div>
      </form>
    </>
  );
}
