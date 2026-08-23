import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import AminoacidMatchGame from "./minigames/aminoacidMatch";

const componentMap = {
  match_symbol: AminoacidMatchGame,
};

export default function GamePage() {
  const { subjectId, moduleSlug } = useParams();

  const [module, setModule] = useState(null);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    fetch(`/api/modules/${subjectId}`)
      .then(res => res.json())
      .then(data => {
        const found = data.find(m => m.slug === moduleSlug);

        if (!found) return;

        setModule(found);

        try {
          const parsed = JSON.parse(found.config_json);
          // console.log("CONFIG:", parsed);
          setConfig(parsed);
        } catch (e) {
          console.error("config_json inválido:", e);
        }
      });
  }, [subjectId, moduleSlug]);

  if (!module || !config) return <p>Cargando...</p>;

  const Component = componentMap[module.component_type];

  if (!Component) {
    console.error("Tipo no soportado:", module.component_type);
    return <p>Tipo no soportado</p>;
  }

return <Component config={config} atpReward={module.atp_reward} />;
}