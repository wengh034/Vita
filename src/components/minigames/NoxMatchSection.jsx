import { useEffect, useState } from "react";

export default function OxidationMatchSection({ items, onComplete }) {
  const [left, setLeft] = useState([]);
  const [right, setRight] = useState([]);
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [selectedRight, setSelectedRight] = useState(null);
  
  // Guardaremos los IDs únicos de la derecha que ya fueron acertados (ej: { "Ca": "Mg_2" })
  const [matched, setMatched] = useState({});
  const [wrong, setWrong] = useState(null);

  const baseStyle = {
    padding: "0.75rem",
    backgroundColor: "#fff",
    color: "#000",
    border: "1px solid #ccc",
    borderRadius: "6px",
    cursor: "pointer",
    width: "100%"
  };

  // Mezclar los ítems al iniciar el grupo
  useEffect(() => {
    if (!items?.length) return;

    const shuffled = [...items].sort(() => Math.random() - 0.5);
    setLeft(shuffled);

    // Mapear los números de oxidación para la columna derecha de forma desordenada
    setRight(
      shuffled
        .map((i, idx) => ({
          id: i.symbol + "_" + idx,
          nox: i.nox
        }))
        .sort(() => Math.random() - 0.5)
    );

    setMatched({});
    setWrong(null);
  }, [items]);

  // ✅ Verificamos si ESTA tarjeta específica de la derecha ya fue usada
  const isRightMatched = (optId) =>
    Object.values(matched).includes(optId);

  // Lógica de validación cuando seleccionas ambos lados
  useEffect(() => {
    if (!selectedLeft || !selectedRight) return;

    // Si el texto del nox coincide, es correcto independientemente de cuál de los botones iguales tocó
    if (selectedLeft.nox === selectedRight.nox) {
      setMatched(prev => ({
        ...prev,
        [selectedLeft.symbol]: selectedRight.id // Guardamos el ID único del botón derecho usado
      }));
    } else {
      setWrong({
        left: selectedLeft.symbol,
        right: selectedRight.id // Usamos el ID para marcar el error en el botón correcto
      });

      setTimeout(() => setWrong(null), 400);
    }

    setSelectedLeft(null);
    setSelectedRight(null);
  }, [selectedLeft, selectedRight]);

  // Avanzar al siguiente grupo cuando se completen todos los pares de la pantalla actual
  useEffect(() => {
    if (!left.length) return;

    if (Object.keys(matched).length === left.length) {
      setTimeout(onComplete, 400);
    }
  }, [matched, left, onComplete]);

  return (
    <div style={{ display: "flex", gap: "2rem", color: "#000", maxWidth: "600px", margin: "0 auto" }}>
      {/* Columna Izquierda: Símbolo y Nombre */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {left.map(item => {
          const isMatched = matched[item.symbol];

          return (
            <button
              key={item.symbol}
              disabled={isMatched}
              onClick={() => setSelectedLeft(item)}
              style={{
                ...baseStyle,
                backgroundColor: isMatched
                  ? "#b2f2bb"
                  : selectedLeft?.symbol === item.symbol
                  ? "#d0ebff"
                  : wrong?.left === item.symbol
                  ? "#ffc9c9"
                  : "#fff"
              }}
            >
              <strong>{item.symbol}</strong> ({item.name})
            </button>
          );
        })}
      </div>

      {/* Columna Derecha: Números de Oxidación */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {right.map(opt => {
          const disabled = isRightMatched(opt.id);

          return (
            <button
              key={opt.id}
              disabled={disabled}
              onClick={() => setSelectedRight(opt)}
              style={{
                ...baseStyle,
                backgroundColor: disabled
                  ? "#b2f2bb"
                  : selectedRight?.id === opt.id
                  ? "#d0ebff"
                  : wrong?.right === opt.id
                  ? "#ffc9c9"
                  : "#fff"
              }}
            >
              {opt.nox}
            </button>
          );
        })}
      </div>
    </div>
  );
}