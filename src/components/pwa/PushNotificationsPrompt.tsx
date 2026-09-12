"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Check, Settings } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import {
  HOMESCREEN_CONFIRMED_KEY,
  PUSH_DISMISSED_KEY,
} from "@/lib/pwa-onboarding";
import { cn } from "@/lib/utils";

const INSTALL_KEY = HOMESCREEN_CONFIRMED_KEY;

type Platform = "ios" | "android" | "desktop";

function isStandaloneDisplay() {
  if (typeof window === "undefined") return false;
  const mediaStandalone = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone =
    "standalone" in navigator &&
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return mediaStandalone || Boolean(iosStandalone);
}

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  ) {
    return "ios";
  }
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

async function getExistingSubscription() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return null;
  }
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export function PushNotificationsPrompt({ className }: { className?: string }) {
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [standalone, setStandalone] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setPlatform(detectPlatform());
      const isStandalone = isStandaloneDisplay();
      setStandalone(isStandalone);

      const installed =
        localStorage.getItem(INSTALL_KEY) === "true" || isStandalone;
      if (!installed) {
        setReady(true);
        return;
      }

      if (localStorage.getItem(PUSH_DISMISSED_KEY) === "true") {
        setReady(true);
        return;
      }

      if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        // Still show guidance when push APIs are missing (common in iOS Safari tab).
        setVisible(true);
        setReady(true);
        return;
      }

      if (Notification.permission === "denied") {
        setPermissionDenied(true);
      }

      try {
        const keyRes = await fetch("/api/push/vapid-key");
        if (!keyRes.ok) {
          setReady(true);
          return;
        }

        const subscription = await getExistingSubscription();
        if (cancelled) return;

        if (subscription) {
          setEnabled(true);
          setReady(true);
          return;
        }

        setVisible(true);
      } catch {
        setVisible(true);
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void init();
    const onInstalled = () => {
      localStorage.removeItem(PUSH_DISMISSED_KEY);
      void init();
    };
    window.addEventListener("jackals-homescreen-confirmed", onInstalled);
    return () => {
      cancelled = true;
      window.removeEventListener("jackals-homescreen-confirmed", onInstalled);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(PUSH_DISMISSED_KEY, "true");
    setVisible(false);
  };

  const enableNotifications = async () => {
    setBusy(true);
    setError(null);
    try {
      if (!isStandaloneDisplay() && detectPlatform() === "ios") {
        throw new Error(
          "Open Jackals from your home screen icon first (not Safari), then tap Enable alerts again.",
        );
      }

      if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        throw new Error(
          "Notifications need the installed home screen app. Open it from your home screen and try again.",
        );
      }

      if (!("PushManager" in window)) {
        throw new Error(
          "Push alerts aren’t available in this browser. On iPhone, open the home screen app (iOS 16.4+).",
        );
      }

      const permission = await Notification.requestPermission();
      if (permission === "denied") {
        setPermissionDenied(true);
        throw new Error(
          "Notifications are blocked. Use the steps below to allow them in Settings.",
        );
      }
      if (permission !== "granted") {
        throw new Error("Notification permission was not granted.");
      }

      const keyRes = await fetch("/api/push/vapid-key");
      if (!keyRes.ok) {
        throw new Error("Push is not available right now. Try again later.");
      }
      const { publicKey } = (await keyRes.json()) as { publicKey: string };

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const json = subscription.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      });

      if (!res.ok) {
        throw new Error("Could not save notification settings.");
      }

      setEnabled(true);
      setVisible(false);
      localStorage.setItem(PUSH_DISMISSED_KEY, "true");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  if (!ready || (!visible && !enabled)) return null;
  if (enabled) return null;

  const needsHomeScreenOpen = platform === "ios" && !standalone;

  return (
    <Card
      className={cn(
        "mb-6 border-sky-500/25 bg-gradient-to-br from-sky-500/[0.08] to-transparent sm:mb-8",
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-sky-300">
            <Bell className="h-5 w-5" />
          </div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-sky-300/90">
            After install · step 2 of 2
          </p>
          <CardTitle>Enable notifications</CardTitle>
          <CardDescription className="mt-2 max-w-xl text-zinc-400">
            Turn on alerts so you get a phone notification the day before
            training and matches you&apos;re signed up for.
          </CardDescription>

          <ol className="mt-4 space-y-2 text-sm text-zinc-300">
            {needsHomeScreenOpen ? (
              <>
                <li className="flex gap-2">
                  <span className="font-semibold text-sky-300">1.</span>
                  <span>
                    Leave Safari and open the <strong>Jackals VC</strong> icon on
                    your home screen
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-sky-300">2.</span>
                  <span>
                    On the dashboard, tap <strong>Enable alerts</strong>
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-sky-300">3.</span>
                  <span>
                    When iPhone asks, tap <strong>Allow</strong>
                  </span>
                </li>
              </>
            ) : platform === "ios" ? (
              <>
                <li className="flex gap-2">
                  <span className="font-semibold text-sky-300">1.</span>
                  <span>
                    Tap <strong>Enable alerts</strong> below
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-sky-300">2.</span>
                  <span>
                    When iPhone asks, tap <strong>Allow</strong>
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-sky-300">3.</span>
                  <span>
                    You&apos;re done — alerts will arrive even when the app is closed
                  </span>
                </li>
              </>
            ) : platform === "android" ? (
              <>
                <li className="flex gap-2">
                  <span className="font-semibold text-sky-300">1.</span>
                  <span>
                    Tap <strong>Enable alerts</strong> below
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-sky-300">2.</span>
                  <span>
                    In the popup, tap <strong>Allow</strong>
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-sky-300">3.</span>
                  <span>
                    If you miss it: Chrome menu → <strong>Settings</strong> →{" "}
                    <strong>Site settings</strong> → <strong>Notifications</strong> →
                    Allow for jackalsvolleyball.com
                  </span>
                </li>
              </>
            ) : (
              <>
                <li className="flex gap-2">
                  <span className="font-semibold text-sky-300">1.</span>
                  <span>
                    Prefer enabling on your <strong>phone</strong> after installing
                    the home screen app
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-sky-300">2.</span>
                  <span>
                    Or tap <strong>Enable alerts</strong> here and choose{" "}
                    <strong>Allow</strong>
                  </span>
                </li>
              </>
            )}
          </ol>

          {permissionDenied ? (
            <div className="mt-4 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-100">
              <p className="flex items-start gap-2 font-medium">
                <Settings className="mt-0.5 h-4 w-4 shrink-0" />
                Notifications are currently blocked
              </p>
              <p className="mt-1.5 text-amber-100/80">
                {platform === "ios"
                  ? "iPhone Settings → Notifications → Jackals VC → Allow Notifications."
                  : platform === "android"
                    ? "Chrome site settings → Notifications → Allow for jackalsvolleyball.com."
                    : "Open your browser site settings and allow notifications for this site."}
              </p>
            </div>
          ) : null}

          {error ? (
            <p className="mt-3 text-sm text-red-300">{error}</p>
          ) : null}
        </div>

        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-52">
          <Button
            type="button"
            variant="primary"
            size="md"
            className="w-full"
            disabled={busy}
            onClick={enableNotifications}
          >
            <Bell className="h-4 w-4" />
            {busy ? "Enabling…" : "Enable alerts"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="md"
            className="w-full"
            disabled={busy}
            onClick={dismiss}
          >
            <BellOff className="h-4 w-4" />
            Not now
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function PushEnabledBadge() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    void getExistingSubscription().then((sub) => {
      if (sub) setOn(true);
    });
  }, []);

  if (!on) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-emerald-300/90">
      <Check className="h-3.5 w-3.5" />
      Alerts on
    </span>
  );
}
