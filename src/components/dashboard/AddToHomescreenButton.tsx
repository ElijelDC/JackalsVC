"use client";

import { useEffect, useState } from "react";
import { Download, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/Button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function AddToHomescreenButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // Check device type
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    const isDesktopDevice = !isMobileDevice;

    setIsIOS(isIOSDevice);
    setIsDesktop(isDesktopDevice);

    if (!isIOSDevice && !isDesktopDevice) {
      // Handle Android/Chrome install prompt
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setShowPrompt(true);
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      };
    }
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setShowPrompt(false);
      }
    }
  };

  const handleIOSInstall = () => {
    alert(
      "To add Jackals VC to your home screen:\n\n1. Tap the Share button\n2. Scroll down and tap \"Add to Home Screen\"\n3. Tap \"Add\""
    );
  };

  const handleDesktopBookmark = () => {
    // Try to use browser's bookmark feature
    const isFirefox = navigator.userAgent.indexOf("Firefox") > -1;
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    
    if (isFirefox) {
      alert("To bookmark Jackals VC:\n\nPress Ctrl+D (or Cmd+D on Mac) to add this page to your bookmarks");
    } else if (isSafari) {
      alert("To bookmark Jackals VC:\n\nPress Cmd+D to add this page to your bookmarks");
    } else {
      // Chrome, Edge, and other Chromium browsers
      alert("To bookmark Jackals VC:\n\nPress Ctrl+D (or Cmd+D on Mac) to add this page to your bookmarks");
    }
  };

  if (!showPrompt && !isIOS && !isDesktop) {
    return null;
  }

  // Show appropriate button based on device
  if (isDesktop) {
    return (
      <Button
        onClick={handleDesktopBookmark}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <Bookmark className="h-4 w-4" />
        Bookmark
      </Button>
    );
  }

  if (isIOS) {
    return (
      <Button
        onClick={handleIOSInstall}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        Add to Home Screen
      </Button>
    );
  }

  if (showPrompt) {
    return (
      <Button
        onClick={handleInstall}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        Install App
      </Button>
    );
  }

  return null;
}
