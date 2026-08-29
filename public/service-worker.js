const CACHE_NAME = "vita-pwa-v4";

// Archivos mínimos requeridos para que React cargue estando offline
const PRECACHE_ASSETS = [
  "/Vita/",
  "/Vita/index.html"
];

// =========================================================
// INSTALL
// =========================================================

self.addEventListener("install", (event) => {
  console.log("🔧 Instalando Service Worker:", CACHE_NAME);

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log("📦 Precargando assets base para offline...");
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

console.log("🟢 Service Worker activo:", CACHE_NAME);

// Verificar caches existentes
caches.keys().then((keys) => {
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
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log("🗑️ Eliminando cache antigua:", key);
            return caches.delete(key);
          })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// =========================================================
// FETCH
// =========================================================

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Solo peticiones GET
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
        // Guardar en caché solo respuestas válidas del mismo origen
        if (
          response &&
          response.status === 200 &&
          response.type === "basic"
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          }).catch((error) => {
            console.warn("⚠️ Error guardando en cache:", error);
          });
        }

        return response;
      })
      .catch(async () => {
        // 1. Buscar el recurso exacto en la caché
        const cached = await caches.match(request);
        if (cached) {
          return cached;
        }

        // 2. Si se recarga la página y falla la red, entregar el HTML precargado
        // para que React pueda arrancar y renderizar <OfflinePage />
        if (request.mode === "navigate") {
          const appShell = await caches.match("/Vita/") || await caches.match("/Vita/index.html");
          if (appShell) {
            return appShell;
          }
        }

        // 3. Respuesta fallback en caso de no encontrar nada
        return new Response(
          "Vita no está disponible sin conexión.",
          {
            status: 503,
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
            },
          }
        );
      })
  );
});