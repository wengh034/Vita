import { useEffect, useState } from "react";
import OxidationMatchSection from "./NoxMatchSection";
import { addUserATP } from "../../progress";

export default function OxidationMatchGame({ config, atpReward = 3 }) {
  const [currentRoundItems, setCurrentRoundItems] = useState([]);
  const [finished, setFinished] = useState(false);
  const [atpGained, setAtpGained] = useState(0);
  const [rewardGiven, setRewardGiven] = useState(false);

  // Función para mezclar un array de forma aleatoria (Fisher-Yates) y tomar N elementos
  const getRandomItems = (itemsArray, count = 10) => {
    const shuffled = [...itemsArray].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  };

  // Inicializar la partida con 10 elementos al azar
  useEffect(() => {
    if (config?.items) {
        // Aquí cambiamos el número de elementos que quiero renderizar 
      setCurrentRoundItems(getRandomItems(config.items, 8));
    }
  }, [config]);

  const isFinished = finished;

  if (!config?.items || config.items.length === 0) {
    return <div style={{ color: "#000", textAlign: "center" }}>No hay elementos configurados en el JSON</div>;
  }

  if (isFinished) {
    return (
      <div style={{ textAlign: "center", color: "#000" }}>
        <h2>¡Juego completado! 🎉</h2>
        <h3>+{atpGained} ATP ⚡</h3>
        <button 
          onClick={() => {
            // Reiniciar con otros 10 elementos al azar
            setCurrentRoundItems(getRandomItems(config.items, 10));
            setFinished(false);
            setRewardGiven(false);
          }}
          style={{ padding: "0.5rem 1rem", cursor: "pointer", marginTop: "1rem" }}
        >
          Volver a jugar
        </button>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ color: "#000", textAlign: "center" }}>
        Parea el Símbolo con su Número de Oxidación
      </h3>

      <OxidationMatchSection
        key={currentRoundItems.map(i => i.symbol).join()}
        items={currentRoundItems}
        onComplete={async () => {
          if (!rewardGiven) {
            await addUserATP(atpReward);
            setAtpGained(atpReward);
            setRewardGiven(true);
          }
          setFinished(true);
        }}
      />
    </div>
  );
}