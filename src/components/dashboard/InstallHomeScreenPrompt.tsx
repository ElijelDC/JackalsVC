"use client";

import { useEffect, useState } from "react";
import {
  Bookmark,
  Check,
  ChevronDown,
  Download,
  Share,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { HOMESCREEN_CONFIRMED_KEY } from "@/lib/pwa-onboarding";
import { cn } from "@/lib/utils";

const STORAGE_KEY = HOMESCREEN_CONFIRMED_KEY;

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
  // iPadOS 13+ may report as MacIntel with touch
  if (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  ) {
    return "ios";
  }
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

function isAppleDesktop() {
  return (
    typeof navigator !== "undefined" &&
    (/Mac|iPhone|iPad|iPod/.test(navigator.platform) ||
      navigator.userAgent.includes("Mac"))
  );
}

function IosInstallGuide() {
  return (
    <ol className="space-y-3 text-sm text-zinc-300">
      <li className="flex items-start gap-3">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-jackals-red/40 bg-jackals-red/15 text-jackals-red-light">
          <Share className="h-3.5 w-3.5" aria-hidden />
        </span>
        <span>
          Tap <strong className="text-white">Share</strong> in Safari (bottom
          bar on iPhone, top on iPad).
        </span>
      </li>
      <li className="flex items-start gap-3">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-jackals-red/40 bg-jackals-red/15 text-xs font-bold text-jackals-red-light">
          +
        </span>
        <span>
          Choose <strong className="text-white">Add to Home Screen</strong>, then{" "}
          <strong className="text-white">Add</strong>. Open Jackals from the new
          home screen icon.
        </span>
      </li>
    </ol>
  );
}

export function InstallHomeScreenPrompt({ className }: { className?: string }) {
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [iosGuideOpen, setIosGuideOpen] = useState(false);
  const [howToOpen, setHowToOpen] = useState(false);
  const [useCmdShortcut, setUseCmdShortcut] = useState(false);

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

    setPlatform(detectPlatform());
    setUseCmdShortcut(isAppleDesktop());

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      localStorage.setItem(STORAGE_KEY, "true");
      setVisible(false);
      setDeferredPrompt(null);
      window.dispatchEvent(new Event("jackals-homescreen-confirmed"));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    setVisible(true);
    setReady(true);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const confirmInstalled = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
    setIosGuideOpen(false);
    window.dispatchEvent(new Event("jackals-homescreen-confirmed"));
  };

  const handleNativeInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === "accepted") {
      confirmInstalled();
    }
  };

  if (!ready || !visible) return null;

  const canNativeInstall = Boolean(deferredPrompt);
  const isIos = platform === "ios";
  const isDesktop = platform === "desktop";
  const isDesktopBookmark = isDesktop && !canNativeInstall;
  const bookmarkShortcut = useCmdShortcut ? "⌘D" : "Ctrl+D";

  const bodyCopy = isDesktopBookmark
    ? "Bookmark this site in your browser — required for training, matches, and updates. Step 1 of 2; next we'll turn on notifications."
    : isDesktop && canNativeInstall
      ? "Install Jackals as a desktop app — required for training, matches, and updates. Step 1 of 2; next we'll turn on notifications."
      : "Put the club app on your home screen — required for training, matches, and updates. Step 1 of 2; next we'll turn on notifications.";

  return (
    <>
      <Card
        className={cn(
          "mb-6 border-jackals-red/25 bg-gradient-to-br from-jackals-red/[0.1] to-transparent sm:mb-8",
          className,
        )}
      >
        <div className="flex flex-col gap-4">
          <div className="min-w-0">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-jackals-red-light">
              {isDesktopBookmark ? (
                <Bookmark className="h-5 w-5" />
              ) : (
                <Smartphone className="h-5 w-5" />
              )}
            </div>
            <CardTitle>
              Install Jackals WebApp — mandatory for this season
            </CardTitle>
            <CardDescription className="mt-2 max-w-xl text-zinc-400">
              {bodyCopy}
            </CardDescription>
          </div>

          <div className="flex w-full flex-col gap-2 sm:max-w-xs">
            {canNativeInstall ? (
              <Button
                type="button"
                variant="primary"
                size="md"
                className="w-full"
                onClick={handleNativeInstall}
              >
                <Download className="h-4 w-4" />
                Install
              </Button>
            ) : isIos ? (
              <Button
                type="button"
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => setIosGuideOpen(true)}
              >
                <Share className="h-4 w-4" />
                Add to Home Screen
              </Button>
            ) : isDesktopBookmark ? (
              <>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  className="w-full"
                  onClick={() => setHowToOpen((open) => !open)}
                  aria-expanded={howToOpen}
                >
                  <Bookmark className="h-4 w-4" />
                  Bookmark this site
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      howToOpen && "rotate-180",
                    )}
                  />
                </Button>
                {howToOpen ? (
                  <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-3 text-sm text-zinc-300">
                    <p>
                      Press{" "}
                      <strong className="text-white">{bookmarkShortcut}</strong>{" "}
                      (or use your browser&apos;s bookmark / star control), then
                      open Jackals from Bookmarks when you need the club app.
                    </p>
                  </div>
                ) : null}
              </>
            ) : platform === "android" ? (
              <>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  className="w-full"
                  onClick={() => setHowToOpen((open) => !open)}
                  aria-expanded={howToOpen}
                >
                  <Download className="h-4 w-4" />
                  Install
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      howToOpen && "rotate-180",
                    )}
                  />
                </Button>
                {howToOpen ? (
                  <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-3 text-sm text-zinc-300">
                    <p>
                      Tap browser menu (
                      <strong className="text-white">⋮</strong>) →{" "}
                      <strong className="text-white">Install app</strong> or{" "}
                      <strong className="text-white">Add to Home screen</strong>
                      , then open Jackals from the icon.
                    </p>
                  </div>
                ) : null}
              </>
            ) : null}

            <Button
              type="button"
              variant="outline"
              size="md"
              className="w-full"
              onClick={confirmInstalled}
            >
              <Check className="h-4 w-4" />
              {isDesktopBookmark
                ? "I've bookmarked it"
                : "I've installed it"}
            </Button>
          </div>
        </div>
      </Card>

      <Modal
        open={iosGuideOpen}
        onClose={() => setIosGuideOpen(false)}
        title="Add to Home Screen"
        description={
          <p className="text-sm text-zinc-400">
            iPhone can&apos;t install with one tap — two quick steps in Safari:
          </p>
        }
      >
        <IosInstallGuide />
        <div className="mt-5 flex flex-col gap-2">
          <Button
            type="button"
            variant="primary"
            size="md"
            className="w-full"
            onClick={confirmInstalled}
          >
            <Check className="h-4 w-4" />
            Done — I&apos;ve added it
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="md"
            className="w-full"
            onClick={() => setIosGuideOpen(false)}
          >
            Close
          </Button>
        </div>
      </Modal>
    </>
  );
}
