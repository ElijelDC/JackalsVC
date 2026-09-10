"use client";

import { useEffect, useState } from "react";
import { Check, Download, Share, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "jackals-homescreen-installed-confirmed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

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
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

export function InstallHomeScreenPrompt({ className }: { className?: string }) {
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "true") {
      setReady(true);
      return;
    }

    if (isStandaloneDisplay()) {
      localStorage.setItem(STORAGE_KEY, "true");
      window.dispatchEvent(new Event("jackals-homescreen-confirmed"));
      setReady(true);
      return;
    }

    const nextPlatform = detectPlatform();
    setPlatform(nextPlatform);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    setVisible(true);
    setReady(true);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const confirmInstalled = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
    window.dispatchEvent(new Event("jackals-homescreen-confirmed"));
  };

  const handleNativeInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === "accepted") {
      confirmInstalled();
    }
  };

  if (!ready || !visible) return null;

  return (
    <Card
      className={cn(
        "mb-6 border-jackals-red/25 bg-gradient-to-br from-jackals-red/[0.1] to-transparent sm:mb-8",
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-jackals-red-light">
            <Smartphone className="h-5 w-5" />
          </div>
          <CardTitle>Install Jackals on your home screen</CardTitle>
          <CardDescription className="mt-2 max-w-xl text-zinc-400">
            Add the club app for faster access — then we&apos;ll show you how to
            turn on training &amp; match notifications.
          </CardDescription>

          <ol className="mt-4 space-y-2 text-sm text-zinc-300">
            {platform === "ios" ? (
              <>
                <li className="flex gap-2">
                  <span className="font-semibold text-jackals-red-light">1.</span>
                  <span>
                    Tap the <Share className="inline h-3.5 w-3.5 align-text-bottom" />{" "}
                    <strong>Share</strong> button in Safari
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-jackals-red-light">2.</span>
                  <span>
                    Scroll and tap <strong>Add to Home Screen</strong>
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-jackals-red-light">3.</span>
                  <span>
                    Tap <strong>Add</strong>, then open Jackals from your{" "}
                    <strong>home screen icon</strong> (not Safari)
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-jackals-red-light">4.</span>
                  <span>
                    Next step: enable notifications on the card that appears
                  </span>
                </li>
              </>
            ) : platform === "android" ? (
              <>
                <li className="flex gap-2">
                  <span className="font-semibold text-jackals-red-light">1.</span>
                  <span>
                    Tap <strong>Install app</strong> below (or browser menu →
                    Install / Add to Home screen)
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-jackals-red-light">2.</span>
                  <span>Confirm, then open Jackals from your home screen</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-jackals-red-light">3.</span>
                  <span>
                    Next step: enable notifications on the card that appears
                  </span>
                </li>
              </>
            ) : (
              <>
                <li className="flex gap-2">
                  <span className="font-semibold text-jackals-red-light">1.</span>
                  <span>
                    On your phone, open{" "}
                    <strong>jackalsvolleyball.com</strong> in Safari or Chrome
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-jackals-red-light">2.</span>
                  <span>
                    Use <strong>Add to Home Screen</strong> / <strong>Install app</strong>
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-jackals-red-light">3.</span>
                  <span>
                    Open the home screen app, then enable notifications when asked
                  </span>
                </li>
              </>
            )}
          </ol>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-52">
          {deferredPrompt ? (
            <Button
              type="button"
              variant="primary"
              size="md"
              className="w-full"
              onClick={handleNativeInstall}
            >
              <Download className="h-4 w-4" />
              Install app
            </Button>
          ) : null}
          <Button
            type="button"
            variant={deferredPrompt ? "outline" : "primary"}
            size="md"
            className="w-full"
            onClick={confirmInstalled}
          >
            <Check className="h-4 w-4" />
            I&apos;ve installed it
          </Button>
        </div>
      </div>
    </Card>
  );
}
