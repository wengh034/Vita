import { useEffect, useState } from "react";

export default function MatchSection({ items, letterMode, modeType, onComplete }) {
  const [left, setLeft] = useState([]);
  const [right, setRight] = useState([]);
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [selectedRight, setSelectedRight] = useState(null);
  const [matched, setMatched] = useState({});
  const [wrong, setWrong] = useState(null);
  const [answers, setAnswers] = useState({});
  const [shuffledItems, setShuffledItems] = useState([]);

  const baseStyle = {
    padding: "0.5rem",
    backgroundColor: "#fff",
    color: "#000",
    border: "1px solid #ccc",
    borderRadius: "6px",
    cursor: "pointer",
    width: "100%"
  };

  const getValue = (item) => {
    if (letterMode === "one") return item.oneLetter;
    if (letterMode === "three") return item.threeLetter;
    return item.oneLetter;
  };

  // 🔀 Shuffle UNA sola vez
  useEffect(() => {
    if (!items?.length) return;

    const shuffled = [...items].sort(() => Math.random() - 0.5);
    setShuffledItems(shuffled);

    if (modeType === "match") {
      const prepared = shuffled.map(item => ({
        ...item,
        value: getValue(item)
      }));

      setLeft(prepared);

      setRight(
        prepared
          .map((i, idx) => ({
            id: i.name + "_" + idx,
            value: i.value
          }))
          .sort(() => Math.random() - 0.5)
      );
    }

    setMatched({});
    setAnswers({});
  }, [items, modeType]);

  const isRightMatched = (value) =>
    Object.values(matched).includes(value);

  // 🔗 Match logic
  useEffect(() => {
    if (modeType !== "match") return;
    if (!selectedLeft || !selectedRight) return;

    if (selectedLeft.value === selectedRight.value) {
      setMatched(prev => ({
        ...prev,
        [selectedLeft.name]: selectedLeft.value
      }));
    } else {
      setWrong({
        left: selectedLeft.name,
        right: selectedRight.value
      });

      setTimeout(() => setWrong(null), 400);
    }

    setSelectedLeft(null);
    setSelectedRight(null);
  }, [selectedLeft, selectedRight, modeType]);

  // ✅ Complete match
  useEffect(() => {
    if (modeType !== "match") return;
    if (!left.length) return;

    if (Object.keys(matched).length === left.length) {
      setTimeout(onComplete, 400);
    }
  }, [matched, left, modeType]);

  // ✅ Complete essential (FIX CLAVE)
useEffect(() => {
  if (modeType !== "essential") return;
  if (!shuffledItems.length) return;

  // 🧠 total de esenciales reales
  const essentialTotal = shuffledItems.filter(item =>
    item.groups.includes("esenciales")
  ).length;

  // 🧠 esenciales correctamente identificados
  const correctEssentials = Object.entries(answers).filter(
    ([name, isCorrect]) => {
      const item = shuffledItems.find(i => i.name === name);
      return isCorrect && item.groups.includes("esenciales");
    }
  ).length;

  if (essentialTotal > 0 && correctEssentials === essentialTotal) {
    setTimeout(onComplete, 500);
  }
}, [answers, shuffledItems, modeType]);

  // 🟣 ESENCIALES (GRID 2 COLUMNAS)
  if (modeType === "essential") {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.5rem",
          color: "#000"
        }}
      >
        {shuffledItems.map(item => {
          const value = getValue(item);
          const isCorrect = item.groups.includes("esenciales");
          const userAnswer = answers[item.name];

          return (
            <button
              key={item.name}
              disabled={userAnswer !== undefined}
              onClick={() => {
                setAnswers(prev => ({
                  ...prev,
                  [item.name]: isCorrect
                }));
              }}
              style={{
                ...baseStyle,
                backgroundColor:
                  userAnswer === undefined
                    ? "#fff"
                    : userAnswer
                    ? "#b2f2bb"
                    : "#ffc9c9"
              }}
            >
              {item.name} — {value}
            </button>
          );
        })}
      </div>
    );
  }

  // 🔵 MATCH
  return (
    <div style={{ display: "flex", gap: "2rem", color: "#000" }}>
      <div style={{ flex: 1 }}>
        {left.map(item => {
          const isMatched = matched[item.name];

          return (
            <button
              key={item.name}
              disabled={isMatched}
              onClick={() => setSelectedLeft(item)}
              style={{
                ...baseStyle,
                marginBottom: "0.5rem",
                backgroundColor:
                  isMatched
                    ? "#b2f2bb"
                    : selectedLeft?.name === item.name
                    ? "#d0ebff"
                    : wrong?.left === item.name
                    ? "#ffc9c9"
                    : "#fff"
              }}
            >
              {item.name}
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1 }}>
        {right.map(opt => {
          const disabled = isRightMatched(opt.value);

          return (
            <button
              key={opt.id}
              disabled={disabled}
              onClick={() => setSelectedRight(opt)}
              style={{
                ...baseStyle,
                marginBottom: "0.5rem",
                backgroundColor:
                  disabled
                    ? "#b2f2bb"
                    : selectedRight?.value === opt.value
                    ? "#d0ebff"
                    : wrong?.right === opt.value
                    ? "#ffc9c9"
                    : "#fff"
              }}
            >
              {opt.value}
            </button>
          );
        })}
      </div>
    </div>
  );
}