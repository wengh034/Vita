import { useState } from "react";

export default function DragOrderExercise({
  items,
  correctOrder,
  onComplete
}) {

  const [list, setList] = useState(shuffle(items));
  const [dragIndex, setDragIndex] = useState(null);
  const [result, setResult] = useState(null);

  function shuffle(array) {
    return [...array].sort(() => Math.random() - 0.5);
  }

  function handleDragStart(index) {
    setDragIndex(index);
  }

  function handleDrop(index) {

    const newList = [...list];

    const draggedItem = newList[dragIndex];

    newList.splice(dragIndex, 1);
    newList.splice(index, 0, draggedItem);

    setList(newList);
  }

  function checkOrder() {

    const userOrder = list.map(item => item.id);

    const isCorrect =
      JSON.stringify(userOrder) ===
      JSON.stringify(correctOrder);

    setResult(isCorrect);

    if (isCorrect && onComplete) {
      onComplete();
    }

  }

  return (

    <div>

      <h2>
        Ordena correctamente
      </h2>

      {list.map((item, index) => (

        <div
          key={item.id}
          draggable
          onDragStart={() =>
            handleDragStart(index)
          }
          onDragOver={(e) =>
            e.preventDefault()
          }
          onDrop={() =>
            handleDrop(index)
          }
          style={{
            padding: 16,
            margin: 8,
            background: "#eee",
            borderRadius: 8,
            cursor: "grab"
          }}
        >

          {item.label}

        </div>

      ))}

      <button onClick={checkOrder}>
        Verificar
      </button>

      {result !== null && (

        <div>

          {result
            ? "Correcto"
            : "Incorrecto"}

        </div>

      )}

    </div>

  );

}
