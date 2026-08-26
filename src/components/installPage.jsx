import { useEffect, useState } from "react";

export default function InstallPage({
  deferredPrompt,
}) {
  const [installing, setInstalling] = useState(false);

  const [installationCompleted, setInstallationCompleted] =
    useState(() => {
      return (
        localStorage.getItem("vita-installed") ===
        "true"
      );
    });

  // =========================================================
  // DETECTAR NAVEGADOR
  // =========================================================

  const getBrowserName = () => {

    const ua = navigator.userAgent;

    if (ua.includes("Edg/")) {
      return "Microsoft Edge";
    }

    if (
      ua.includes("OPR/") ||
      ua.includes("Opera")
    ) {
      return "Opera";
    }

    if (ua.includes("Brave")) {
      return "Brave";
    }

    if (
      ua.includes("Firefox") &&
      !ua.includes("Seamonkey")
    ) {
      return "Firefox";
    }

    if (
      ua.includes("Safari") &&
      !ua.includes("Chrome")
    ) {
      return "Safari";
    }

    if (
      ua.includes("Chrome") &&
      !ua.includes("Edg") &&
      !ua.includes("OPR")
    ) {
      return "Google Chrome";
    }

    return "este navegador";
  };

  const browserName = getBrowserName();

  const isChrome =
    browserName === "Google Chrome";

  // =========================================================
  // INSTALACIÓN REAL
  // =========================================================

  useEffect(() => {

    const handleAppInstalled = () => {

      console.log(
        "✅ Vita fue instalada"
      );

      localStorage.setItem(
        "vita-installed",
        "true"
      );

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

  // =========================================================
  // INSTALAR
  // =========================================================

  const handleInstall = async () => {

    if (!deferredPrompt) {
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

      // -----------------------------------------------------
      // USUARIO RECHAZÓ
      // -----------------------------------------------------

      if (outcome === "dismissed") {

        console.log(
          "❌ Usuario canceló la instalación"
        );

        setInstalling(false);

        return;
      }

      // -----------------------------------------------------
      // Si aceptó:
      //
      // NO cambiamos el estado aquí.
      // Esperamos "appinstalled".
      // -----------------------------------------------------

    } catch (error) {

      console.error(
        "❌ Error durante la instalación:",
        error
      );

      setInstalling(false);

    }

  };

  // =========================================================
  // YA INSTALADA
  // =========================================================

  if (installationCompleted) {

    return (
      <div className="install-page">

        <h1 className="Bobbleboddy-font">
          Vita
        </h1>

        <h2>
          ¡Vita ya está instalada! 🎉
        </h2>

        <p>
          Busca <strong>Vita</strong> entre tus
          aplicaciones para abrirla.
        </p>

        <p>
          Puedes cerrar esta ventana.
        </p>

      </div>
    );
  }

  // =========================================================
  // NAVEGADOR NO COMPATIBLE
  // =========================================================

  if (!isChrome) {

    return (
      <div className="install-page">

        <h1 className="Bobbleboddy-font">
          Vita
        </h1>

        <h2>
          Navegador no compatible
        </h2>

        <p>
          Vita necesita <strong>Google Chrome</strong>{" "}
          para poder instalarse correctamente.
        </p>

        <p>
          Actualmente estás usando{" "}
          <strong>{browserName}</strong>.
        </p>

        <p>
          Abre Vita desde Google Chrome para
          instalarla como aplicación.
        </p>

      </div>
    );
  }

  // =========================================================
  // INSTALACIÓN
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