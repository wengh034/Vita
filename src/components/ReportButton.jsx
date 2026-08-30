import React from "react";
import { apiFetch } from "../config/api.js";

export default function ReportButton({ 
  questionId, 
  questionText, 
  chapterId, 
  bookId,
  selectedSubId,
  answers 
}) {

  const handleReport = async (e) => {
    // Evita cualquier propagación que altere el estado del quiz
    e.preventDefault(); 
    e.stopPropagation();

    try {
      // 1. Consulta el número desde la tabla SystemConfig vía API
      const res = await apiFetch("/config/support-phone");
      const data = await res.json();

      if (!data.phone) {
        alert("El canal de soporte no está configurado en este momento.");
        return;
      }

      // 2. Obtiene el texto de la opción seleccionada si la hay
      const selectedAnswerObj = answers?.find((a) => a.subId === selectedSubId);
      const selectedAnswerText = selectedAnswerObj ? selectedAnswerObj.answer : "Ninguna seleccionada";

      // 3. Formatea el mensaje con los metadatos
      const message = 
`🚨 *REPORTE DE PREGUNTA*
---------------------------
📚 *Libro ID:* ${bookId || 'N/A'}
📖 *Capítulo ID:* ${chapterId || 'N/A'}
❓ *Pregunta ID:* ${questionId}
📝 *Pregunta:* "${questionText}"
🔍 *Opción seleccionada (subId ${selectedSubId ?? 'N/A'}):* "${selectedAnswerText}"
---------------------------
💬 *Mi consulta/error:* `;

      // 4. Redirige de forma segura a WhatsApp en nueva pestaña
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${data.phone}?text=${encodedMessage}`;

      window.open(whatsappUrl, "_blank", "noopener,noreferrer");

    } catch (error) {
      console.error("Error obteniendo el número de soporte:", error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleReport}
      className="report-btn"
      style={{
        background: "transparent",
        border: "none",
        color: "#888",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: "0.3rem",
        fontSize: "0.85rem",
        padding: "0.3rem 0.6rem",
        borderRadius: "4px",
      }}
      title="Reportar esta pregunta por WhatsApp"
    >
      <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>
        flag
      </span>
      <span>Reportar error</span>
    </button>
  );
}