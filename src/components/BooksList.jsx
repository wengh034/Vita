import React, {
  useEffect,
  useState,
  useRef,
} from "react";

import ChaptersList from "./ChaptersList";
import { useNavigate } from "react-router-dom";
import SVGComponent from "./SvgComponent";
import { getUserStats } from "../progress";
import GameRenderer from "./GamesRenderer";
import vitaLogo from "../assets/icons/vita-logo.svg";
import fireIcon from "../assets/icons/fire_2.svg";
import flashIcon from "../assets/icons/flash.svg";

export default function BooksList({
  subjects,
  books,
  onReady,
}) {
  const [selectedSubjectId, setSelectedSubjectId] =
    useState(null);

  const [selectedBookId, setSelectedBookId] =
    useState(null);

  const [selectedGame, setSelectedGame] =
    useState(null);

  const [stats, setStats] = useState(null);

  const [chaptersReady, setChaptersReady] =
    useState(false);

  const navigate = useNavigate();

  /*
   * Evita avisar a App más de una vez.
   */
  const readySentRef = useRef(false);

  /* =========================================================
     RESTAURAR SELECCIÓN
     ========================================================= */

  useEffect(() => {
    if (!subjects?.length || !books?.length) {
      return;
    }

    const savedSubjectId =
      localStorage.getItem(
        "selectedSubjectId"
      );

    const savedBookId =
      localStorage.getItem(
        "selectedBookId"
      );

    let initSubjectId = savedSubjectId
      ? Number(savedSubjectId)
      : subjects[0]?.idMatter;

    let initBookId = savedBookId
      ? Number(savedBookId)
      : null;

    /*
     * Si existe un libro guardado,
     * buscamos la materia que lo contiene.
     */
    if (initBookId != null) {
      const subjectContaining =
        subjects.find((subject) =>
          subject.books?.includes(initBookId)
        );

      if (subjectContaining) {
        initSubjectId =
          subjectContaining.idMatter;
      } else {
        initBookId = null;
      }
    }

    /*
     * Si no tenemos libro guardado,
     * buscamos el primero de la materia.
     */
    if (
      initBookId == null &&
      initSubjectId != null
    ) {
      const booksOfSubject =
        books.filter(
          (book) =>
            book.matter === initSubjectId
        );

      initBookId =
        booksOfSubject.length > 0
          ? booksOfSubject[0].idBook
          : null;
    }

    setSelectedSubjectId(initSubjectId);
    setSelectedBookId(initBookId);
  }, [subjects, books]);

  /* =========================================================
     STATS
     ========================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadStats = async () => {
      try {
        const s = await getUserStats();

        if (!cancelled) {
          setStats(s);
        }
      } catch (err) {
        console.error(
          "Error obteniendo estadísticas:",
          err
        );
      }
    };

    loadStats();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =========================================================
     GUARDAR MATERIA
     ========================================================= */

  useEffect(() => {
    if (selectedSubjectId != null) {
      localStorage.setItem(
        "selectedSubjectId",
        selectedSubjectId
      );
    }
  }, [selectedSubjectId]);

  /* =========================================================
     GUARDAR LIBRO
     ========================================================= */

  useEffect(() => {
    if (selectedBookId != null) {
      localStorage.setItem(
        "selectedBookId",
        selectedBookId
      );
    }
  }, [selectedBookId]);

  /* =========================================================
     FILTRAR LIBROS
     ========================================================= */

  const filteredBooks = books.filter(
    (book) =>
      book.matter === selectedSubjectId
  );

  /* =========================================================
     VALIDAR LIBRO SELECCIONADO
     ========================================================= */

  useEffect(() => {
    if (!selectedSubjectId) {
      setSelectedBookId(null);
      return;
    }

    const bookStillValid =
      filteredBooks.some(
        (book) =>
          book.idBook === selectedBookId
      );

    if (!bookStillValid) {
      setSelectedBookId(
        filteredBooks[0]?.idBook || null
      );
    }
  }, [
    selectedSubjectId,
    selectedBookId,
    filteredBooks,
  ]);

  /* =========================================================
     AVISAR CUANDO EL CONTENIDO PRINCIPAL ESTÁ LISTO
     ========================================================= */

  useEffect(() => {
    if (readySentRef.current) {
      return;
    }

    /*
     * Necesitamos como mínimo:
     *
     * - stats disponibles
     * - libro seleccionado
     * - capítulos listos
     */
    if (
      !stats ||
      !selectedBookId ||
      !chaptersReady
    ) {
      return;
    }

    /*
     * Esperamos un frame antes de avisar.
     *
     * Esto significa que BooksList ya tuvo
     * oportunidad de completar su render.
     */
    requestAnimationFrame(() => {
      if (readySentRef.current) {
        return;
      }

      readySentRef.current = true;

      if (onReady) {
        onReady();
      }
    });
  }, [
    stats,
    selectedBookId,
    chaptersReady,
    onReady,
  ]);

  /* =========================================================
     RENDER
     ========================================================= */

  if (
    !subjects?.length ||
    !books?.length
  ) {
    return null;
  }

  return (
    <div className="ask-renderer">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="app-header">

        <div className="app-header-h4-title">

          <SVGComponent
            src={vitaLogo}
            fillColor="#FDFEFE"
          />

          <div
            className="Bobbleboddy-font"
            style={{
              color: "#FDFEFE",
            }}
          >
            vita
          </div>

        </div>

        {/* =================================================
            STATS
            ================================================= */}

        {stats && (
          <div className="stats">

            <div
              className="racha-stat"
              style={{
                color:
                  stats.enthalpy > 0
                    ? "#f6722b"
                    : "#9ca3af",

                backgroundColor:
                  stats.enthalpy > 0
                    ? "rgba(246, 114, 43, 0.15)"
                    : "rgba(156, 163, 175, 0.15)",

                border:
                  `0.5px solid ${
                    stats.enthalpy > 0
                      ? "#f6722b"
                      : "#9ca3af"
                  }`,
              }}
            >

              <div className="header-svg">

                <SVGComponent
                  src={fireIcon}
                  size="0.9em"
                  strokeColor={
                    stats.enthalpy > 0
                      ? "#f6722b"
                      : "#9ca3af"
                  }
                  fillColor="none"
                />

              </div>

              <div>
                {stats.enthalpy}
              </div>

            </div>

            <div className="atp-stat">

              <div className="header-svg">

                <SVGComponent
                  src={flashIcon}
                  size="0.9em"
                  strokeColor="#7f5af0"
                  fillColor="#a684ff"
                />

              </div>

              <div>
                {stats.atp}
              </div>

            </div>

          </div>
        )}

      </div>

      {/* =====================================================
          CONTENIDO
          ===================================================== */}

      <div className="ask-content">

        <GameRenderer
          subjectId={selectedSubjectId}
          onSelectGame={(game) =>
            setSelectedGame(game)
          }
        />

        {selectedBookId && (
          <ChaptersList
            bookId={selectedBookId}
            onReady={() =>
              setChaptersReady(true)
            }
            onSelectChapter={(chapter) =>
              navigate(
                `/book/${selectedBookId}/chapter/${chapter.idChapter}`
              )
            }
          />
        )}

      </div>

      {/* =====================================================
          BOTONES DE MATERIAS
          ===================================================== */}

      <div className="books-btns-container">

        <div className="btns">

          {subjects.map((subject) => (

            <button
              key={subject.idMatter}
              className={
                `books-btn ${
                  selectedSubjectId ===
                  subject.idMatter
                    ? "selected"
                    : ""
                }`
              }
              onClick={() =>
                setSelectedSubjectId(
                  subject.idMatter
                )
              }
            >
              {subject.name}
            </button>

          ))}

        </div>

      </div>

    </div>
  );
}