"use client";

import { useEffect, useId, useState, useSyncExternalStore } from "react";

/** Minimal typing for Chromium's non-standard install prompt event. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const STANDALONE_QUERY = "(display-mode: standalone)";

function subscribeDisplayMode(callback: () => void) {
  if (typeof window.matchMedia !== "function") return () => {};
  const mq = window.matchMedia(STANDALONE_QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  const displayStandalone = typeof window.matchMedia === "function" && window.matchMedia(STANDALONE_QUERY).matches;
  return displayStandalone || nav.standalone === true;
}

export function installInstructions(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua) || (ua.includes("macintosh") && ua.includes("mobile"));
  if (isIOS) return "In Safari, tap the Share button, then choose “Add to Home Screen”.";
  if (ua.includes("android")) return "Open your browser’s menu (⋮) and choose “Install app” or “Add to Home screen”.";
  if (ua.includes("firefox")) return "This browser can’t install web apps. You can bookmark this page instead.";
  return "Look for the install icon at the right of the address bar, or open the browser menu and choose “Install AnchorMind”. If you don’t see it, bookmark this page instead.";
}

const linkButton =
  "min-h-11 rounded text-slate-300 underline underline-offset-4 hover:text-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300";

/**
 * "Install AnchorMind": uses the browser's real install prompt when one is
 * available; otherwise shows short manual instructions. Never claims an
 * installation happened unless the browser reports `appinstalled`.
 */
export default function InstallEntry() {
  const standalone = useSyncExternalStore(subscribeDisplayMode, isStandalone, () => false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [instructions, setInstructions] = useState<string | null>(null);
  const helpId = useId();

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (standalone) return null;
  if (installed) {
    return (
      <p role="status" className="text-sm text-teal-200">
        AnchorMind was added to this device.
      </p>
    );
  }

  const onClick = async () => {
    if (deferred) {
      const event = deferred;
      setDeferred(null); // A prompt can only be used once.
      await event.prompt();
      await event.userChoice; // The `appinstalled` event confirms success.
      return;
    }
    setInstructions((current) => (current ? null : installInstructions(navigator.userAgent)));
  };

  return (
    <div className="contents">
      <button type="button" onClick={onClick} aria-expanded={deferred ? undefined : instructions !== null} aria-controls={deferred ? undefined : helpId} className={linkButton}>
        Install AnchorMind
      </button>
      {instructions && (
        <p id={helpId} className="basis-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm leading-relaxed text-slate-300">
          {instructions}
        </p>
      )}
    </div>
  );
}
