const CACHE_NAME = "vita-pwa-v4";

// =========================================================
// INSTALL
// =========================================================

self.addEventListener("install", (event) => {

  console.log(
    "🔧 Instalando Service Worker:",
    CACHE_NAME
  );

  event.waitUntil(
    self.skipWaiting()
  );

});

console.log("🟢 Service Worker activo:", CACHE_NAME);

caches.keys().then((keys) => {
  console.log("📦 Caches encontrados:", keys);

  if (keys.includes(CACHE_NAME)) {
    console.log("✅ Cache actual encontrado:", CACHE_NAME);
  } else {
    console.warn("⚠️ El cache actual NO existe todavía:", CACHE_NAME);
  }
});
// =========================================================
// ACTIVATE
// =========================================================

self.addEventListener("activate", (event) => {

  event.waitUntil(

    caches
      .keys()
      .then((keys) => {

        return Promise.all(

          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => {

              console.log(
                "🗑️ Eliminando cache antigua:",
                key
              );

              return caches.delete(key);

            })

        );

      })
      .then(() => {

        return self.clients.claim();

      })

  );

});

// =========================================================
// FETCH
// =========================================================

self.addEventListener("fetch", (event) => {

  const { request } = event;

  // Solo GET
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // =======================================================
  // API
  // =======================================================
  // El Service Worker NO interviene en la API.
  // Las peticiones /api/ van directamente a la red.

  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // =======================================================
  // FRONTEND
  // =======================================================

  event.respondWith(

    fetch(request)

      .then((response) => {

        // Solo guardar respuestas válidas del mismo origen
        if (
          response &&
          response.status === 200 &&
          response.type === "basic"
        ) {

          const clone = response.clone();

          caches
            .open(CACHE_NAME)
            .then((cache) => {

              return cache.put(
                request,
                clone
              );

            })
            .catch((error) => {

              console.warn(
                "⚠️ Error guardando en cache:",
                error
              );

            });

        }

        return response;

      })

      .catch(async () => {

        // Si no hay conexión, intentar obtener
        // el recurso previamente cacheado.

        const cached = await caches.match(request);

        if (cached) {
          return cached;
        }

        // No hay red ni cache
        return new Response(
          "Vita no está disponible sin conexión.",
          {
            status: 503,
            headers: {
              "Content-Type":
                "text/plain; charset=utf-8",
            },
          }
        );

      })

  );

});