import { useEffect, useState } from "react";

export default function InstallAlert() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // useEffect(() => {
  //   const handler = (e) => {
  //     e.preventDefault();
  //     setDeferredPrompt(e); // Guarda el evento para usar después
  //     console.log("PWA lista para instalar");
  //   };

  //   window.addEventListener("beforeinstallprompt", handler);

  //   return () => {
  //     window.removeEventListener("beforeinstallprompt", handler);
  //   };
  // }, []);
  useEffect(() => {
  const handler = (e) => {
    e.preventDefault();
    setDeferredPrompt(e);
  };

  window.addEventListener("beforeinstallprompt", handler);

  // MOCK para testing si no hay evento real (ej: en tunel o SW offline)
  if (!window.deferredPrompt) {
    setDeferredPrompt({
      prompt: () => alert("Mock install prompt"),
      userChoice: Promise.resolve({ outcome: "accepted" })
    });
  }

  return () => window.removeEventListener("beforeinstallprompt", handler);
}, []);


  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log("Instalación:", outcome);
    setDeferredPrompt(null);
  };

  if (!deferredPrompt) return null;

  return (
    <button
      onClick={handleInstallClick}
      style={{
        position: "fixed",
        bottom: "1rem",
        right: "1rem",
        backgroundColor: "#4CAF50",
        color: "#fff",
        padding: "0.8rem 1.2rem",
        border: "none",
        borderRadius: "8px",
        fontWeight: "bold",
        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
      }}
    >
      Instalar App
    </button>
  );
}
