"use client";

import { useEffect } from "react";

/**
 * Registers /sw.js in production builds and hands it the list of this page's
 * own static files (/_next/static/...) so the settle exercises work offline.
 * Nothing user-entered is ever sent to the service worker.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    let cancelled = false;

    const shareAssets = (registration: ServiceWorkerRegistration) => {
      const urls = new Set<string>();
      for (const entry of performance.getEntriesByType("resource")) {
        if (entry.name.includes("/_next/static/")) urls.add(entry.name);
      }
      document.querySelectorAll<HTMLScriptElement>("script[src]").forEach((s) => urls.add(s.src));
      document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][href]').forEach((l) => urls.add(l.href));
      registration.active?.postMessage({ type: "CACHE_ASSETS", urls: [...urls] });
    };

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then(() => navigator.serviceWorker.ready)
      .then((registration) => {
        if (!cancelled) shareAssets(registration);
      })
      .catch(() => {
        // Offline support is a progressive enhancement; the app works without it.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
