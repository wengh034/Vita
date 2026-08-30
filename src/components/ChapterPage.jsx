import React, { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import QuizFeedback from "./QuizFeedback";
import {
  saveQuizAnswer,
  getAnsweredIds,
  getUserStats,
  initDB,
  getWrongAnsweredIds
} from "../progress";
import ReportButton from "./ReportButton";
import { apiFetch } from "../config/api.js";

export default function ChapterPage() {
  const [loadingAI, setLoadingAI] = useState(false);
  const [fetchError, setFetchError] = useState(false); // <--- Manejo de error de red

  const { bookId, chapterId: chapterIdParam } = useParams();
  const chapterId = Number(chapterIdParam);

  const [showQuizFeedback, setShowQuizFeedback] = useState(false);
  const [quizStartTime, setQuizStartTime] = useState(Date.now());
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [selectedIndex, setSelectedIndex] = useState(null);
  const [answerSelected, setAnswerSelected] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const location = useLocation();
  const mode = location.state?.mode ?? "normal";

  const loadQuestions = async () => {
    setFetchError(false);
    setQuizStartTime(Date.now());
    if (!chapterId) return;

    try {
      let body;

      if (mode === "wrong") {
        const wrongIds = await getWrongAnsweredIds({
          idBook: Number(bookId),
          idChapter: chapterId
        });

        console.log("IDs que salen de IndexedDB:", wrongIds);

        if (wrongIds.length === 0) {
          setShowQuizFeedback(true);
          return;
        }

        body = { include: wrongIds };
      } else {
        const answeredIds = await getAnsweredIds(chapterId);
        body = {
          exclude: answeredIds,
          limit: 3,
        };
      }

      const res = await apiFetch(
        `/chapters/${chapterId}/asks`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      const data = await res.json();

      if (data.length === 0) {
        setShowQuizFeedback(true);
        return;
      }

      setQuestions(data);
      setCurrentIndex(0);
    } catch (err) {
      console.error("Error cargando preguntas:", err);
      setFetchError(true);
    }
  };

  /* ---------- cargar preguntas ---------- */
  useEffect(() => {
    loadQuestions();
  }, [chapterId, mode]);

  if (fetchError) {
    return (
      <div className="game-loading" style={{ flexDirection: "column", gap: "1rem", textAlign: "center" }}>
        <p>Error de conexión al servidor.</p>
        <button onClick={loadQuestions} className="accept-btn">
          Reintentar
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  if (!currentQuestion) {
    return (
      <div className="game-loading">
        <span className="game-loader"></span>
      </div>
    );
  }

  const handleSelectAnswer = (idx) => {
    if (!answerSelected) setSelectedIndex(idx);
  };

  // /* ---------- comprobar respuesta ---------- */
  const handleAccept = async () => {
    if (selectedIndex === null) return;
    setAnswerSelected(true);

    const selectedAnswerObj = currentQuestion.answers[selectedIndex];

    if (!selectedAnswerObj || selectedAnswerObj.subId === undefined) {
      console.error("El objeto de respuesta no contiene 'subId':", selectedAnswerObj);
      return;
    }

    try {
      const res = await apiFetch(
        `/asks/${currentQuestion.idAsk}/check`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subId: selectedAnswerObj.subId })
        }
      );

      if (!res.ok) {
        throw new Error(`Error en check: status ${res.status}`);
      }

      const result = await res.json();

      setQuestions((prev) =>
        prev.map((q, i) =>
          i === currentIndex
            ? { ...q, status: result.correct ? 1 : 0 }
            : q
        )
      );

      await saveQuizAnswer({
        idBook: Number(bookId),
        idChapter: chapterId,
        idAsk: Number(currentQuestion.idAsk),
        status: result.correct ? 1 : 0,
      });

      if (result.correct) {
        setFeedback("¡Excelente respuesta!");
        setShowFeedbackModal(true);
      } else {
        setLoadingAI(true);
        setShowFeedbackModal(true);
        try {
          const aiRes = await apiFetch("/ai/explain-answer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              askId: currentQuestion.idAsk, 
              subId: selectedAnswerObj.subId 
            })
          });

          const aiData = await aiRes.json();

          if (aiData.errorCode === "QUOTA_EXCEEDED") {
            setFeedback("⚠️ [Error: Cuota de IA agotada]. Notifica al administrador para restablecer el servicio.");
          } else {
            setFeedback(aiData.explanation || "Opción incorrecta.");
          }
        } catch (aiErr) {
          console.error("Error al obtener explicación de IA:", aiErr);
          setFeedback("Opción incorrecta.");
        } finally {
          setLoadingAI(false);
        }
      }

    } catch (err) {
      console.error("Error en el proceso de aceptación:", err);
      setLoadingAI(false);
    }
  };

  const handleNextFromModal = () => {
    setShowFeedbackModal(false);
    setSelectedIndex(null);
    setAnswerSelected(false);
    setFeedback("");

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowQuizFeedback(true);
    }
  };

  return (
    <div className="ask-renderer">
      {!showQuizFeedback && (
        <Link
          to="/"
          className="back-link"
          style={{
            textDecoration: "none",
            color: "#1a1a1a",
            display: "flex",
            gap: "0.2rem",
            margin: "0.5rem",
          }}
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
      )}

      {showQuizFeedback ? (
        <QuizFeedback
          questions={questions}
          startTime={quizStartTime}
          onClose={() => setShowQuizFeedback(false)}
        />
      ) : (
        <div className="quiz-container">
          <div className="quiz-box">
            <div className="question-box">
              {currentQuestion.question}
            </div>

            <div className="answers-container">
              {currentQuestion.answers.map((ans, idx) => (
                <button
                  key={ans.subId}
                  className={`answer-btn ${
                    answerSelected
                      ? ans.is_correct
                        ? "correct"
                        : idx === selectedIndex
                        ? "incorrect"
                        : ""
                      : idx === selectedIndex
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => handleSelectAnswer(idx)}
                  disabled={answerSelected}
                >
                  {ans.answer}
                </button>
              ))}

              <button
                onClick={handleAccept}
                disabled={selectedIndex === null || answerSelected}
                className="accept-btn"
              >
                Comprobar
              </button>
            </div>

            {showFeedbackModal && (
              <div
                className="feedback-modal"
                style={{
                  backgroundColor: currentQuestion.answers[selectedIndex]?.is_correct
                    ? "#a5ed6e"
                    : "#ffb2b2",
                  color: currentQuestion.answers[selectedIndex]?.is_correct
                    ? "#27a745"
                    : "#ff4b4b",
                  padding: "1.5rem",
                  borderRadius: "8px",
                  textAlign: "center",
                }}
              >
                <div style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "flex-end",
                }}>
                <ReportButton
              questionId={currentQuestion.idAsk}
              questionText={currentQuestion.question}
              chapterId={chapterId}
              bookId={bookId}
              selectedSubId={selectedIndex !== null ? currentQuestion.answers[selectedIndex]?.subId : null}
              answers={currentQuestion.answers}
                />
                </div>
                <div>
                  <h2>
                    {currentQuestion.answers[selectedIndex]?.is_correct
                      ? "¡Correcto!"
                      : "¡Incorrecto!"}
                  </h2>

                  {loadingAI ? (
                    <p style={{ fontStyle: "italic", opacity: 0.8 }}>
                      Generando explicación según el Karp 8va ed... (esto puede tardar unos segundos)
                    </p>
                  ) : (
                    <p>{feedback}</p>
                  )}
                </div>

                <button
                  onClick={handleNextFromModal}
                  disabled={loadingAI}
                  style={{
                    backgroundColor: currentQuestion.answers[selectedIndex]?.is_correct
                      ? "#27a745"
                      : "#ff4b4b",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "0.6rem 1.2rem",
                    cursor: loadingAI ? "not-allowed" : "pointer",
                    marginTop: "1rem",
                    opacity: loadingAI ? 0.6 : 1,
                  }}
                >
                  Continuar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}