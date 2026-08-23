import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { updateQuestion, updateChapterProgress, getQuestions, saveQuestionsMerge } from "../db";
import QuizFeedback from "./QuizFeedback";

export default function ChapterPage() {
  const { bookId, chapterId: chapterIdParam } = useParams();
  const chapterId = Number(chapterIdParam); // ✅ conversión inmediata

  const [showQuizFeedback, setShowQuizFeedback] = useState(false);
  const [quizStartTime, setQuizStartTime] = useState(Date.now());

  const [chapterState, setChapterState] = useState({
    data: null,
    questions: [],
    index: 0,
  });

  // para los botones de respuesta
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [answerSelected, setAnswerSelected] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  useEffect(() => {
    setQuizStartTime(Date.now());
    let active = true;

    async function loadChapter() {
      try {
        const storedQuiz = localStorage.getItem(`quiz-${chapterId}`);
        let json, selected;

        if (storedQuiz) {
          console.log(`📦 Cargando quiz existente para capítulo ${chapterId}`);
          const parsed = JSON.parse(storedQuiz);
          json = parsed.data;
          selected = parsed.questions || [];
        } else {
          console.log(`🌐 Cargando nuevo quiz desde /karp-cap${chapterId}.json`);

          const res = await fetch(`/karp-cap${chapterId}.json`);
          if (!res.ok) {
            console.error("❌ No se pudo cargar el archivo JSON:", `/karp-cap${chapterId}.json`);
            return;
          }

          json = await res.json();
          await saveQuestionsMerge(json); // fusionamos primero con la DB

          // 🔹 Recuperamos preguntas actualizadas desde IndexedDB
          const allQuestions = await getQuestions(Number(chapterId));

          // 🔹 Solo pendientes
          const pending = allQuestions.filter(q => q.status === "pending");

          if (pending.length === 0) {
            console.log("🎉 No quedan preguntas pendientes en este capítulo");
            setShowQuizFeedback(true);
            return;
          }

          // 🔹 Seleccionamos 3 (o menos si hay menos)
          const shuffled = pending.sort(() => Math.random() - 0.5);
          const selectedSubset = shuffled.slice(0, 3);

          localStorage.setItem(`quiz-${chapterId}`, JSON.stringify({
            data: json,
            questions: selectedSubset,
          }));

          selected = selectedSubset;
        }

        if (!active) return;

        setChapterState({
          data: json,
          questions: selected,
          index: 0,
        });
        setAnswerSelected(false);
        setFeedback("");
        setSelectedIndex(null);

        // Ahora recuperamos TODAS las preguntas del capítulo desde IndexedDB
        const savedQuestions = await getQuestions(Number(chapterId));
        console.log("📘 Todas las preguntas del capítulo", chapterId, savedQuestions);

        // Contamos respondidas (status distinto a "pending")
        const answeredCount = savedQuestions.filter(
          (q) => q.status === "correct" || q.status === "incorrect"
        ).length;
        const total = savedQuestions.length;
        const progress = total > 0 ? Math.round((answeredCount / total) * 100) : 0;

        console.log(`✅ Respondidas: ${answeredCount} de ${total}`);
        console.log(`📊 Progreso calculado: ${progress} (${answeredCount}/${total})`);

        await updateChapterProgress(Number(chapterId), progress);
      } catch (error) {
        console.error("💥 Error cargando el capítulo:", error);
      }
    }

    loadChapter();
    return () => { active = false; };
  }, [chapterId]);

  const { data, questions, index } = chapterState;
  const currentQuestion = questions[index];

  if (!data || questions.length === 0) return <p>Cargando preguntas...</p>;

  const finishQuiz = async (finishedQuestions) => {
    try {
      for (const q of finishedQuestions) {
        await updateQuestion({
          ...q,
          idChapter: Number(chapterId),
        });
      }

      const allQuestions = await getQuestions(Number(chapterId));

      console.log("📘 Todas las preguntas del capítulo", chapterId, allQuestions);

      const answered = allQuestions.filter(q => q.status !== "pending").length;
      const total = allQuestions.length;
      const progress = total > 0 ? Math.round((answered / total) * 100) : 0;

      console.log("📊 Progreso calculado:", progress, `(${answered}/${total})`);

      await updateChapterProgress(Number(chapterId), progress);

      localStorage.removeItem(`quiz-${chapterId}`);
      setShowQuizFeedback(true);
    } catch (err) {
      console.error("Error guardando resultados:", err);
    }
  };

  const handleSelectAnswer = (idx) => {
    if (!answerSelected) {
      setSelectedIndex(idx);
    }
  };

  const handleAccept = () => {
    if (selectedIndex === null) return;

    setAnswerSelected(true);

    const isCorrect = selectedIndex === currentQuestion.correct;
    const newStatus = isCorrect ? "correct" : "incorrect";

    const updatedQuestions = questions.map((q, i) =>
      i === index ? { ...q, status: newStatus } : q
    );

    setChapterState({ ...chapterState, questions: updatedQuestions });
    setFeedback(isCorrect ? "¡Correcto!" : currentQuestion.explanation);
    setShowFeedbackModal(true);
  };

  const handleNextFromModal = () => {
    setShowFeedbackModal(false);
    if (index + 1 < questions.length) {
      setChapterState({ ...chapterState, index: index + 1 });
      setSelectedIndex(null);
      setAnswerSelected(false);
      setFeedback("");
    } else {
      finishQuiz(chapterState.questions);
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
            alignItems: "center",
            gap: "0.2rem",
            margin: "0.5rem 0.5rem",
          }}
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
      )}

      {showQuizFeedback ? (
        <QuizFeedback
          questions={chapterState.questions}
          startTime={quizStartTime}
          onClose={() => {
            setShowQuizFeedback(false);
          }}
        />
      ) : (
        <div className="quiz-container">
          <div
            className="ilustration"
            style={{
              flex: 1,
              height: "8rem",
              alignItems: "center",
              justifyContent: "center",
              display: "flex",
              color: "#1a1a1a",
            }}
          >
            * ilustración *
          </div>

          {currentQuestion ? (
            <div className="quiz-box">
              <div className="question-box">{currentQuestion.quest}</div>

              <div className="answers-container">
                {currentQuestion.answers.map((ans, idx) => (
                  <button
                    key={idx}
                    className={`answer-btn ${
                      answerSelected
                        ? idx === currentQuestion.correct
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
                    {ans}
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
                <div className="feedback-modal">
                  <div>
                    <h2>
                      {selectedIndex === currentQuestion.correct
                        ? "¡Correcto!"
                        : "¡Incorrecto!"}
                    </h2>
                    <p>{currentQuestion.explanation}</p>
                  </div>

                  <button onClick={handleNextFromModal}>Continuar</button>
                </div>
              )}
            </div>
          ) : (
            <p>No hay preguntas disponibles</p>
          )}
        </div>
      )}
    </div>
  );
}
