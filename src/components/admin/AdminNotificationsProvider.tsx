"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiGet } from "@/lib/client-api";
import type {
  AdminActionQueue,
  AdminActionQueueEntry,
} from "@/lib/admin-action-queue-types";

type AdminNotificationsContextValue = AdminActionQueue & {
  refresh: () => Promise<void>;
  adjustBadge: (href: string, delta: number) => void;
};

const AdminNotificationsContext =
  createContext<AdminNotificationsContextValue | null>(null);

const HREF_TO_ENTRY_KIND: Record<string, AdminActionQueueEntry["kind"]> = {
  "/admin/registration-reviews": "registration",
  "/admin/payments": "payment",
  "/admin/kit-orders": "kit-payment",
  "/admin/merchandise-orders": "merchandise-payment",
  "/admin/coach-payments": "coach-payment",
  "/admin/coaching-applications": "coaching-application",
  "/admin/trials-applications": "trials-application",
  "/admin/one-off-sessions": "trial-session-signup",
};

function applyBadgeDelta(queue: AdminActionQueue, href: string, delta: number) {
  const previous = queue.badgeCounts[href] ?? 0;
  const next = Math.max(0, previous + delta);
  if (next === previous) return queue;

  const badgeCounts = { ...queue.badgeCounts };
  if (next === 0) delete badgeCounts[href];
  else badgeCounts[href] = next;

  const kind = HREF_TO_ENTRY_KIND[href];
  let entries = queue.entries;
  if (kind) {
    entries = queue.entries
      .map((entry) =>
        entry.href === href
          ? {
              ...entry,
              count: next,
              previews: next === 0 ? [] : entry.previews,
            }
          : entry,
      )
      .filter((entry) => entry.count > 0);
  }

  return {
    ...queue,
    badgeCounts,
    entries,
    totalCount: Math.max(0, queue.totalCount + delta),
  };
}

export function AdminNotificationsProvider({
  initial,
  children,
}: {
  initial: AdminActionQueue;
  children: ReactNode;
}) {
  const [queue, setQueue] = useState(initial);

  const refresh = useCallback(async () => {
    const result = await apiGet<AdminActionQueue>(
      "/api/admin/action-queue",
      "refresh admin notifications",
    );
    if (result.ok) setQueue(result.data);
  }, []);

  const adjustBadge = useCallback((href: string, delta: number) => {
    setQueue((current) => applyBadgeDelta(current, href, delta));
  }, []);

  const value = useMemo(
    () => ({ ...queue, refresh, adjustBadge }),
    [queue, refresh, adjustBadge],
  );

  return (
    <AdminNotificationsContext.Provider value={value}>
      {children}
    </AdminNotificationsContext.Provider>
  );
}

export function useAdminNotifications() {
  const context = useContext(AdminNotificationsContext);
  if (!context) {
    throw new Error(
      "useAdminNotifications must be used within AdminNotificationsProvider",
    );
  }
  return context;
}

export function useRefreshAdminNotifications() {
  const context = useContext(AdminNotificationsContext);
  return context?.refresh ?? (async () => {});
}

export function useAdjustAdminBadge() {
  const context = useContext(AdminNotificationsContext);
  return context?.adjustBadge ?? (() => {});
}

/** Drop nav/dashboard counts immediately, then sync from the server. */
export function useSyncAdminNotifications() {
  const context = useContext(AdminNotificationsContext);
  return useCallback(
    async (href: string, delta = -1) => {
      context?.adjustBadge(href, delta);
      await context?.refresh();
    },
    [context],
  );
}
