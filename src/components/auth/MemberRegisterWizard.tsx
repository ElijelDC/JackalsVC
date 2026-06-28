"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock3, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormMessage";
import { Input, Label } from "@/components/ui/Input";
import { GALLERY_ACCEPTED_IMAGE_TYPES } from "@/lib/gallery-upload-config";
import { apiPost, apiPostForm } from "@/lib/client-api";
import {
  REGISTRATION_DECLINED_MESSAGE,
} from "@/lib/registration-review";
import {
  REGISTER_STEP_HINTS,
  type RegisterStep,
} from "@/lib/registration-wizard-copy";
import { sanitizeCallbackUrl } from "@/lib/safe-callback-url";

type VlyValidationPayload = {
  vlyNumber: string;
  name: string;
  registrationToken: string;
  vlyMembershipPhotoUrl: string | null;
  registrationReviewStatus: string | null;
  registrationPhotoSubmittedAt: string | null;
  registrationContactEmail: string | null;
};

function StepHint({ step }: { step: RegisterStep }) {
  return (
    <p className="mb-4 text-xs font-medium uppercase tracking-wide text-zinc-500">
      {REGISTER_STEP_HINTS[step]}
    </p>
  );
}

function VerifiedBanner({
  vlyNumber,
  email,
}: {
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
          {vlyNumber}
          {email ? ` · ${email}` : ""}
        </p>
      </div>
    </div>
  );
}

