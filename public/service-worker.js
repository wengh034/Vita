const CACHE_NAME = "vita-pwa-v3";

// =========================================================
// INSTALL
// =========================================================

self.addEventListener(
  "install",
  (event) => {

    console.log(
      "🔧 Instalando Service Worker:",
      CACHE_NAME
    );

    event.waitUntil(
      self.skipWaiting()
    );

  }
);

// =========================================================
// ACTIVATE
// =========================================================

self.addEventListener(
  "activate",
  (event) => {

    event.waitUntil(

      caches
        .keys()

        .then((keys) => {

          return Promise.all(

            keys

              .filter(
                (key) =>
                  key !== CACHE_NAME
              )

              .map((key) =>
                caches.delete(key)
              )

          );

        })

        .then(() => {

          return self.clients.claim();

        })

    );

  }
);

// =========================================================
// FETCH
// =========================================================

self.addEventListener(
  "fetch",
  (event) => {

    const {
      request,
    } = event;

    if (
      request.method !== "GET"
    ) {
      return;
    }

    const url =
      new URL(request.url);

    // =======================================================
    // API
    // =======================================================

    if (
      url.pathname.startsWith(
        "/api/"
      )
    ) {

      event.respondWith(
        fetch(request)
      );

      return;
    }

    // =======================================================
    // FRONTEND
    // =======================================================

    event.respondWith(

      fetch(request)

        .then((response) => {

          if (
            response &&
            response.status === 200 &&
            response.type === "basic"
          ) {

            const clone =
              response.clone();

            caches
              .open(CACHE_NAME)
              .then((cache) => {

                cache.put(
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

          const cached =
            await caches.match(
              request
            );

          if (cached) {
            return cached;
          }

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

  }
);