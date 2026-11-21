// @vitest-environment node
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { describe, expect, it, vi } from "vitest";

type Listener = (event: unknown) => void;

function loadServiceWorker() {
  const source = fs.readFileSync(path.join(process.cwd(), "public", "sw.js"), "utf8");
  const listeners: Record<string, Listener> = {};
  const context = vm.createContext({
    URL,
    Request,
    Response,
    Set,
    self: {
      location: { origin: "https://anchormind.test" },
      addEventListener: (type: string, fn: Listener) => {
        listeners[type] = fn;
      },
    },
    caches: {},
    fetch: vi.fn(),
  });
  vm.runInContext(source, context);
  return { context: context as unknown as { isCacheableAsset: (url: string, origin: string) => boolean }, listeners };
}

const ORIGIN = "https://anchormind.test";

describe("service worker caching policy", () => {
  const { context, listeners } = loadServiceWorker();

  it("caches only selected public static resources", () => {
    expect(context.isCacheableAsset(`${ORIGIN}/_next/static/chunks/app-123.js`, ORIGIN)).toBe(true);
    expect(context.isCacheableAsset(`${ORIGIN}/_next/static/css/app.css?v=1`, ORIGIN)).toBe(true);
    expect(context.isCacheableAsset(`${ORIGIN}/`, ORIGIN)).toBe(true);
    expect(context.isCacheableAsset(`${ORIGIN}/manifest.webmanifest`, ORIGIN)).toBe(true);
    expect(context.isCacheableAsset(`${ORIGIN}/icon-192.png`, ORIGIN)).toBe(true);
  });

  it("never caches API routes, other origins, or arbitrary pages", () => {
    expect(context.isCacheableAsset(`${ORIGIN}/api/analyze`, ORIGIN)).toBe(false);
    expect(context.isCacheableAsset(`${ORIGIN}/api/analyze?thought=secret`, ORIGIN)).toBe(false);
    expect(context.isCacheableAsset(`https://evil.example/_next/static/x.js`, ORIGIN)).toBe(false);
    expect(context.isCacheableAsset(`${ORIGIN}/?q=private`, ORIGIN)).toBe(false);
    expect(context.isCacheableAsset(`${ORIGIN}/some-page`, ORIGIN)).toBe(false);
  });

  it("does not intercept POST requests or API calls", () => {
    const respondWith = vi.fn();
    listeners.fetch?.({ request: new Request(`${ORIGIN}/api/analyze`, { method: "POST", body: "{}" }), respondWith });
    listeners.fetch?.({ request: new Request(`${ORIGIN}/api/analyze`), respondWith });
    expect(respondWith).not.toHaveBeenCalled();
  });
});
