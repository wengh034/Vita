import { useEffect, useState } from "react";

export default function InstallPage({
  deferredPrompt,
}) {
  const [installing, setInstalling] = useState(false);
  const [installationCompleted, setInstallationCompleted] =
    useState(false);

  useEffect(() => {
    const handleAppInstalled = () => {
      console.log("✅ Vita fue instalada");

      setInstallationCompleted(true);
      setInstalling(false);
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
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      console.warn(
        "⚠️ beforeinstallprompt todavía no está disponible"
      );
      return;
    }

    try {
      setInstalling(true);

      deferredPrompt.prompt();

      const { outcome } =
        await deferredPrompt.userChoice;

      console.log(
        "Resultado de instalación:",
        outcome
      );

      if (outcome === "dismissed") {
        setInstalling(false);
      }

      // Si fue accepted, esperamos al evento
      // "appinstalled" para confirmar realmente
      // que la instalación terminó.

    } catch (error) {
      console.error(
        "❌ Error durante la instalación:",
        error
      );

      setInstalling(false);
    }
  };

  // =========================================================
  // INSTALACIÓN COMPLETADA
  // =========================================================

  if (installationCompleted) {
    return (
      <div className="install-page">

        <h1 className="Bobbleboddy-font">
          Vita
        </h1>

        <h2>
          ¡Vita se instaló correctamente! 🎉
        </h2>

        <p>
          Busca <strong>Vita</strong> entre tus
          aplicaciones para abrirla.
        </p>

        <p>
          Esta ventana puede cerrarse.
        </p>

      </div>
    );
  }

  // =========================================================
  // INSTALACIÓN NORMAL
  // =========================================================

  return (
    <div className="install-page">

      <h1 className="Bobbleboddy-font">
        Vita
      </h1>

      <p>
        Instala Vita para comenzar.
      </p>

      <button
        onClick={handleInstall}
        disabled={
          !deferredPrompt ||
          installing
        }
      >
        {installing
          ? "Instalando..."
          : deferredPrompt
            ? "Instalar Vita"
            : "Esperando instalación..."}
      </button>

    </div>
  );
}