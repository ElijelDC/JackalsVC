"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { apiPatch } from "@/lib/client-api";

export function ProfilePasswordSection() {
  const [isEditing, setIsEditing] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
    setSaved(false);
  };

  const cancelEdit = () => {
    resetForm();
    setIsEditing(false);
  };

  const savePassword = async () => {
    setError(null);
    setSaved(false);

    if (!currentPassword) {
      setError("Enter your current password.");
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
      setError("New password must be different from your current password.");
      return;
    }

    setLoading(true);

    const result = await apiPatch<{ success: boolean }>(
      "/api/profile/password",
      {
        currentPassword,
        newPassword,
        confirmPassword,
      },
      "Failed to update password.",
    );

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    resetForm();
    setSaved(true);
    setIsEditing(false);
  };

  return (
    <div className="border-t border-white/10 pt-5">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        Password
      </p>

      {!isEditing ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <p className="min-w-0 flex-1 font-mono text-base tracking-widest text-zinc-300">
            ••••••••
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              resetForm();
              setIsEditing(true);
            }}
          >
            Change password
          </Button>
        </div>
      ) : (
        <div className="mt-3 space-y-4">
          <div>
            <Label htmlFor="profile-current-password">Current password</Label>
            <Input
              id="profile-current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => {
                setCurrentPassword(event.target.value);
                setSaved(false);
                setError(null);
              }}
            />
          </div>

          <div>
            <Label htmlFor="profile-new-password">New password</Label>
            <Input
              id="profile-new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => {
                setNewPassword(event.target.value);
                setSaved(false);
                setError(null);
              }}
            />
          </div>

          <div>
            <Label htmlFor="profile-confirm-password">Confirm new password</Label>
            <Input
              id="profile-confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                setSaved(false);
                setError(null);
              }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => void savePassword()}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Saving
                </>
              ) : (
                "Save password"
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={cancelEdit}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {saved && (
        <p className="mt-2 text-sm text-green-400">Password updated.</p>
      )}
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      <p className="mt-2 text-xs text-zinc-500">
        Use at least 8 characters. You&apos;ll need your current password to save
        a new one.
      </p>
    </div>
  );
}
