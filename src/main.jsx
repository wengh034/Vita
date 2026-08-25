import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// if ("serviceWorker" in navigator) {
//   window.addEventListener("load", () => {
//     navigator.serviceWorker
//       .register("/service-worker.js")
//       .then(() => console.log("SW registrado ✔"))
//       .catch((err) => console.error("SW error:", err));
//   });
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/Vita/service-worker.js")
      .then((registration) => {
        console.log("SW registrado ✅", registration.scope);
      })
      .catch((error) => {
        console.error("SW error:", error);
      });
  });
}