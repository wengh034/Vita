import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import OxoanionMatchSection from "./OxoanionMatchSection";
import { addUserATP } from "../../progress";

export default function OxoanionMatchGame({ config, atpReward = 3 }) {
  const navigate = useNavigate();

  const allItems = config?.items || [];
  const PAGE_SIZE = 8;

  const [pageIndex, setPageIndex] = useState(0);
  const totalPages = Math.ceil(allItems.length / PAGE_SIZE);

  const [finished, setFinished] = useState(false);
  const [atpGained, setAtpGained] = useState(0);
  const [rewardGiven, setRewardGiven] = useState(false);

  const isFinished = pageIndex >= totalPages;

  useEffect(() => {
    if (!isFinished || rewardGiven) return;

    const giveReward = async () => {
      try {
        await addUserATP(atpReward);
        setAtpGained(atpReward);
        setRewardGiven(true);
      } catch (err) {
        console.error("Error al otorgar ATP:", err);
      }
    };

    giveReward();
  }, [isFinished, rewardGiven, atpReward]);

  if (!allItems.length) {
    return <div style={{ color: "#fff", textAlign: "center" }}>No hay oxoaniones configurados en el JSON</div>;
  }

  if (isFinished || finished) {
    return (
      <div style={{ textAlign: "center", color: "#fff", padding: "2rem" }}>
        <h2>¡Juego completado! 🎉</h2>
        <h3 style={{ margin: "1rem 0" }}>+{atpGained} ATP ⚡</h3>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "1.5rem" }}>
          <button
            onClick={() => {
              setPageIndex(0);
              setFinished(false);
              setRewardGiven(false);
            }}
            style={{
              padding: "0.6rem 1.2rem",
              backgroundColor: "#7f5af0",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            Volver a jugar
          </button>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: "0.6rem 1.2rem",
              backgroundColor: "#e2e8f0",
              color: "#2d3748",
              border: "none",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            Salir
          </button>
        </div>
      </div>
    );
  }

  const start = pageIndex * PAGE_SIZE;
  const currentItems = allItems.slice(start, start + PAGE_SIZE);

  return (
    <div style={{ padding: "1rem", maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ background: "none", padding: "0", border: "none", cursor: "pointer", color: "#fff", display: "flex", alignItems: "center" }}
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
      </div>

      <h3 style={{ color: "#fff", textAlign: "center", marginBottom: "1.5rem", fontFamily: "Nunito, sans-serif" }}>
        Relaciona cada Nombre con su Fórmula
      </h3>

      <OxoanionMatchSection
        key={pageIndex}
        items={currentItems}
        onComplete={() => {
          if (pageIndex + 1 < totalPages) {
            setPageIndex(p => p + 1);
          } else {
            setFinished(true);
          }
        }}
      />

      <div style={{ textAlign: "center", marginTop: "1.2rem", color: "#fff", fontWeight: "bold" }}>
        {pageIndex + 1} / {totalPages}
      </div>
    </div>
  );
}