import { useEffect, useState } from "react";

export default function OxoanionMatchSection({ items, onComplete }) {
  const [left, setLeft] = useState([]);
  const [right, setRight] = useState([]);
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [selectedRight, setSelectedRight] = useState(null);
  
  const [matched, setMatched] = useState({});
  const [wrong, setWrong] = useState(null);

  const baseStyle = {
    padding: "0.75rem",
    backgroundColor: "#fff",
    color: "#000",
    border: "1px solid #ccc",
    borderRadius: "6px",
    cursor: "pointer",
    width: "100%",
    minHeight: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center"
  };

  useEffect(() => {
    if (!items?.length) return;

    const prepared = items.map((i, idx) => ({
      ...i,
      uniqueId: `${i.name}_${idx}`
    }));

    const shuffled = [...prepared].sort(() => Math.random() - 0.5);
    setLeft(shuffled);

    setRight(
      shuffled
        .map((i) => ({
          id: i.uniqueId,
          nox: i.nox,
          symbol: i.symbol
        }))
        .sort(() => Math.random() - 0.5)
    );

    setMatched({});
    setSelectedLeft(null);
    setSelectedRight(null);
    setWrong(null);
  }, [items]);

  const isRightMatched = (optId) =>
    Object.values(matched).includes(optId);

  useEffect(() => {
    if (!selectedLeft || !selectedRight) return;

    if (selectedLeft.nox === selectedRight.nox && selectedLeft.uniqueId === selectedRight.id) {
      setMatched(prev => ({
        ...prev,
        [selectedLeft.uniqueId]: selectedRight.id
      }));
    } else {
      setWrong({
        left: selectedLeft.uniqueId,
        right: selectedRight.id
      });

      setTimeout(() => setWrong(null), 400);
    }

    setSelectedLeft(null);
    setSelectedRight(null);
  }, [selectedLeft, selectedRight]);

  useEffect(() => {
    if (!left.length) return;

    if (Object.keys(matched).length === left.length) {
      setTimeout(onComplete, 400);
    }
  }, [matched, left, onComplete]);

  return (
    <div style={{ display: "flex", gap: "1rem", color: "#000", maxWidth: "600px", margin: "0 auto" }}>
      {/* Columna Izquierda: Nombre del Ión */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {left.map(item => {
          const isMatched = matched[item.uniqueId];

          return (
            <button
              key={item.uniqueId}
              disabled={isMatched}
              onClick={() => setSelectedLeft(item)}
              style={{
                ...baseStyle,
                backgroundColor: isMatched
                  ? "#b2f2bb"
                  : wrong?.left === item.uniqueId
                  ? "#ffc9c9"
                  : "#fff",
                opacity: isMatched ? 0.6 : 1
              }}
            >
              {item.name}
            </button>
          );
        })}
      </div>

      {/* Columna Derecha: Símbolo del Oxoanión */}
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
                  : wrong?.right === opt.id
                  ? "#ffc9c9"
                  : "#fff",
                opacity: disabled ? 0.6 : 1,
                fontWeight: "700"
              }}
            >
              {opt.symbol}
            </button>
          );
        })}
      </div>
    </div>
  );
}