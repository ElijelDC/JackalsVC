"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { apiPatch, apiPost } from "@/lib/client-api";

export function ProfileEmailSection({ initialEmail }: { initialEmail: string }) {
  const router = useRouter();
  const { update } = useSession();
  const [email, setEmail] = useState(initialEmail);
  const [baselineEmail, setBaselineEmail] = useState(initialEmail);
  const [emailCode, setEmailCode] = useState("");
  const [isEditing, setIsEditing] = useState(!initialEmail.trim());
  const [codeSent, setCodeSent] = useState(false);
  const [codeMessage, setCodeMessage] = useState<string | null>(null);
  const [sendingCode, setSendingCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setEmail(initialEmail);
    setBaselineEmail(initialEmail);
    setIsEditing(!initialEmail.trim());
    setEmailCode("");
    setCodeSent(false);
    setCodeMessage(null);
    setNotice(null);
  }, [initialEmail]);

  const hasValue = baselineEmail.trim().length > 0;
  const normalizedEmail = email.trim().toLowerCase();
  const hasChanges = normalizedEmail !== baselineEmail.trim().toLowerCase();

  const resetVerification = () => {
    setEmailCode("");
    setCodeSent(false);
    setCodeMessage(null);
  };

  const cancelEdit = () => {
    setEmail(baselineEmail);
    setError(null);
    setSaved(false);
    resetVerification();
    setIsEditing(!hasValue);
  };

  const sendCode = async () => {
    if (!normalizedEmail) {
      setError("Enter an email address.");
      setNotice(null);
      return;
    }

    if (!hasChanges) {
      setNotice("This is your current email address.");
      setError(null);
      return;
    }

    setSendingCode(true);
    setError(null);
    setNotice(null);
    setCodeMessage(null);
    setSaved(false);

    const result = await apiPost<{ message?: string }>(
      "/api/profile/email/send-code",
      { email: normalizedEmail },
      "Could not send verification code.",
    );

    setSendingCode(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setCodeSent(true);
    setCodeMessage(
      result.data.message ??
        "Verification code sent — check your email (and spam folder).",
    );
    setEmailCode("");
  };

  const saveEmail = async () => {
    if (!hasChanges) {
      setNotice("This is your current email address.");
      setError(null);
      return;
    }

    if (emailCode.length !== 6) {
      setError("Enter the 6-digit code from your email.");
      setNotice(null);
      return;
    }

    setLoading(true);
    setError(null);
    setNotice(null);
    setSaved(false);

    const result = await apiPatch<{ email: string }>(
      "/api/profile/email",
      { email: normalizedEmail, emailCode },
      "Failed to update email.",
    );

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setEmail(result.data.email);
    setBaselineEmail(result.data.email);
    setSaved(true);
    setIsEditing(false);
    resetVerification();
    await update({ email: result.data.email });
    router.refresh();
  };

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        Email
      </p>

      {!isEditing && hasValue ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <p className="min-w-0 flex-1 text-base text-zinc-300">{baselineEmail}</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setIsEditing(true);
              setSaved(false);
              setError(null);
              resetVerification();
            }}
          >
            Edit
          </Button>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <input
            id="profile-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setSaved(false);
              setError(null);
              setNotice(null);
              resetVerification();
            }}
            className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-white placeholder:text-zinc-600 focus:border-jackals-red/40 focus:outline-none focus:ring-2 focus:ring-jackals-red/20"
          />

          {isEditing && hasValue && !hasChanges && (
            <p className="text-sm text-zinc-400">
              This is your current email address. Change it above to update.
            </p>
          )}

          {hasChanges && (
            <div className="space-y-3 rounded-lg border border-white/10 bg-black/10 p-4">
              <p className="text-sm text-zinc-400">
                We&apos;ll send a verification code to your new email address
                before saving the change.
              </p>

              {!codeSent ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void sendCode()}
                  disabled={sendingCode}
                >
                  {sendingCode ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Sending code
                    </>
                  ) : (
                    "Send verification code"
                  )}
                </Button>
              ) : (
                <div className="space-y-3">
                  {codeMessage && (
                    <p className="text-sm text-green-400">{codeMessage}</p>
                  )}
                  <div>
                    <label
                      htmlFor="profile-email-code"
                      className="text-xs font-medium uppercase tracking-wide text-zinc-500"
                    >
                      Verification code
                    </label>
                    <input
                      id="profile-email-code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={emailCode}
                      onChange={(event) => {
                        setEmailCode(
                          event.target.value.replace(/\D/g, "").slice(0, 6),
                        );
                        setSaved(false);
                        setError(null);
                      }}
                      placeholder="6-digit code"
                      className="mt-2 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-white placeholder:text-zinc-600 focus:border-jackals-red/40 focus:outline-none focus:ring-2 focus:ring-jackals-red/20 sm:max-w-xs"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => void saveEmail()}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                          Saving
                        </>
                      ) : (
                        "Verify and save email"
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void sendCode()}
                      disabled={sendingCode}
                    >
                      Resend code
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {hasValue && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={cancelEdit}
                disabled={loading || sendingCode}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}

      {saved && (
        <p className="mt-2 text-sm text-green-400">Email updated.</p>
      )}
      {notice && <p className="mt-2 text-sm text-zinc-400">{notice}</p>}
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      <p className="mt-2 text-xs text-zinc-500">
        Use the email you check for club updates and payment confirmations.
      </p>
    </div>
  );
}