function RegistrationPendingPanel({
  photoUrl,
  submittedAt,
  email,
}: {
  photoUrl: string;
  submittedAt: string | null;
  email?: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-blue-500/35 bg-blue-500/10">
      <div className="border-b border-blue-500/20 bg-blue-500/10 px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/20">
            <Clock3 className="h-5 w-5 text-blue-300" />
          </div>
          <div>
            <p className="font-semibold text-blue-100">Screenshot submitted</p>
            <p className="mt-1 text-sm leading-relaxed text-blue-200/80">
              Waiting for admin approval.
              {email ? (
                <>
                  {" "}
                  We&apos;ll email you at <span className="font-medium text-blue-100">{email}</span>{" "}
                  once your photo has been reviewed.
                </>
              ) : (
                <> You&apos;ll receive an email once your photo has been reviewed.</>
              )}{" "}
              You can close this and come back later — enter your VLY number again to check your
              status.
            </p>
            {submittedAt && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-blue-300/70">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Submitted {new Date(submittedAt).toLocaleString("en-GB")}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="relative mx-auto h-52 w-40 overflow-hidden rounded-lg border border-white/10 bg-black/30">
          <Image
            src={photoUrl}
            alt="Submitted VLY membership photo"
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      </div>
    </div>
  );
}

export function MemberRegisterWizard({
  callbackUrl,
  onSuccess,
  onSignIn,
  onStepChange,
}: {
  callbackUrl: string;
  onSuccess?: () => void;
  onSignIn: () => void;
  onStepChange?: (step: RegisterStep) => void;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<RegisterStep>("vly");
  const [vlyNumber, setVlyNumber] = useState("");
  const [, setMemberName] = useState("");
  const [registrationToken, setRegistrationToken] = useState("");
  const [vlyPhotoUrl, setVlyPhotoUrl] = useState<string | null>(null);
  const [photoSubmittedAt, setPhotoSubmittedAt] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [emailLocked, setEmailLocked] = useState(false);
  const [allowEmailChange, setAllowEmailChange] = useState(false);
  const [autoSendingCode, setAutoSendingCode] = useState(false);
  const [emailCode, setEmailCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [codeMessage, setCodeMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const sessionRef = useRef({ vlyNumber: "", registrationToken: "" });

  useEffect(() => {
    onStepChange?.(step);
  }, [onStepChange, step]);

  useEffect(() => {
    if (autoSendingCode) {
      onStepChange?.("verify");
    }
  }, [autoSendingCode, onStepChange]);

  const sendVerificationCode = async (
    emailToUse: string,
    session: { vlyNumber: string; registrationToken: string },
    options?: { fromAuto?: boolean },
  ) => {
    const normalizedEmail = emailToUse.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Enter your email address to continue.");
      setAutoSendingCode(false);
      setStep("email");
      return;
    }

    setLoading(true);
    setError(null);
    setCodeMessage(null);

    const result = await apiPost(
      "/api/auth/send-email-code",
      {
        email: normalizedEmail,
        vlyNumber: session.vlyNumber,
        registrationToken: session.registrationToken,
      },
      "Could not send verification code",
    );

    setLoading(false);
    setAutoSendingCode(false);

    if (!result.ok) {
      setError(result.error);
      if (options?.fromAuto) {
        setStep("email");
      }
      return;
    }

    const payload = result.data as { message?: string };
    setEmail(normalizedEmail);
    setEmailLocked(true);
    setAllowEmailChange(false);
    setCodeMessage(
      payload.message ?? "Verification code sent — check your email (and spam folder).",
    );
    setEmailCode("");
    setStep("verify");
  };

  const applyVlyPayload = (payload: VlyValidationPayload) => {
    setVlyNumber(payload.vlyNumber);
    setMemberName(payload.name);
    setRegistrationToken(payload.registrationToken);
    sessionRef.current = {
      vlyNumber: payload.vlyNumber,
      registrationToken: payload.registrationToken,
    };
    setVlyPhotoUrl(payload.vlyMembershipPhotoUrl);
    setPhotoSubmittedAt(payload.registrationPhotoSubmittedAt);
    if (payload.registrationContactEmail) {
      setEmail(payload.registrationContactEmail);
      setEmailLocked(true);
      setAllowEmailChange(false);
    }

    if (payload.registrationReviewStatus === "APPROVED") {
      if (payload.registrationContactEmail) {
        setAutoSendingCode(true);
        void sendVerificationCode(
          payload.registrationContactEmail,
          {
            vlyNumber: payload.vlyNumber,
            registrationToken: payload.registrationToken,
          },
          { fromAuto: true },
        );
      } else {
        setEmailLocked(false);
        setStep("email");
      }
      return;
    }

    if (payload.registrationReviewStatus === "PENDING" && payload.vlyMembershipPhotoUrl) {
      setStep("pending");
      return;
    }

    if (payload.registrationReviewStatus === "DECLINED") {
      setError(REGISTRATION_DECLINED_MESSAGE);
    }

    setStep("photo");
  };

  const validateVly = async (event?: React.FormEvent) => {
    event?.preventDefault();
    setLoading(true);
    setError(null);

    const result = await apiPost<VlyValidationPayload>(
      "/api/auth/validate-vly",
      { vlyNumber },
      "Could not verify VLY number",
    );

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    applyVlyPayload(result.data);
  };

  const uploadPhoto = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email.trim()) {
      setError("Enter your email address so we can let you know once you're approved.");
      return;
    }

    if (!selectedFile) {
      setError("Choose a screenshot of your VLY membership card first.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("vlyNumber", vlyNumber);
    formData.append("registrationToken", registrationToken);
    formData.append("email", email.trim());

    const result = await apiPostForm<{
      vlyMembershipPhotoUrl: string;
      registrationPhotoSubmittedAt: string | null;
    }>("/api/auth/registration/vly-photo", formData, "VLY photo upload failed.");

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setVlyPhotoUrl(result.data.vlyMembershipPhotoUrl);
    setPhotoSubmittedAt(result.data.registrationPhotoSubmittedAt);
    setEmailLocked(true);
    setAllowEmailChange(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setStep("pending");
  };

  const sendCode = async (event: React.FormEvent) => {
    event.preventDefault();
    await sendVerificationCode(email, {
      vlyNumber,
      registrationToken,
    });
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
    router.push(sanitizeCallbackUrl(callbackUrl));
    router.refresh();
  };

  if (autoSendingCode) {
    return (
      <>
        <StepHint step="verify" />
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-jackals-red-light" aria-hidden />
          <p className="text-sm text-zinc-400">
            Sending a verification code to{" "}
            <span className="font-medium text-white">{email}</span>…
          </p>
          <p className="text-xs text-zinc-500">
            Using the same email you provided for photo approval.
          </p>
        </div>
      </>
    );
  }

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
          Use the VLY number listed on VLY Go. Your profile can be found{" "}
          <Link
            href="https://volleyballireland.justgo.com/Workbench.mvc/Show/5?t=profile"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-jackals-red underline underline-offset-2 hover:text-jackals-red-light bg-jackals-red/10 px-1.5 py-0.5 rounded"
          >
            here
          </Link>
          .
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

  if (step === "photo") {
    return (
      <>
        <StepHint step="photo" />
        <VerifiedBanner vlyNumber={vlyNumber} />

        <form onSubmit={uploadPhoto} className="space-y-4">
          <p className="text-sm text-zinc-400">
            Upload a clear screenshot or photo of your VLY membership card.
          </p>

          <div>
            <Label htmlFor="member-register-photo-email">Email address</Label>
            <Input
              id="member-register-photo-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
            <p className="mt-1 text-xs text-zinc-500">
              We&apos;ll email you when an admin approves your photo so you can finish signing up.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-white/20 bg-black/20 px-4 py-8 text-center transition-colors hover:border-jackals-red/40 hover:bg-jackals-red/5"
          >
            <Upload className="mb-2 h-8 w-8 text-zinc-500" />
            <span className="text-sm font-medium text-white">
              {selectedFile ? selectedFile.name : "Choose VLY membership photo"}
            </span>
            <span className="mt-1 text-xs text-zinc-500">
              JPEG, PNG, WebP, or GIF · max 5 MB
            </span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept={GALLERY_ACCEPTED_IMAGE_TYPES}
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setError(null);
              setSelectedFile(file);
              setPreviewUrl(file ? URL.createObjectURL(file) : null);
            }}
          />

          {previewUrl && (
            <div className="relative mx-auto h-52 w-40 overflow-hidden rounded-lg border border-white/10">
              <Image
                src={previewUrl}
                alt="VLY membership preview"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}

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
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Uploading
                </>
              ) : (
                "Submit for review"
              )}
            </Button>
          </div>
        </form>
      </>
    );
  }

  if (step === "pending") {
    return (
      <>
        <StepHint step="pending" />
        <VerifiedBanner vlyNumber={vlyNumber} />

        {vlyPhotoUrl && (
          <RegistrationPendingPanel
            photoUrl={vlyPhotoUrl}
            submittedAt={photoSubmittedAt}
            email={email || undefined}
          />
        )}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
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
          <Button
            type="button"
            variant="outline"
            className="gap-1.5"
            onClick={() => {
              setStep("photo");
              setSelectedFile(null);
              setPreviewUrl(null);
              setError(null);
            }}
          >
            Change screenshot
          </Button>
        </div>
      </>
    );
  }

  if (step === "email") {
    return (
      <>
        <StepHint step="email" />
        <VerifiedBanner vlyNumber={vlyNumber} />

        <form onSubmit={sendCode} className="space-y-4">
          {emailLocked && !allowEmailChange ? (
            <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Email
              </p>
              <p className="mt-1 text-sm text-white">{email}</p>
              <p className="mt-2 text-xs text-zinc-500">
                We&apos;ll use the same email you provided when submitting your VLY
                photo.
              </p>
            </div>
          ) : (
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
          )}

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

          {emailLocked && !allowEmailChange && (
            <button
              type="button"
              onClick={() => {
                setAllowEmailChange(true);
                setError(null);
              }}
              className="w-full text-center text-sm text-zinc-400 hover:text-jackals-red-light"
            >
              Use a different email
            </button>
          )}
        </form>
      </>
    );
  }

  if (step === "verify") {
    return (
      <>
        <StepHint step="verify" />
        <VerifiedBanner vlyNumber={vlyNumber} />

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
              if (emailLocked) {
                void sendVerificationCode(email, { vlyNumber, registrationToken });
                return;
              }
              setStep("email");
              setError(null);
            }}
            className="w-full text-center text-sm text-zinc-400 hover:text-jackals-red-light"
            disabled={loading}
          >
            {emailLocked
              ? "Didn't get a code? Resend"
              : "Didn't get a code? Change email or resend"}
          </button>
        </form>
      </>
    );
  }

  return (
    <>
      <StepHint step="password" />
      <VerifiedBanner vlyNumber={vlyNumber} email={email} />

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
