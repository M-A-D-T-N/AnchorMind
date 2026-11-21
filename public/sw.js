/* AnchorMind service worker.
 *
 * Caches ONLY explicitly selected public static resources so the
 * "Help me settle" exercises work offline:
 *   - the static home page ("/"), which contains no user data,
 *   - the manifest and icons,
 *   - immutable build assets under /_next/static/.
 *
 * It never caches or intercepts API requests (/api/...), non-GET requests,
 * submitted thoughts, or generated reflections, and never queues anything
 * for background submission.
 */
const CACHE = "anchormind-static-v1";
const PRECACHE = ["/", "/manifest.webmanifest", "/icon.svg", "/icon-192.png", "/icon-512.png", "/icon-maskable-512.png", "/apple-touch-icon.png"];
const PRECACHE_PATHS = new Set(PRECACHE);

function isCacheableAsset(url, origin) {
  let u;
  try {
    u = new URL(url, origin);
  } catch {
    return false;
  }
  if (u.origin !== origin) return false;
  if (u.pathname.startsWith("/api/")) return false;
  if (u.search && !u.pathname.startsWith("/_next/static/") && u.pathname !== "/icon.svg") return false;
  return u.pathname.startsWith("/_next/static/") || PRECACHE_PATHS.has(u.pathname);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE.map((p) => new Request(p, { cache: "reload" }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// The page shares the URLs of its own build assets; each one is re-checked here.
self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || data.type !== "CACHE_ASSETS" || !Array.isArray(data.urls)) return;
  const origin = self.location.origin;
  const urls = data.urls.filter((u) => typeof u === "string" && isCacheableAsset(u, origin)).slice(0, 200);
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(urls.map((u) => cache.match(u).then((hit) => hit || cache.add(u).catch(() => undefined)))),
    ),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return; // Never touch POSTs (including /api/analyze).
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  // Home page: network first, fall back to the cached static shell when offline.
  if (request.mode === "navigate") {
    if (url.pathname !== "/") return;
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put("/", copy));
          }
          return response;
        })
        .catch(() => caches.match("/").then((hit) => hit || Response.error())),
    );
    return;
  }

  if (!isCacheableAsset(request.url, self.location.origin)) return;

  // Static assets: cache first (build assets are content-hashed and immutable).
  event.respondWith(
    caches.match(request, { ignoreSearch: url.pathname === "/icon.svg" }).then(
      (hit) =>
        hit ||
        fetch(request).then((response) => {
          if (response.ok && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});
