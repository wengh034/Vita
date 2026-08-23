import {
  useState,
  useEffect,
  useRef,
} from "react";

import {
  getChapterMeta,
  getAnsweredQuestions,
  addUserATP,
  getWrongAnsweredIds,
} from "../progress";

import SVGComponent from "./SvgComponent";
import { useNavigate } from "react-router-dom";
import Toast from "./Toast";

export default function ChaptersList({
  bookId = 1,
  onSelectChapter,
  onReady,
}) {
  const [chapters, setChapters] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const navigate = useNavigate();

  const [
    showCompletedModal,
    setShowCompletedModal,
  ] = useState(false);

  const [
    selectedChapter,
    setSelectedChapter,
  ] = useState(null);

  /* =========================================================
     TOAST
     ========================================================= */

  const [toastOpen, setToastOpen] =
    useState(false);

  const [toastMessage, setToastMessage] =
    useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setToastOpen(false);

    requestAnimationFrame(() => {
      setToastOpen(true);
    });
  };

  /* =========================================================
     READY
     ========================================================= */

  const readySentRef = useRef(false);

  /* =========================================================
     CALCULAR PROGRESO
     ========================================================= */

  async function calculateProgress(
    chapterId
  ) {
    try {
      const meta =
        await getChapterMeta(chapterId);

      const answered =
        await getAnsweredQuestions(
          chapterId
        );

      if (!meta || !meta.total) {
        return 0;
      }

      return Math.round(
        (answered.length /
          meta.total) *
          100
      );
    } catch (err) {
      console.error(
        `Error calculando progreso para capítulo ${chapterId}:`,
        err
      );

      return 0;
    }
  }

  /* =========================================================
     COMENZAR CAPÍTULO
     ========================================================= */

  async function handleStartChapter(ch) {
    const ok = await addUserATP(-5);

    if (!ok) {
      showToast(
        "No tienes suficiente ATP"
      );

      return;
    }

    onSelectChapter(ch);
  }

  /* =========================================================
     CARGAR CAPÍTULOS
     ========================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadChapters = async () => {
      setLoading(true);

      try {
        const res =
          await fetch(
            `/api/books/${bookId}/chapters`
          );

        if (!res.ok) {
          throw new Error(
            `Error HTTP: ${res.status}`
          );
        }

        const allChapters =
          await res.json();

        /*
         * Calcular todos los progresos.
         */
        const chaptersWithProgress =
          await Promise.all(
            allChapters.map(
              async (ch) => ({
                ...ch,

                progress:
                  await calculateProgress(
                    ch.idChapter
                  ),
              })
            )
          );

        if (cancelled) {
          return;
        }

        setChapters(
          chaptersWithProgress
        );
      } catch (err) {
        if (!cancelled) {
          console.error(
            "Error cargando capítulos:",
            err
          );

          /*
           * En caso de error también
           * permitimos continuar.
           */
          setChapters([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadChapters();

    return () => {
      cancelled = true;

      /*
       * Si cambia de libro, permitimos que
       * el nuevo libro vuelva a avisar cuando
       * esté listo.
       */
      readySentRef.current = false;
    };
  }, [bookId]);

  /* =========================================================
     AVISAR DESPUÉS DEL RENDER
     ========================================================= */

  useEffect(() => {
    if (loading) {
      return;
    }

    if (readySentRef.current) {
      return;
    }

    /*
     * El useEffect ocurre después del commit
     * de React.
     *
     * Añadimos un requestAnimationFrame para darle
     * al navegador la oportunidad de procesar
     * el siguiente frame.
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
    loading,
    chapters,
    onReady,
  ]);

  /* =========================================================
     PREGUNTAS INCORRECTAS
     ========================================================= */

  const handleWrongQuestions =
    async (chapter) => {
      const wrongIds =
        await getWrongAnsweredIds({
          idBook: Number(bookId),
          idChapter:
            chapter.idChapter,
        });

      if (wrongIds.length === 0) {
        showToast(
          "No hay preguntas para repasar"
        );

        return;
      }

      navigate(
        `/book/${bookId}/chapter/${chapter.idChapter}`,
        {
          state: {
            mode: "wrong",
          },
        }
      );
    };

  /* =========================================================
     LOADING
     ========================================================= */

if (loading) {
  return (
    <div
      className="chapters-container"
      style={{
        width: "100%",
        marginTop: "2.5rem",
        padding: "0.5rem",
        boxSizing: "border-box",
        minHeight: "489px",
      }}
    >
      <div
        style={{
          textAlign: "center",
          fontStyle: "italic",
        }}
      >
        Cargando capítulos...
      </div>
    </div>
  );
}

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <>
      <div
        className="chapters-container"
        style={{
          width: "100%",
          marginTop: "2.5rem",
          display: "flex",
          gap: "0.5rem",
          padding: "0.5rem",
          flexDirection: "column",
          // height: "100%",
          maxHeight: "100vh",
          alignItems: "center",
          boxSizing: "border-box",
          backgroundColor: "#F6F9FC",
        }}
      >

        {chapters.map((ch) => {

          const pct =
            ch.progress || 0;

          const isCompleted =
            pct === 100;

          return (
            <div
              key={ch.idChapter}
              style={{
                display: "flex",
                alignItems: "stretch",
                width: "60%",
                maxWidth: "15rem",
                minWidth: "8rem",
              }}
            >

              {/* =================================================
                  BOTÓN CAPÍTULO
                  ================================================= */}

              <button
                className="chapter-btn"
                style={{
                  flex: 1,
                  padding: "1rem",
                  backgroundColor:
                    pct === 100
                      ? "#94a1b2"
                      : "#2cb67d",
                  color: "#fffffe",
                  border: "none",
                  borderRadius:
                    "8px 0 0 8px",
                  cursor: "pointer",
                  textAlign: "left",
                  boxShadow:
                    "0 4px 6px hsla(0, 0%, 0%, 0.2)",
                }}
                onClick={() => {

                  if (pct === 100) {

                    setSelectedChapter(ch);
                    setShowCompletedModal(
                      true
                    );

                  } else {

                    handleStartChapter(ch);

                  }

                }}
              >

                <div
                  style={{
                    fontWeight: "bold",
                    marginBottom: "0.4rem",
                  }}
                >
                  {ch.chapter}
                </div>

                {pct === 100 ? (

                  <div
                    style={{
                      fontSize: "0.9rem",
                    }}
                  >
                    Completado al 100%
                  </div>

                ) : (

                  <>

                    <div
                      style={{
                        width: "100%",
                        height: "8px",
                        backgroundColor:
                          "rgba(127, 90, 240, 0.3)",
                        borderRadius: "4px",
                        overflow: "hidden",
                      }}
                    >

                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          backgroundColor:
                            "#7f5af0",
                        }}
                      />

                    </div>

                    <div
                      style={{
                        fontSize: "0.8rem",
                        opacity: 0.9,
                        marginTop: "0.3rem",
                      }}
                    >
                      {pct}% completado
                    </div>

                  </>

                )}

              </button>

              {/* =================================================
                  BOTÓN WRONG
                  ================================================= */}

              <button
                style={{
                  backgroundColor:
                    isCompleted
                      ? "#7f5af0"
                      : "#6f4ea1",

                  opacity:
                    isCompleted
                      ? 1
                      : 0.6,

                  padding: "0.5rem",
                  width: "20%",
                  border: "none",
                  color: "#fff",
                  borderRadius:
                    "0 8px 8px 0",
                  cursor: "pointer",
                }}
                onClick={() => {

                  if (!isCompleted) {

                    showToast(
                      "Para repasar, completa el capítulo."
                    );

                    return;
                  }

                  handleWrongQuestions(ch);

                }}
              >

                <SVGComponent
                  src="/src/assets/icons/format_quote.svg"
                  size="1.5rem"
                />

              </button>

            </div>
          );
        })}

      </div>

      {/* =====================================================
          MODAL
          ===================================================== */}

      {showCompletedModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor:
              "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >

          <div
            style={{
              backgroundColor: "#fffffe",
              color: "#252529",
              padding: "1.5rem",
              borderRadius: "8px",
              width: "90%",
              maxWidth: "320px",
              textAlign: "center",
            }}
          >

            <span
              onClick={() =>
                setShowCompletedModal(
                  false
                )
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.2rem",
                marginBottom: "0.5rem",
                cursor: "pointer",
              }}
            >
              <span className="material-symbols-outlined">
                arrow_back
              </span>
            </span>

            <h3>
              Capítulo completado
            </h3>

            <p>
              Ya completaste este capítulo.
              ¿Quieres reiniciar el capítulo?
            </p>

            <button disabled>
              Reiniciar (próximamente)
            </button>

          </div>

        </div>
      )}

      {/* =====================================================
          TOAST
          ===================================================== */}

      <Toast
        open={toastOpen}
        setOpen={setToastOpen}
        message={toastMessage}
      />

    </>
  );
}