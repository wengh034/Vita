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
  // INICIALIZAR STATS
  // =========================================================

  useEffect(() => {
    initUserStats();
    syncChaptersMeta();
  }, []);

  // =========================================================
  // PWA
  // =========================================================

  useEffect(() => {

    // -------------------------------------------------------
    // Detectar si Vita YA está ejecutándose como PWA
    // -------------------------------------------------------

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

    // -------------------------------------------------------
    // beforeinstallprompt
    // -------------------------------------------------------

    const handleBeforeInstallPrompt = (
      event
    ) => {

      console.log(
        "🔥 beforeinstallprompt DISPARADO"
      );

      // Evita que el navegador muestre
      // automáticamente su propio aviso.

      event.preventDefault();

      // Guardamos el evento para que
      // InstallPage pueda utilizarlo.

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
  // FECHA DEL SERVIDOR
  // =========================================================

  useEffect(() => {

    apiFetch("/server-date")
      .then((res) => res.json())
      .then((data) => {

        setServerDate(data.date);

      })
      .catch((err) => {

        console.error(
          "Error obteniendo fecha del servidor",
          err
        );

      });

  }, []);

  // =========================================================
  // VALIDAR RACHA
  // =========================================================

  useEffect(() => {

    if (!serverDate) return;

    validateStreak(serverDate);

  }, [serverDate]);

  // =========================================================
  // CONFIGURACIÓN INICIAL + DATOS
  // =========================================================

  useEffect(() => {

    let cancelled = false;

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

    const loadData = async () => {

      try {

        const [
          subjectsData,
          booksData,
        ] = await Promise.all([

          apiFetch("/matters")
            .then((res) => res.json()),

          apiFetch("/books")
            .then((res) => res.json()),

        ]);

        if (cancelled) return;

        setSubjects(subjectsData);
        setBooks(booksData);

        setDataLoaded(true);

        // El loading ya no depende de BooksList.

        setContentReady(true);

      } catch (err) {

        console.error(
          "Error cargando datos iniciales",
          err
        );

        if (cancelled) return;

        setDataLoaded(true);
        setContentReady(true);

      }

    };

    loadData();

    return () => {

      cancelled = true;

      window.removeEventListener(
        "resize",
        setAppHeight
      );

    };

  }, []);

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
          APLICACIÓN
          ===================================================== */}

      {isInstalled && dataLoaded && (

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

      {!isInstalled && !showLoading && (

        <InstallPage
          deferredPrompt={deferredPrompt}
        />

      )}

      {/* =====================================================
          LOADING
          ===================================================== */}

      {showLoading && (

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