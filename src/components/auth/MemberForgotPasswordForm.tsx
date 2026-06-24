"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormMessage";
import { Input, Label } from "@/components/ui/Input";
import { apiPost } from "@/lib/client-api";

type ForgotStep = "email" | "reset";

export function MemberForgotPasswordForm({
  initialEmail = "",
  onBackToSignIn,
  onSuccess,
}: {
  initialEmail?: string;
  onBackToSignIn: () => void;
  onSuccess?: (message: string) => void;
}) {
  const [step, setStep] = useState<ForgotStep>("email");
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sendingCode, setSendingCode] = useState(false);
  const [resetting, setResetting] = useState(false);

  const normalizedEmail = email.trim().toLowerCase();

  const sendCode = async () => {
    if (!normalizedEmail) {
      setError("Enter the email address on your account.");
      setMessage(null);
      return;
    }

    setSendingCode(true);
    setError(null);
    setMessage(null);

    const result = await apiPost<{ message?: string }>(
      "/api/auth/forgot-password/send-code",
      { email: normalizedEmail },
      "Could not send reset code.",
    );

    setSendingCode(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setMessage(
      result.data.message ??
        "If an account exists for that email, we sent a reset code.",
    );
    setStep("reset");
    setCode("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const resetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (code.length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setResetting(true);

    const result = await apiPost<{ message?: string }>(
      "/api/auth/forgot-password/reset",
      {
        email: normalizedEmail,
        code,
        newPassword,
        confirmPassword,
      },
      "Could not reset password.",
    );

    setResetting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setMessage(
      result.data.message ?? "Password updated. You can sign in with your new password.",
    );
    onSuccess?.(
      result.data.message ?? "Password updated. You can sign in with your new password.",
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-400">
        {step === "email"
          ? "Enter your account email and we\u2019ll send a 6-digit reset code."
          : "Enter the code from your email, then choose a new password."}
      </p>

      {step === "email" ? (
        <>
          <div>
            <Label htmlFor="forgot-password-email">Email</Label>
            <Input
              id="forgot-password-email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError(null);
                setMessage(null);
              }}
              required
              autoComplete="email"
            />
          </div>

          <FormError message={error} />
          {message && <p className="text-sm text-green-400">{message}</p>}

          <Button
            type="button"
            className="w-full"
            disabled={sendingCode}
            onClick={() => void sendCode()}
          >
            {sendingCode ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Sending code
              </>
            ) : (
              "Send reset code"
            )}
          </Button>
        </>
      ) : (
        <form onSubmit={resetPassword} className="space-y-4">
          <div>
            <Label htmlFor="forgot-password-email-readonly">Email</Label>
            <Input
              id="forgot-password-email-readonly"
              type="email"
              value={email}
              readOnly
              className="text-zinc-400"
            />
          </div>

          <div>
            <Label htmlFor="forgot-password-code">Reset code</Label>
            <Input
              id="forgot-password-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(event) => {
                setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                setError(null);
              }}
              placeholder="6-digit code"
              required
            />
          </div>

          <div>
            <Label htmlFor="forgot-password-new">New password</Label>
            <Input
              id="forgot-password-new"
              type="password"
              value={newPassword}
              onChange={(event) => {
                setNewPassword(event.target.value);
                setError(null);
              }}
              autoComplete="new-password"
              required
              minLength={8}
            />
          </div>

          <div>
            <Label htmlFor="forgot-password-confirm">Confirm new password</Label>
            <Input
              id="forgot-password-confirm"
              type="password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                setError(null);
              }}
              autoComplete="new-password"
              required
              minLength={8}
            />
          </div>

          <FormError message={error} />
          {message && <p className="text-sm text-green-400">{message}</p>}

          <Button type="submit" className="w-full" disabled={resetting}>
            {resetting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Updating password
              </>
            ) : (
              "Reset password"
            )}
          </Button>

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <button
              type="button"
              onClick={() => void sendCode()}
              disabled={sendingCode}
              className="font-medium text-jackals-red-light hover:text-jackals-red disabled:opacity-50"
            >
              Resend code
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setError(null);
                setMessage(null);
              }}
              className="text-zinc-400 hover:text-white"
            >
              Change email
            </button>
          </div>
        </form>
      )}

      <p className="text-center text-sm text-zinc-400">
        <button
          type="button"
          onClick={onBackToSignIn}
          className="font-medium text-jackals-red-light hover:text-jackals-red"
        >
          Back to sign in
        </button>
      </p>
    </div>
  );
}
