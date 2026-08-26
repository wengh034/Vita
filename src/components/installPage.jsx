import { useState } from "react";

export default function InstallPage({
  deferredPrompt,
  onInstalled,
}) {

  const [installing, setInstalling] =
    useState(false);

  const handleInstall = async () => {

    if (!deferredPrompt) {

      console.warn(
        "⚠️ beforeinstallprompt todavía no está disponible"
      );

      return;
    }

    try {

      setInstalling(true);

      console.log(
        "📲 Abriendo ventana de instalación..."
      );

      deferredPrompt.prompt();

      const {
        outcome,
      } = await deferredPrompt.userChoice;

      console.log(
        "Resultado de instalación:",
        outcome
      );

      if (
        outcome === "accepted"
      ) {

        console.log(
          "✅ Usuario aceptó instalar Vita"
        );

        onInstalled?.();

      } else {

        console.log(
          "❌ Usuario rechazó instalar Vita"
        );

      }

    } catch (error) {

      console.error(
        "❌ Error durante la instalación:",
        error
      );

    } finally {

      setInstalling(false);

    }

  };

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