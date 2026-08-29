import { useEffect, useState } from "react";

export default function InstallPage({
  deferredPrompt,
}) {

  // =========================================================
  // ESTADO
  // =========================================================

  const [installing, setInstalling] =
    useState(false);

  const [installationCompleted, setInstallationCompleted] =
    useState(() => {

      return (
        localStorage.getItem(
          "vita-installed"
        ) === "true"
      );

    });


  // =========================================================
  // DETECTAR NAVEGADOR
  // =========================================================

  const detectBrowser = () => {

    const ua =
      navigator.userAgent;

    // -------------------------------------------------------
    // BRAVE
    // -------------------------------------------------------

    if (
      navigator.brave ||
      /Brave/i.test(ua)
    ) {

      return "Brave";

    }


    // -------------------------------------------------------
    // MICROSOFT EDGE
    // -------------------------------------------------------

    if (
      /Edg\//i.test(ua)
    ) {

      return "Microsoft Edge";

    }


    // -------------------------------------------------------
    // OPERA
    // -------------------------------------------------------

    if (
      /OPR\//i.test(ua)
    ) {

      return "Opera";

    }


    // -------------------------------------------------------
    // FIREFOX
    // -------------------------------------------------------

    if (
      /Firefox\//i.test(ua)
    ) {

      return "Firefox";

    }


    // -------------------------------------------------------
    // SAFARI
    // -------------------------------------------------------

    if (
      /Safari\//i.test(ua) &&
      !/Chrome\//i.test(ua)
    ) {

      return "Safari";

    }


    // -------------------------------------------------------
    // GOOGLE CHROME
    // -------------------------------------------------------

    if (
      /Chrome\//i.test(ua)
    ) {

      return "Google Chrome";

    }


    // -------------------------------------------------------
    // DESCONOCIDO
    // -------------------------------------------------------

    return "este navegador";

  };


  const browserName =
    detectBrowser();


  const isChrome =
    browserName === "Google Chrome";


  // =========================================================
  // DETECTAR INSTALACIÓN REAL
  // =========================================================

  useEffect(() => {

    const handleAppInstalled = () => {

      console.log(
        "✅ Vita fue instalada"
      );


      // -----------------------------------------------------
      // Guardamos la instalación
      // -----------------------------------------------------

      localStorage.setItem(
        "vita-installed",
        "true"
      );


      // -----------------------------------------------------
      // Cambiamos el mensaje
      // -----------------------------------------------------

      setInstallationCompleted(
        true
      );


      setInstalling(
        false
      );

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
  // INSTALAR VITA
  // =========================================================

  const handleInstall = async () => {

    // -------------------------------------------------------
    // No hay prompt disponible
    // -------------------------------------------------------

    if (!deferredPrompt) {

      console.warn(
        "⚠️ beforeinstallprompt no está disponible"
      );

      return;

    }


    try {

      setInstalling(
        true
      );


      // -----------------------------------------------------
      // Mostrar instalación
      // -----------------------------------------------------

      deferredPrompt.prompt();


      // -----------------------------------------------------
      // Esperar respuesta del usuario
      // -----------------------------------------------------

      const { outcome } =
        await deferredPrompt.userChoice;


      console.log(
        "Resultado de instalación:",
        outcome
      );


      // =====================================================
      // USUARIO RECHAZÓ
      // =====================================================

      if (
        outcome === "dismissed"
      ) {

        console.log(
          "❌ Usuario canceló la instalación"
        );


        // IMPORTANTE:
        //
        // No mostramos ningún mensaje.
        // No guardamos nada.
        // No marcamos la app como instalada.
        //

        setInstalling(
          false
        );


        return;

      }


      // =====================================================
      // USUARIO ACEPTÓ
      // =====================================================

      if (
        outcome === "accepted"
      ) {

        console.log(
          "👍 Usuario aceptó la instalación"
        );

        /*
         * NO hacemos:
         *
         * setInstallationCompleted(true)
         *
         * todavía.
         *
         * Esperamos al evento "appinstalled",
         * que confirma que la instalación realmente
         * terminó.
         */

      }

    } catch (error) {

      console.error(
        "❌ Error durante la instalación:",
        error
      );


      setInstalling(
        false
      );

    }

  };


  // =========================================================
  // YA ESTÁ INSTALADA
  // =========================================================

  if (
    installationCompleted
  ) {

    return (

      <div className="install-page">

        <h1 className="Bobbleboddy-font">
          Vita
        </h1>


        <h2>
          ¡Vita ya está instalada! 🎉
        </h2>


        <p>
          Busca{" "}
          <strong>
            Vita
          </strong>{" "}
          entre tus aplicaciones
          para abrirla.
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

  if (
    !isChrome
  ) {

    return (

      <div className="install-page">

        <h1 className="Bobbleboddy-font">
          Vita
        </h1>
        <h2>
          Navegador no compatible
        </h2>

      <div 
      style={{
        justifyContent: "center",
        display: "flex",
        flexDirection: "column",

        textAlign: "center",
      }}
      >
        <p>
          Vita necesita{" "}
          <strong>
            Google Chrome
          </strong>{" "}
          para poder instalarse correctamente.
        </p>


        <p>
          Actualmente estás usando{" "}
          <strong>
            {browserName}
          </strong>. Abre Vita desde Google Chrome
          para instalarla como aplicación.
        </p>
      </div>
        

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