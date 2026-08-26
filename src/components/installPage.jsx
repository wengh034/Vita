import { useEffect, useState } from "react";

export default function InstallPage({ onInstalled }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia(
      "(display-mode: standalone)"
    ).matches;

    if (isStandalone) {
      setInstalled(true);
      onInstalled?.();
      return;
    }

    const handler = (event) => {
        console.log("🔥 beforeinstallprompt DISPARADO");
      event.preventDefault();
      setDeferredPrompt(event);
    };
    console.log("👀 Esperando beforeinstallprompt...");

    window.addEventListener(
      "beforeinstallprompt",
      
      handler
      
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handler
      );
    };
  }, [onInstalled]);

  useEffect(() => {
    const handleAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      onInstalled?.();
    };

    window.addEventListener(
      "appinstalled",
      handleAppInstalled
    );

    return () => {
      window.removeEventListener(
        "appinstalled",
        handleAppInstalled
      );
    };
  }, [onInstalled]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const { outcome } =
      await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setInstalled(true);
      onInstalled?.();
    }

    setDeferredPrompt(null);
  };

  if (installed) return null;

  return (
    <div className="install-page" >

      <h1 className="Bobbleboddy-font">Vita</h1>

      <p>
        Instala Vita para comenzar.
      </p>
<button
  onClick={handleInstall}
  disabled={!deferredPrompt}
>
  {deferredPrompt
    ? "Instalar Vita"
    : "Esperando instalación..."}
</button>
      {/* <button
        onClick={handleInstall}
        disabled={!deferredPrompt}
      >
        Instalar Vita
      </button> */}
    </div>

  );
}