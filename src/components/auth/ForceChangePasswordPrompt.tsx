"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { apiPatch } from "@/lib/client-api";

export function ForceChangePasswordPrompt() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const mustChange = Boolean(session?.user?.mustChangePassword);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!mustChange) return null;

  const savePassword = async () => {
    setError(null);

    if (!currentPassword) {
      setError("Enter your temporary password.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("New password must be different from your temporary password.");
      return;
    }

    setLoading(true);

    const result = await apiPatch<{
      success: boolean;
      mustChangePassword: boolean;
    }>("/api/profile/password", {
      currentPassword,
      newPassword,
      confirmPassword,
    }, "Failed to update password.");

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    await update({ mustChangePassword: false });
    router.refresh();
  };

  return (
    <Modal
      open
      onClose={() => undefined}
      closeOnBackdrop={false}
      closeOnEscape={false}
      showCloseButton={false}
      title="Change your password"
      description={
        <p className="text-sm leading-relaxed text-zinc-400">
          For security, replace the temporary password the club sent you before
          continuing. You&apos;ll use this new password for future sign-ins.
        </p>
      }
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="force-current-password">Temporary password</Label>
          <Input
            id="force-current-password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => {
              setCurrentPassword(event.target.value);
              setError(null);
            }}
          />
        </div>

        <div>
          <Label htmlFor="force-new-password">New password</Label>
          <Input
            id="force-new-password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => {
              setNewPassword(event.target.value);
              setError(null);
            }}
          />
        </div>

        <div>
          <Label htmlFor="force-confirm-password">Confirm new password</Label>
          <Input
            id="force-confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              setError(null);
            }}
          />
        </div>

        <Button
          type="button"
          className="w-full"
          onClick={() => void savePassword()}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Saving
            </>
          ) : (
            "Save new password"
          )}
        </Button>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <p className="text-xs text-zinc-500">
          Use at least 8 characters. You can update this again later under
          Profile.
        </p>
      </div>
    </Modal>
  );
}
