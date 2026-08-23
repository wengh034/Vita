import { useState, useEffect } from 'react';
import GameRenderer from './GamesRenderer';
import { apiFetch } from '../config/api.js';

const SubjectPage = ({ subjectId }) => {
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);

  useEffect(() => {
    apiFetch(`/modules/${subjectId}`)
      .then(res => res.json())
      .then(data => setModules(data));
      console.log(data)
  }, [subjectId]);

  return (
    <div>
      <h2>Módulos interactivos</h2>
      <ul>
        {modules.map(mod => (
          <li key={mod.idInteractive_modules}>
            <button onClick={() => setSelectedModule(mod)}>
              console.log(mod)
              {mod.title}
            </button>
          </li>
        ))}
      </ul>

      {selectedModule && <GameRenderer module={selectedModule} />}
    </div>
  );
};