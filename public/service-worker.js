const CACHE_NAME = "vita-pwa-v2";

// ─────────────────────────────────────────────
// INSTALL
// ─────────────────────────────────────────────

self.addEventListener("install", (event) => {
  console.log("🔧 Instalando Service Worker:", CACHE_NAME);
  
  event.waitUntil(self.skipWaiting());
});

// ─────────────────────────────────────────────
// ACTIVATE
// ─────────────────────────────────────────────

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─────────────────────────────────────────────
// FETCH
// ─────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // ───────────────────────────────────────────
  // API
  // Nunca cachear Express / SQLite
  // ───────────────────────────────────────────

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(request));
    return;
  }

  // ───────────────────────────────────────────
  // FRONTEND
  // Network first + cache fallback
  // ───────────────────────────────────────────

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (
          response &&
          response.status === 200 &&
          response.type === "basic"
        ) {
          const clone = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
        }

        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});