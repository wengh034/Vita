// const CACHE_NAME = "vita-v1";
// const urlsToCache = [
//   "/",
//   "./index.html",
//   "/manifest.json",
// "karp-cap1.json",
// "karp-cap2.json",
// "karp-cap3.json",
// "karp-cap4.json",
// "karp-cap5.json",
// "karp-cap6.json",
// "karp-cap7.json",
// "karp-cap8.json",
// "karp-cap9.json",
// "karp-cap10.json",
//   "/bookList.json",
//   "/karp-chapters.json"
//   // Agregar aquí más recursos que quieras cachear
// ];

// self.addEventListener("install", (event) => {
//   event.waitUntil(
//     caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
//   );
// });

// self.addEventListener("fetch", (event) => {
//   event.respondWith(
//     caches.match(event.request).then((response) => response || fetch(event.request))
//   );
// });

const CACHE_NAME = "vita-cache-v3";

// Cache estático: solo archivos del public
const STATIC_ASSETS = [
  "/",                 // Vite sirve index.html desde aquí
  "/index.html",
  "/manifest.json",
  "/bookList.json",
  "/karp-chapters.json",
  "/subjects.json",

  // Todos tus JSON de capítulos
  "/karp-cap1.json",
  "/karp-cap2.json",
  "/karp-cap3.json",
  "/karp-cap4.json",
  "/karp-cap5.json",
  "/karp-cap6.json",
  "/karp-cap7.json",
  "/karp-cap8.json",
  "/karp-cap9.json",
  "/karp-cap10.json",
];

// Instalación
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activación
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch con fallback para SPA
self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  event.respondWith(
    caches.match(request).then((cached) => {
      return (
        cached ||
        fetch(request).catch(() => {
          // Fallback a index.html si es navegación SPA
          if (request.headers.get("accept")?.includes("text/html")) {
            return caches.match("/index.html");
          }
        })
      );
    })
  );
});
