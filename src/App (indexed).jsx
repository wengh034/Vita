import React from "react";
import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import BooksList from "./components/BooksList (indexed).jsx";
import ChapterPage from "./components/ChapterPage (indexed).jsx";
import "./App.css";
import "./responsive.css";
import { saveBooks, saveChapters, saveQuestionsMerge, getBooks, getQuestions } from "./db.js";
import InstallAlert from "./components/installBtn.jsx";

export async function loadInitialDataIfEmpty() {
  const booksInDB = await getBooks();
  const anyQuestions = (await getQuestions(1)).length > 0; // ejemplo: primer capítulo

  if (booksInDB.length > 0 && anyQuestions) {
    console.log("📦 Datos ya cargados en IndexedDB, no se hace merge inicial");
    return;
  }

  console.log("🌐 Inicializando datos en IndexedDB...");
  const books = await fetch("/bookList.json").then(r => r.json());
  await saveBooks(books);

  const chapters = await fetch("/karp-chapters.json").then(r => r.json());
  await saveChapters(chapters);

  for (const ch of chapters) {
    const chapterData = await fetch(`/karp-cap${ch.idChapter}.json`).then(r => r.json());
    await saveQuestionsMerge(chapterData);
  }

  console.log("✅ Datos iniciales cargados en IndexedDB");
}


export default function App() {
    const [dataLoaded, setDataLoaded] = useState(false);
  useEffect(() => {
//  btn InstallAlert
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then(() => console.log("Service Worker registrado ✅"))
      .catch((err) => console.error("Error registrando SW ❌", err));
  });
}
// fin btn InstallAlert
    
    (async () => {
      // Espera a que los datos iniciales se carguen en IndexedDB
      await loadInitialDataIfEmpty();
      setDataLoaded(true);
    })();


     loadInitialDataIfEmpty();

    // Función para actualizar la altura real del viewport
    function setAppHeight() {
      document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    }

    setAppHeight(); // al cargar
    window.addEventListener('resize', setAppHeight); // al rotar o redimensionar

    // Cleanup
    return () => {
      window.removeEventListener('resize', setAppHeight);
    };
  }, []);

    if (!dataLoaded) {
    return (
      <div style={{ padding: "1rem", textAlign: "center", fontStyle: "italic" }}>
        Cargando...
      </div>
    );
  }

  return (
    <> 
    {/* <InstallAlert/> */}
    <Router>
      <Routes>
        <Route path="/" element={<BooksList />} />
        <Route path="/book/:bookId/chapter/:chapterId" element={<ChapterPage />} />
      </Routes>
    </Router>
    </>
  );
}
