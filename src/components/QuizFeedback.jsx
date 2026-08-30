import React from "react";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { calculateQuizATP } from "../calculateQuizATP";
import { addUserATP, updateStreak } from "../progress";
import SvgComponent from "./SvgComponent";
import boltIcon from "../assets/icons/bolt.svg";
import entropyIcon from "../assets/icons/entropy.svg";
import targetIcon from "../assets/icons/target.svg";
import timerIcon from "../assets/icons/timer.svg";

export default function QuizFeedback({ questions, startTime }) {
  const hasProcessed = useRef(false);
  const navigate = useNavigate();
  const [gainedATP, setGainedATP] = React.useState(0);

  async function onQuizFinished({ speed, accuracy }) {
    const gainedATP = calculateQuizATP({ speed, accuracy });

    // const newATP = await addUserATP(gainedATP);
    const gained = calculateQuizATP({ speed, accuracy });
    setGainedATP(gained);

const newATP = await addUserATP(gained);

    const newStreak = await updateStreak();
    
    console.log(`ATP ganado: +${gainedATP}`);
    console.log(`ATP actual: ${newATP}`);
    console.log(`Racha actual (enthalpy): ${newStreak}`);

  }


  if (!questions || questions.length === 0) return null;

  // Tiempo total
  const endTime = Date.now();
  const elapsedSeconds = Math.floor((endTime - startTime) / 1000);
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;

  const timeFormatted =
    minutes > 0
      ? `${minutes}:${seconds.toString().padStart(2, "0")}`
      : `${seconds}s`;

  // Resultados
  const total = questions.length;
  const incorrect = questions.filter(q => q.status === 0).length;
  const correct = total - incorrect;
  const accuracy = Math.round((correct / total) * 100);


  // Tiempo promedio por pregunta (en minutos)
  const avgTimeMinutes = elapsedSeconds / 60 / total;
const avgMinutesText = avgTimeMinutes.toFixed(1);
  // Velocidad
  let speed;
  if (avgTimeMinutes < 1) speed = "very_fast";
  else if (avgTimeMinutes < 2) speed = "fast";
  else if (avgTimeMinutes < 3) speed = "normal";
  else if (avgTimeMinutes < 4) speed = "slow";
  else speed = "very_slow";

  // Precisión
  let precision;
  if (incorrect === 0) precision = "perfect";
  else if (incorrect === 1) precision = "good";
  else if (incorrect === 2) precision = "ok";
  else precision = "bad";

  // Mensajes
const messages = {
  very_fast: {
    perfect: {
      title: `Impecable, menos de ${avgMinutesText} min por pregunta.`,
      subtitle: `Rápido y sin errores. Excelente base, sigue así!`
    },
    good: {
      title: `🚀 Muy buen ritmo y precisión`,
      subtitle: `${avgMinutesText} min por pregunta. Buena base, sigue adelante!`
    },
    ok: {
      title: `⚡ Ritmo muy alto`,
      subtitle: `${avgMinutesText} min por pregunta. Rápido, pero con algunos errores.`
    },
    bad: {
      title: `⚠️ Demasiado rápido`,
      subtitle: `Lee con más calma.`
    }
  },

  fast: {
    perfect: {
      title: `✅ Excelente trabajo`,
      subtitle: `${avgMinutesText} min por pregunta. Rápido y muy preciso.`
    },
    good: {
      title: `👍 Buen ritmo`,
      subtitle: `${avgMinutesText} min por pregunta y buenos resultados.`
    },
    ok: {
      title: `🙂 Ritmo correcto`,
      subtitle: `${avgMinutesText} min por pregunta, pero con errores a mejorar.`
    },
    bad: {
      title: `📘 Apurado`,
      subtitle: `${avgMinutesText} min por pregunta. Conviene repasar.`
    }
  },

  normal: {
    perfect: {
      title: `🧠 Muy sólido`,
      subtitle: `${avgMinutesText} min por pregunta. Preciso y controlado.`
    },
    good: {
      title: `👍 Buen equilibrio`,
      subtitle: `${avgMinutesText} min por pregunta y buena comprensión.`
    },
    ok: {
      title: `🙂 Correcto`,
      subtitle: `${avgMinutesText} min por pregunta. Puedes afinar detalles.`
    },
    bad: {
      title: `📘 Comprensión a reforzar`,
      subtitle: `${avgMinutesText} min por pregunta.`
    }
  },

  slow: {
    perfect: {
      title: `🧠 Muy preciso`,
      subtitle: `${avgMinutesText} min por pregunta. Sin errores, pero algo lento.`
    },
    good: {
      title: `🙂 Buen entendimiento`,
      subtitle: `${avgMinutesText} min por pregunta. Falta agilidad.`
    },
    ok: {
      title: `⏳ Tiempo elevado`,
      subtitle: `${avgMinutesText} min por pregunta y varios errores.`
    },
    bad: {
      title: `📘 Conviene repasar`,
      subtitle: `${avgMinutesText} min por pregunta.`
    }
  },

  very_slow: {
    perfect: {
      title: `⏳ Muy lento`,
      subtitle: `${avgMinutesText} min por pregunta. Sin errores, pero excesivo.`
    },
    good: {
      title: `📘 Ritmo bajo`,
      subtitle: `${avgMinutesText} min por pregunta. Refuerza conceptos.`
    },
    ok: {
      title: `📘 Ritmo muy bajo`,
      subtitle: `Errores frecuentes. Refuerza la lectura.`
    },
    bad: {
      title: `🔁 Recomendado repasar`,
      subtitle: `Antes de continuar.`
    }
  }
};


  // const feedbackMessage = messages[speed][precision];
  const feedback = messages[speed][precision];

// useEffect(() => {
//   if (!questions || questions.length === 0) return;
//   onQuizFinished({ speed, accuracy });
// }, [speed, accuracy]);
useEffect(() => {
  if (hasProcessed.current) return;
  if (!questions || questions.length === 0) return;

  hasProcessed.current = true;
  onQuizFinished({ speed, accuracy });
}, [questions, speed, accuracy]);

  return (
    <div
      className="quiz-feedback"
      style={{
        fontFamily: "Nunito, sans-serif",
        fontOpticalSizing:'auto',
        fontStyle: "bold",
        fontWeight: "600",
        // backgroundColor: "#252529",
        backgroundColor: "#ffffff",
        // color: "#1a1a1a",
        color: "#f6722b",
        textAlign: "center",
        padding: "1.5rem",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between"
      }}
    >
      <div style={{fontStyle:"normal",}}>
      <h3 style={{fontWeight: "bolder", fontSize: "2.2rem"}}>
        {/* {feedbackMessage} */}
       <p> {feedback.title}</p>
       

      </h3>
      <h3 style={{
        // color:'#f1f1f1',
        color:'#76767a',
        }}>{feedback.subtitle}</h3> 
<div>
      

        <div className="stats-container" style={{
          color: '#f1f1f1',
          borderRadius:'8px',
          alignContent:'center',
          justifyContent:'center',
          display:'flex',
          padding:'1rem',
          marginTop:'1rem',
        }}>
          
<div>
            <div className="atp-box"
          style={{
            display:"flex",
            flexDirection:"column",
            backgroundColor:"#f6722b",
            height:"4rem", width:"6rem",
            fontWeight:'600',
            color:'#252529',
            borderRadius:'8px',
            padding:'0.5rem 0.3rem 0.2rem 0.3rem',
            margin:'0 1rem ',
            }}>ATP
            <div style={{
              height:'100%',
              backgroundColor:'#252529',
              borderRadius:'4px',
              color:'#f6722b',
              alignContent:'center',
              display:'flex',
              justifyContent:'center',
              alignItems:'center',
            }}>
              <div><SvgComponent src={boltIcon} size="1.5rem"/></div>
              <div style={{marginLeft:'0.3em'}}>+{gainedATP}</div>
              
            </div>
            </div>
   <div className="entropy-box"
          style={{
            display:"flex",
            flexDirection:"column",
            backgroundColor:"#ffc800",
            height:"4rem", width:"6rem",
            fontWeight:'600',
            color:'#252529',
            borderRadius:'8px',
            padding:'0.5rem 0.3rem 0.2rem 0.3rem',
            margin:'0.5rem 1rem ',
            }}>Entropía
            <div style={{
              height:'100%',
              backgroundColor:'#252529',
              borderRadius:'4px',
              color:'#ffc800',
              alignContent:'center',
              display:'flex',
              justifyContent:'center',
              alignItems:'center',
            }}>
              <div><SvgComponent src={entropyIcon} size="1.5rem"/></div>
              <div style={{marginLeft:'0.3em'}}>-{correct}</div>
            </div>
            </div>


</div>

<div>
   <div className="accuracy-box"
          style={{
            display:"flex",
            flexDirection:"column",
            // backgroundColor:"#7ebf5c",
            backgroundColor:"#2cb67d",
            height:"4rem", width:"6rem",
            fontWeight:'600',
            color:'#252529',
            borderRadius:'8px',
            padding:'0.5rem 0.3rem 0.2rem 0.3rem',
            margin:'0 1rem ',
            
            }}>Precisión
            <div style={{
              height:'100%',
              backgroundColor:'#252529',
              borderRadius:'4px',
              color:'#2cb67d',
              display:'flex',              justifyContent:'center',
              alignItems:'center',
              alignContent:'center',
            }}>
              <div><SvgComponent src={targetIcon} size="1.5rem"/></div>
              <div style={{marginLeft:'0.3em'}}>{accuracy}%</div>
            </div>
            </div>



         <div className="time-box"
          style={{
            display:"flex",
            flexDirection:"column",
            backgroundColor:"#7f5af0",
            height:"4rem", width:"6rem",
            fontWeight:'600',
            color:'#252529',
            borderRadius:'8px',
            padding:'0.5rem 0.3rem 0.2rem 0.3rem',
            margin:'0.5rem 1rem ',
            
            }}>Tiempo
            <div style={{
              height:'100%',
              backgroundColor:'#252529',
              borderRadius:'4px',
              color:'#7f5af0',
              alignContent:'center',
              display:'flex',
              justifyContent:'center',
              alignItems:'center',
            }}>
              <div><SvgComponent src={timerIcon} size="1.5rem"/></div>
              <div style={{marginLeft:'0.3em'}}>{timeFormatted}</div>

            </div>
            </div>
</div>

          </div>
      </div>
      </div>
      
      <button
        onClick={() => navigate("/")}
        className="back-btn"
        style={{
          marginTop: "1rem",
          padding: "0.6rem 1.2rem",
          borderRadius: "6px",
          border: "none",
          backgroundColor: "#7f5af0",
          color: "#fffffe",
          cursor: "pointer",
          fontFamily: "Nunito, sans-serif",
          fontWeight: "600",
        }}
      >
        Aceptar
      </button>
    </div>
  );
}
