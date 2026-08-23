import { useEffect, useState } from "react";
import MatchSection from "./MatchSection";
import { addUserATP } from "../../progress";

export default function AminoacidMatchGame({ config, atpReward = 3 }) {
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState(null);
  const [finished, setFinished] = useState(false);
  const [atpGained, setAtpGained] = useState(0);
  const [rewardGiven, setRewardGiven] = useState(false);

  const groupOrder =
    config?.group_order ||
    config?.groups?.map(g => g.id) ||
    [];

  const isFinished = index >= groupOrder.length;

  // ✅ ATP solo una vez
  useEffect(() => {
    if (!isFinished || rewardGiven) return;

    const giveReward = async () => {
      await addUserATP(atpReward);
      setAtpGained(atpReward);
      setRewardGiven(true);
      setFinished(true);
      console.log(`Usuario ganó ${atpReward} ATP por completar el juego`);
    };

    giveReward();
  }, [isFinished, rewardGiven, atpReward]);

  // 🟣 Pantalla inicial
  if (!mode) {
    return (
      <div style={{ textAlign: "center" }}>
        <h2 style={{ color: "#000" }}>Elegí el modo</h2>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <button onClick={() => setMode("one")}>1 letra</button>
          <button onClick={() => setMode("three")}>3 letras</button>
        </div>
      </div>
    );
  }

  if (!groupOrder.length) {
    return <div>No hay grupos configurados</div>;
  }

  // 🎉 Final
  if (finished) {
    return (
      <div style={{ textAlign: "center" }}>
        <h2>Juego completado 🎉</h2>
        <h3>+{atpGained} ATP ⚡</h3>

        <button
          onClick={() => {
            setIndex(0);
            setMode(null);
            setFinished(false);
            setRewardGiven(false);
          }}
        >
          Volver a jugar
        </button>
      </div>
    );
  }

  const groupId = groupOrder[index];
  const isEssentialMode = groupId === "esenciales";

  const group = config.groups.find(g => g.id === groupId);

  const items = isEssentialMode
    ? config.items
    : config.items.filter(item =>
        item.groups.includes(groupId)
      );

  const handleComplete = () => {
    setIndex(prev => prev + 1);
  };

  return (
    <div>
      <h3 style={{ color: "#000", textAlign: "center" }}>
        {group?.label}
      </h3>

      <p style={{ textAlign: "center", color: "#000" }}>
        Modo: {mode === "one" ? "1 letra" : "3 letras"}
      </p>

      <MatchSection
        key={groupId}
        items={items}
        letterMode={mode}
        modeType={isEssentialMode ? "essential" : "match"}
        onComplete={handleComplete}
      />

      <div style={{ textAlign: "center", marginTop: "1rem", color: "#000" }}>
        {index + 1} / {groupOrder.length}
      </div>
    </div>
  );
}