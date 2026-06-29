// Service worker mínimo para GymApp: instalable + caché básica offline.
const CACHE = "gymapp-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }

  // Imágenes de ejercicios (GitHub raw): cache-first, persistente.
  if (url.hostname.endsWith("githubusercontent.com")) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        try {
          const res = await fetch(req);
          if (res.ok) cache.put(req, res.clone());
          return res;
        } catch {
          return hit ?? Response.error();
        }
      }),
    );
    return;
  }

  // Mismo origen (shell, assets): network-first con fallback a caché.
  if (url.origin === self.location.origin) {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req);
          if (res.ok && (req.mode === "navigate" || url.pathname.startsWith("/_next/"))) {
            const cache = await caches.open(CACHE);
            cache.put(req, res.clone());
          }
          return res;
        } catch {
          const cached = await caches.match(req);
          if (cached) return cached;
          if (req.mode === "navigate") {
            const dash = await caches.match("/dashboard");
            if (dash) return dash;
          }
          return Response.error();
        }
      })(),
    );
  }
});
