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
import OfflinePage from "./components/offlinePage.jsx";

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

    return true;

  } catch (err) {

    console.error(
      "❌ Backend no disponible:",
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

  const startApp = async () => {

    console.log("🚀 Iniciando Vita...");

    // -------------------------------------------------------
    // 1. COMPROBAR BACKEND
    // -------------------------------------------------------

    const connected = await checkConnection();

    if (cancelled) return;

    if (!connected) {

      console.log(
        "🔴 Vita iniciada sin conexión con el backend"
      );

      setConnectionError(true);

      return;
    }

    // -------------------------------------------------------
    // 2. CARGAR DATOS
    // -------------------------------------------------------

    try {

      console.log("📦 Cargando datos iniciales...");

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

      console.log("📚 Datos iniciales cargados");

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

      // -----------------------------------------------------
      // 4. STATS LOCALES
      // -----------------------------------------------------

      await initUserStats();

      if (cancelled) return;

      // -----------------------------------------------------
      // 5. SINCRONIZAR METADATA
      // -----------------------------------------------------

      await syncChaptersMeta();

      if (cancelled) return;

      // -----------------------------------------------------
      // 6. LISTO
      // -----------------------------------------------------

      setContentReady(true);

      console.log("🚀 Vita lista");

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

  startApp();

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

        <div>
          <OfflinePage/>
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
