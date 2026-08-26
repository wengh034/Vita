import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// =========================================================
// SERVICE WORKER
// =========================================================

if ("serviceWorker" in navigator) {
  window.addEventListener(
    "load",
    () => {
      navigator.serviceWorker
        .register("/Vita/service-worker.js", {
          scope: "/Vita/",
        })
        .then((registration) => {
          console.log(
            "Service Worker registrado ✅"
          );

          console.log(
            "Scope:",
            registration.scope
          );

          // Si existe una actualización esperando,
          // mostramos información en consola.
          if (registration.waiting) {
            console.log(
              "🔄 Hay una nueva versión del Service Worker esperando."
            );
          }

          registration.addEventListener(
            "updatefound",
            () => {
              const newWorker =
                registration.installing;

              if (!newWorker) return;

              console.log(
                "🔄 Nueva versión del Service Worker encontrada."
              );

              newWorker.addEventListener(
                "statechange",
                () => {
                  console.log(
                    "SW state:",
                    newWorker.state
                  );
                }
              );
            }
          );
        })
        .catch((error) => {
          console.error(
            "Error registrando Service Worker ❌",
            error
          );
        });
    },
    { once: true }
  );
}