import React, { useEffect, useRef, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { initUserStats, syncChaptersMeta } from "./progress";
import { validateStreak } from "./streakValidation.js";

import BooksList from "./components/BooksList.jsx";
import ChapterPage from "./components/ChapterPage.jsx";
import GamePage from "./components/GamePage.jsx";

import "./App.css";
import "./responsive.css";

export default function App() {
  const [dataLoaded, setDataLoaded] = useState(false);
  const [contentReady, setContentReady] = useState(false);
  const [showLoading, setShowLoading] = useState(true);

  const [subjects, setSubjects] = useState([]);
  const [books, setBooks] = useState([]);
  const [serverDate, setServerDate] = useState(null);

  const startTimeRef = useRef(performance.now());
  const loadingFinishedRef = useRef(false);

  /* =========================================================
     INICIALIZAR STATS
     ========================================================= */

  useEffect(() => {
    initUserStats();
    syncChaptersMeta();
  }, []);

  /* =========================================================
     FECHA DEL SERVIDOR
     ========================================================= */

  useEffect(() => {
    fetch("/api/server-date")
      .then((res) => res.json())
      .then((data) => setServerDate(data.date))
      .catch((err) =>
        console.error(
          "Error obteniendo fecha del servidor",
          err
        )
      );
  }, []);

  /* =========================================================
     VALIDAR RACHA
     ========================================================= */

  useEffect(() => {
    if (!serverDate) return;

    validateStreak(serverDate);
  }, [serverDate]);

  /* =========================================================
     CONFIGURACIÓN INICIAL + DATOS
     ========================================================= */

  useEffect(() => {
    let cancelled = false;

    if ("serviceWorker" in navigator) {
      const registerSW = () => {
        navigator.serviceWorker
          .register("/service-worker.js")
          .then(() =>
            console.log(
              "Service Worker registrado ✅"
            )
          )
          .catch((err) =>
            console.error(
              "Error registrando SW ❌",
              err
            )
          );
      };

      if (document.readyState === "complete") {
        registerSW();
      } else {
        window.addEventListener(
          "load",
          registerSW,
          { once: true }
        );
      }
    }

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
        const [subjectsData, booksData] =
          await Promise.all([
            fetch(
              "/api/matters"
            ).then((res) => res.json()),

            fetch(
              "/api/books"
            ).then((res) => res.json()),
          ]);

        if (cancelled) return;

        setSubjects(subjectsData);
        setBooks(booksData);

        /*
         * MUY IMPORTANTE:
         *
         * El contenido empieza a montarse AHORA.
         * No esperamos los 3 segundos.
         */
        setDataLoaded(true);
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

  /* =========================================================
     CONTROL DEL LOADER
     ========================================================= */

  useEffect(() => {
    if (!contentReady) return;
    if (loadingFinishedRef.current) return;

    const elapsed =
      performance.now() -
      startTimeRef.current;

    const remaining =
      Math.max(0, 3000 - elapsed);

    const timer = setTimeout(() => {
      if (loadingFinishedRef.current) {
        return;
      }

      /*
       * Dos frames:
       *
       * Frame 1 → React/DOM puede actualizarse
       * Frame 2 → navegador tiene oportunidad de pintar
       */
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          loadingFinishedRef.current = true;
          setShowLoading(false);
        });
      });
    }, remaining);

    return () => {
      clearTimeout(timer);
    };
  }, [contentReady]);

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <>
      {dataLoaded && (
        <Router>
          <Routes>
            <Route
              path="/"
              element={
                <BooksList
                  subjects={subjects}
                  books={books}
                  onReady={() =>
                    setContentReady(true)
                  }
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
              backgroundColor: "green",
            }}
          >
            Vita
          </div>
        </div>
      )}
    </>
  );
}