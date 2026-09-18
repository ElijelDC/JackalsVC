"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { MEMBERSHIP_FIRST_PAYMENT_DUE_LABEL } from "@/lib/membership-config";

const STORAGE_KEY = "jackals-membership-due-2026-dismissed-at";
/** Reminder can show again after this gap — not every visit. */
const COOLDOWN_MS = 4 * 24 * 60 * 60 * 1000;
const SHOW_DELAY_MS = 2800;

function wasDismissedRecently() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const dismissedAt = Number(raw);
    if (!Number.isFinite(dismissedAt)) return false;
    return Date.now() - dismissedAt < COOLDOWN_MS;
  } catch {
    return true;
  }
}

function markDismissed() {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    // ignore quota / private mode
  }
}

export function MembershipDueReminderPrompt() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isPaygPlayer = Boolean(session?.user?.isPaygPlayer);
  const mustChangePassword = Boolean(session?.user?.mustChangePassword);
  const isCoach = Boolean(session?.user?.isCoach);
  const isAdmin = session?.user?.role === "ADMIN";
  const onMembershipPage = pathname.startsWith("/membership");

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!isPaygPlayer || mustChangePassword || isCoach || isAdmin) return;
    if (onMembershipPage) return;
    if (wasDismissedRecently()) return;

    const timer = window.setTimeout(() => setOpen(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [
    status,
    isPaygPlayer,
    mustChangePassword,
    isCoach,
    isAdmin,
    onMembershipPage,
  ]);

  const dismiss = () => {
    markDismissed();
    setOpen(false);
  };

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={dismiss}
      title="Membership due soon"
      description={`Season membership is due ${MEMBERSHIP_FIRST_PAYMENT_DUE_LABEL}.`}
    >
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-zinc-300">
          Season membership payments are due{" "}
          <span className="font-medium text-white">
            {MEMBERSHIP_FIRST_PAYMENT_DUE_LABEL}
          </span>
          . Until you set up membership, you can keep attending training
          pay-per-session.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={dismiss}>
            Remind me later
          </Button>
          <Link
            href="/membership"
            onClick={dismiss}
            className="inline-flex items-center justify-center gap-2 bg-jackals-red px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-jackals-red-hover clip-slash"
          >
            View membership
          </Link>
        </div>
      </div>
    </Modal>
  );
}
