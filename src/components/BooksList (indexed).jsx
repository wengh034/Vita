import React, { useEffect, useState } from "react";
import { saveBooks, getBooks, getBook } from "../db";
import ChaptersList from "./ChapterList (indexed)";
import { useNavigate } from "react-router-dom";

export default function BooksList() {
  const [books, setBooks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [bookData, setBookData] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  // Guardar materia cada vez que cambia
  useEffect(() => {
    if (selectedSubjectId != null) {
      localStorage.setItem("selectedSubjectId", selectedSubjectId);
    }
  }, [selectedSubjectId]);

  // Guardar libro cada vez que cambia
  useEffect(() => {
    if (selectedBookId != null) {
      localStorage.setItem("selectedBookId", selectedBookId);
    }
  }, [selectedBookId]);

  // Cargar subjects y books, y RESTAURAR selección guardada de forma coherente
  useEffect(() => {
    (async () => {
      // leer archivos
      const subjRes = await fetch("/subjects.json");
      const subjData = await subjRes.json();

      let stored = await getBooks();
      if (stored.length === 0) {
        const res = await fetch("/bookList.json");
        const json = await res.json();
        await saveBooks(json);
        stored = json;
      }

      // leer saved (lo hacemos aquí para decidir correctamente tras tener subjects y books)
      const savedSubjectId = localStorage.getItem("selectedSubjectId");
      const savedBookId = localStorage.getItem("selectedBookId");

      // Determinar initial subject/book coherentes:
      let initSubjectId = savedSubjectId ? Number(savedSubjectId) : subjData[0]?.idSubject || null;
      let initBookId = savedBookId ? Number(savedBookId) : null;

      // Si hay savedBookId, preferimos la materia que lo contiene (si existe)
      if (initBookId != null) {
        const subjectContaining = subjData.find(s => s.books.includes(Number(initBookId)));
        if (subjectContaining) {
          initSubjectId = subjectContaining.idSubject;
        } else {
          // si el libro guardado no existe en subjects, descartarlo
          initBookId = null;
        }
      }

      // Si no hay initBookId válido, seleccionamos primer libro de la materia inicial (si existe)
      if (initBookId == null && initSubjectId != null) {
        const booksOfSubject = stored.filter(b =>
          subjData.find(s => s.idSubject === initSubjectId)?.books.includes(b.idBook)
        );
        initBookId = booksOfSubject.length > 0 ? booksOfSubject[0].idBook : null;
      }

      // aplicar estados
      setSubjects(subjData);
      setBooks(stored);
      setSelectedSubjectId(initSubjectId);
      setSelectedBookId(initBookId);
    })();
  }, []);

  // Filtrar libros según materia
  const filteredBooks = books.filter((book) =>
    subjects.find((s) => s.idSubject === selectedSubjectId)?.books.includes(book.idBook)
  );

  // Si cambia materia: sólo cambiar libro si el libro actual NO pertenece a la nueva materia
  useEffect(() => {
    if (!selectedSubjectId) {
      // si no hay materia, limpiar libro
      setSelectedBookId(null);
      return;
    }

    // Si el libro actual pertenece, no hacer nada.
    const bookStillValid = filteredBooks.some(b => b.idBook === selectedBookId);
    if (!bookStillValid) {
      // seleccionar primer libro válido (si hay)
      setSelectedBookId(filteredBooks[0]?.idBook || null);
    }
    // NOTA: no forzamos selección si ya existe un libro válido (esto evita sobrescribir restorations)
  }, [selectedSubjectId, books, subjects]); // dependencias amplias para recalcular filteredBooks

  // Cargar datos del libro seleccionado
  useEffect(() => {
    if (selectedBookId != null) {
      (async () => {
        const data = await getBook(selectedBookId);
        setBookData(data);
      })();
    } else {
      setBookData(null);
    }
  }, [selectedBookId]);

  if (books.length === 0 || subjects.length === 0) return <p>Cargando libros...</p>;

  return (
    <div className="ask-renderer">
      <div className="app-header">
        <h4>vita</h4>
      </div>

      <div className="ask-content">
        {/* Dropdown de libros */}
        <div className="book-floating-label" style={{ overflow: "visible" }}>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            style={{
              all: "unset",
              cursor: "pointer",
              display: "inline-block",
              width: "100%",
              height: "100%",
            }}
          >
            {bookData ? bookData.name : "Seleccionar libro"}
          </button>

          {dropdownOpen && (
            <ul
              className="book-dropdown-list"
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                width: "100%",
                maxHeight: "12rem",
                overflow: "auto",
                marginTop: "0.4rem",
                borderRadius: "8px",
                boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
                zIndex: 1001,
                background: "rgba(0,100,0,1)",
                listStyle: "none",
                padding: "0.25rem",
              }}
            >
              {filteredBooks.map((b) => (
                <li key={b.idBook} style={{ marginBottom: "0.25rem" }}>
                  <button
                    onClick={() => {
                      setSelectedBookId(b.idBook);
                      setDropdownOpen(false);
                    }}
                    className={`books-btn ${
                      selectedBookId === b.idBook ? "selected" : ""
                    }`}
                    style={{ width: "100%" }}
                  >
                    {b.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Lista de capítulos */}
        {selectedBookId && (
          <ChaptersList
            bookId={selectedBookId}
            onSelectChapter={(chapter) => {
              navigate(`/book/${selectedBookId}/chapter/${chapter.idChapter}`);
            }}
          />
        )}
      </div>

      {/* 🔽 Ahora este bloque muestra materias */}
      <div className="books-btns-container">
        <div className="btns">
          {subjects.map((subject) => (
            <button
              key={subject.idSubject}
              className={`books-btn ${
                selectedSubjectId === subject.idSubject ? "selected" : ""
              }`}
              onClick={() => setSelectedSubjectId(subject.idSubject)}
            >
              {subject.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
