import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";

import {
  initUserStats,
  syncChaptersMeta,
} from "./progress";

import { validateStreak } from "./streakValidation.js";
import { apiFetch } from "./config/api.js";

import BooksList from "./components/BooksList.jsx";
import ChapterPage from "./components/ChapterPage.jsx";
import GamePage from "./components/GamePage.jsx";
import InstallPage from "./components/installPage.jsx";

import "./App.css";
import "./responsive.css";

export default function App() {

  // =========================================================
  // DATOS
  // =========================================================

  const [dataLoaded, setDataLoaded] =
    useState(false);

  const [contentReady, setContentReady] =
    useState(false);

  const [showLoading, setShowLoading] =
    useState(true);

  const [subjects, setSubjects] =
    useState([]);

  const [books, setBooks] =
    useState([]);

  const [serverDate, setServerDate] =
    useState(null);

  // =========================================================
  // CONEXIÓN
  // =========================================================

  const [connectionError, setConnectionError] =
    useState(false);

  const [retryingConnection, setRetryingConnection] =
    useState(false);

  // =========================================================
  // LOADING
  // =========================================================

  const startTimeRef =
    useRef(performance.now());

  const loadingFinishedRef =
    useRef(false);

  // =========================================================
  // PWA
  // =========================================================

  const [isInstalled, setIsInstalled] =
    useState(false);

  const [deferredPrompt, setDeferredPrompt] =
    useState(null);

  // =========================================================
  // COMPROBAR CONEXIÓN CON BACKEND
  // =========================================================

  const checkConnection = async () => {

    try {

      console.log(
        "🌐 Comprobando conexión con backend..."
      );

      const res =
        await apiFetch("/health");

      if (!res.ok) {

        throw new Error(
          `HTTP ${res.status}`
        );

      }

      console.log(
        "✅ Conexión con backend confirmada"
      );

      setConnectionError(false);

      return true;

    } catch (err) {

      console.error(
        "❌ Backend todavía no disponible:",
        err
      );

      return false;

    }

  };

  // =========================================================
  // ARRANQUE DE LA APLICACIÓN
  // =========================================================

  useEffect(() => {

    let cancelled = false;

    const waitForBackend = async () => {

      // -------------------------------------------------------
      // 1. ESPERAR AL BACKEND
      // -------------------------------------------------------

      while (!cancelled) {

        const connected =
          await checkConnection();

        if (connected) {
          break;
        }

        console.log(
          "⏳ Backend no disponible."
        );

        console.log(
          "🔄 Reintentando en 3 segundos..."
        );

        await new Promise(resolve =>
          setTimeout(resolve, 3000)
        );

      }

      if (cancelled) return;

      // -------------------------------------------------------
      // 2. CARGAR DATOS INICIALES
      // -------------------------------------------------------

      try {

        console.log(
          "📦 Cargando datos iniciales..."
        );

        const [
          subjectsData,
          booksData,
        ] = await Promise.all([

          apiFetch("/matters")
            .then(res => {

              if (!res.ok) {

                throw new Error(
                  `Error /matters: HTTP ${res.status}`
                );

              }

              return res.json();

            }),

          apiFetch("/books")
            .then(res => {

              if (!res.ok) {

                throw new Error(
                  `Error /books: HTTP ${res.status}`
                );

              }

              return res.json();

            }),

        ]);

        if (cancelled) return;

        setSubjects(subjectsData);
        setBooks(booksData);

        setDataLoaded(true);

        console.log(
          "📚 Datos iniciales cargados"
        );

        // -----------------------------------------------------
        // 3. FECHA DEL SERVIDOR
        // -----------------------------------------------------

        const dateRes =
          await apiFetch("/server-date");

        if (!dateRes.ok) {

          throw new Error(
            `Error /server-date: HTTP ${dateRes.status}`
          );

        }

        const dateData =
          await dateRes.json();

        if (cancelled) return;

        setServerDate(dateData.date);

        console.log(
          "📅 Fecha del servidor obtenida:",
          dateData.date
        );

        // -----------------------------------------------------
        // 4. INICIALIZAR ESTADÍSTICAS LOCALES
        // -----------------------------------------------------

        await initUserStats();

        if (cancelled) return;

        console.log(
          "💾 Estadísticas locales inicializadas"
        );

        // -----------------------------------------------------
        // 5. SINCRONIZAR METADATA
        // -----------------------------------------------------

        await syncChaptersMeta();

        if (cancelled) return;

        console.log(
          "🔄 Metadata de capítulos sincronizada"
        );

        // -----------------------------------------------------
        // 6. APLICACIÓN LISTA
        // -----------------------------------------------------

        setContentReady(true);

        console.log(
          "🚀 Vita está lista"
        );

      } catch (err) {

        console.error(
          "❌ Error durante la inicialización:",
          err
        );

        if (!cancelled) {

          setConnectionError(true);

        }

      }

    };

    waitForBackend();

    return () => {

      cancelled = true;

    };

  }, []);

  // =========================================================
  // VALIDAR RACHA
  // =========================================================

  useEffect(() => {

    if (!serverDate) return;

    validateStreak(serverDate);

  }, [serverDate]);

  // =========================================================
  // CONFIGURAR ALTURA DE LA APP
  // =========================================================

  useEffect(() => {

    const setAppHeight = () => {

      document.documentElement.style.setProperty(
        "--app-height",
        `${window.innerHeight}px`
      );

    };

    setAppHeight();

    window.addEventListener(
      "resize",
      setAppHeight
    );

    return () => {

      window.removeEventListener(
        "resize",
        setAppHeight
      );

    };

  }, []);

  // =========================================================
  // PWA
  // =========================================================

  useEffect(() => {

    const standalone =
      window.matchMedia(
        "(display-mode: standalone)"
      ).matches ||
      window.navigator.standalone === true;

    if (standalone) {

      console.log(
        "📱 Vita está ejecutándose como PWA"
      );

      setIsInstalled(true);

    } else {

      console.log(
        "🌐 Vita está ejecutándose en navegador"
      );

    }

    const handleBeforeInstallPrompt = (
      event
    ) => {

      console.log(
        "🔥 beforeinstallprompt DISPARADO"
      );

      event.preventDefault();

      setDeferredPrompt(event);

    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );

    return () => {

      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );

    };

  }, []);

  // =========================================================
  // REINTENTAR MANUALMENTE
  // =========================================================

  const retryConnection = async () => {

    console.log(
      "🔄 Reintentando conexión manualmente..."
    );

    setRetryingConnection(true);

    const connected =
      await checkConnection();

    if (connected) {

      window.location.reload();

    }

    setRetryingConnection(false);

  };

  // =========================================================
  // CONTROL DEL LOADER
  // =========================================================

  useEffect(() => {

    if (!contentReady) return;

    if (loadingFinishedRef.current) {
      return;
    }

    const elapsed =
      performance.now() -
      startTimeRef.current;

    const remaining =
      Math.max(
        0,
        3000 - elapsed
      );

    const timer = setTimeout(() => {

      if (
        loadingFinishedRef.current
      ) {
        return;
      }

      requestAnimationFrame(() => {

        requestAnimationFrame(() => {

          loadingFinishedRef.current =
            true;

          setShowLoading(false);

        });

      });

    }, remaining);

    return () => {

      clearTimeout(timer);

    };

  }, [contentReady]);

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <>

      {/* =====================================================
          SIN CONEXIÓN
          ===================================================== */}

      {connectionError && !showLoading && (

        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,

            display: "flex",
            flexDirection: "column",

            justifyContent: "center",
            alignItems: "center",

            width: "100vw",
            height: "100vh",

            padding: "2rem",
            boxSizing: "border-box",

            textAlign: "center",

            backgroundColor: "#7f5af0",
          }}
        >

          <div
            className="Bobbleboddy-font"
            style={{
              fontSize: "2.5em",
              marginBottom: "1rem",
            }}
          >
            Sin conexión
          </div>

          <p
            style={{
              maxWidth: "400px",
              marginBottom: "1.5rem",
            }}
          >
            Vita necesita conexión con el servidor
            para funcionar.
          </p>

          <button
            onClick={retryConnection}
            style={{
              cursor: "pointer",
            }}
          >
            {retryingConnection
              ? "Comprobando..."
              : "Reintentar conexión"}
          </button>

        </div>

      )}

      {/* =====================================================
          APLICACIÓN
          ===================================================== */}

      {!connectionError &&
        isInstalled &&
        dataLoaded && (

          <Router basename="/Vita">

            <Routes>

              <Route
                path="/"
                element={
                  <BooksList
                    subjects={subjects}
                    books={books}
                  />
                }
              />

              <Route
                path="/book/:bookId/chapter/:chapterId"
                element={<ChapterPage />}
              />

              <Route
                path="/game/:subjectId/:moduleSlug"
                element={<GamePage />}
              />

            </Routes>

          </Router>

        )}

      {/* =====================================================
          INSTALACIÓN
          ===================================================== */}

      {!connectionError &&
        !isInstalled &&
        !showLoading && (

          <InstallPage
            deferredPrompt={deferredPrompt}
          />

        )}

      {/* =====================================================
          LOADING
          ===================================================== */}

      {showLoading &&
        !connectionError && (

          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,

              display: "flex",
              flexDirection: "column",

              justifyContent: "center",
              alignItems: "center",

              width: "100vw",
              height: "100vh",

              backgroundColor: "#7f5af0",
            }}
          >

            <div
              className="Bobbleboddy-font"
              style={{
                margin: "0",
                maxWidth: "3.5em",
                fontSize: "2.5em",
              }}
            >
              Vita
            </div>

          </div>

        )}

    </>
  );
}
