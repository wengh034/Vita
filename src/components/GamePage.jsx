import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import AminoacidMatchGame from "./minigames/aminoacidMatch";
import NoxMatchGame from "./minigames/NoxMatchGame";
import OxoanionMatchGame from "./minigames/oxoanionMatchGame.jsx";
import { apiFetch } from "../config/api.js";

const componentMap = {
  match_symbol: AminoacidMatchGame,
  match_nox: NoxMatchGame,
  match_oxoanion: OxoanionMatchGame,
};

export default function GamePage() {
  const { subjectId, moduleSlug } = useParams();

  const [module, setModule] = useState(null);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    apiFetch(`/modules/${subjectId}`)
      .then(res => res.json())
      .then(data => {
        const found = data.find(m => m.slug === moduleSlug);

        if (!found) return;

        setModule(found);

        try {
          const parsed = JSON.parse(found.config_json);
          setConfig(parsed);
        } catch (e) {
          console.error("config_json inválido:", e);
        }
      });
  }, [subjectId, moduleSlug]);

  // Pantalla de carga
  if (!module || !config) {
    return (
      <div className="game-loading">
        <span className="game-loader"></span>
      </div>
    );
  }

  const Component = componentMap[module.component_type];

  if (!Component) {
    console.error("Tipo no soportado:", module.component_type);
    return <p>Tipo no soportado</p>;
  }

  return <Component config={config} atpReward={module.atp_reward} />;
}