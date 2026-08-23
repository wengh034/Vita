import { useState, useEffect } from "react";
import { getChapters } from "../db";

export default function ChaptersList({ bookId = 1, onSelectChapter }) {
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true); // <-- estado de carga

  useEffect(() => {
    (async () => {
      setLoading(true);
      const allChapters = await getChapters(bookId);
      setChapters(allChapters);
      setLoading(false);
    })();
  }, [bookId]);

  if (loading) {
    return (
      <div
        style={{
          padding: "1rem",
          textAlign: "center",
          fontStyle: "italic",
          color: "#555",
        }}
      >
        Cargando capítulos...
      </div>
    );
  }

  return (
    <div
      className="chapters-container"
      style={{
        width: "100%",
        marginTop: "2rem",
        alignItems: "center",
        display: "flex",
        gap: "0.5rem",
        padding: "0.5rem",
        flexDirection: "column",
        height: "100%",        // ocupa toda la altura del contenedor padre
        maxHeight: "100vh",    // para móviles
        overflowY: "auto",     // activa scroll vertical
        boxSizing: "border-box" // asegura que padding no rompa altura
      }}
    >
      {chapters.map((ch) => {
        const pct = ch.progress || 0;

        return (
          <button
            key={ch.idChapter}
            className="chapter-btn"
            style={{
              // flex: 1,
              width: "50%",
              maxWidth: "15rem",
              minWidth: "8rem",
              padding: "1rem",
              // backgroundColor: "#4CAF50",
              backgroundColor:"#2cb67d",
              // color: "#1A1A1A",
              color: "#fffffe",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              textAlign: "left",
              boxShadow: "0 4px 6px 0 hsla(0, 0%, 0%, 0.2)",
            }}
            onClick={() => onSelectChapter(ch)}
          >
            <div style={{ fontWeight: "bold", marginBottom: "0.4rem" }}>
              {ch.chapterName}
            </div>

            {/* Barra de progreso */}
            <div
              style={{
                width: "100%",
                height: "8px",
                backgroundColor: "rgba(127, 90, 240, 0.3)",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: "100%",
                  backgroundColor: "#7f5af0",
                  transition: "width 0.3s ease",
                }}
              />
            </div>

            {/* Porcentaje numérico */}
            <div
              style={{
                fontSize: "0.8rem",
                opacity: 0.9,
                marginTop: "0.3rem",
              }}
            >
              {pct}% completado
            </div>
          </button>
        );
      })}
    </div>
  );
}
