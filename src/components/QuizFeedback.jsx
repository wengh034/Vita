import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { calculateQuizATP } from "../calculateQuizATP";
import { addUserATP, updateStreak } from "../progress";
import SvgComponent from "./SvgComponent";
import StreakScreen from "./streak";
import boltIcon from "../assets/icons/bolt.svg";
import targetIcon from "../assets/icons/target.svg";
import timerIcon from "../assets/icons/timer.svg";

// Importaciones de ilustraciones
import budaIlustration from "../assets/illustrations/Buddha_hand-rafiki.svg";
import fastIlustration from "../assets/illustrations/Fast.svg";
import fastCarIlustration from "../assets/illustrations/Fast_car-rafiki.svg";
import brainIlustration from "../assets/illustrations/brain_sides.svg";
import geniusIlustration from "../assets/illustrations/Genius-cuate.svg";
import burgerIlustration from "../assets/illustrations/Hamburger.svg";
import speedGirlIlustration from "../assets/illustrations/Speed_test-girl.svg";
import thanosDaggerIlustration from "../assets/illustrations/Thanos_dagger.webp";
import gFallsIlustration from "../assets/illustrations/GFBook.webp";
import badIdeaIlustration from "../assets/illustrations/Bad_idea.svg";
import slowAndWrongIlustration from "../assets/illustrations/Forgot_pass.svg";
import readingIllustration from "../assets/illustrations/Stay_at_home-reading.svg";
import dayIDefaultIllustration from "../assets/illustrations/Working_from_anywhere.svg";
import nightIDefaultIllustration from "../assets/illustrations/Working_late.svg";

export default function QuizFeedback({ questions, startTime }) {
  const hasProcessed = useRef(false);
  const navigate = useNavigate();
  const [gainedATP, setGainedATP] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0); // 👈 1. Estado para almacenar la racha real
  const [showStreak, setShowStreak] = useState(false);

  async function onQuizFinished({ speed, accuracy }) {
    const gained = calculateQuizATP({ speed, accuracy });
    setGainedATP(gained);

    const newATP = await addUserATP(gained);
    const newStreak = await updateStreak(); //[cite: 1] Obtenemos el nuevo valor de enthalpy
    
    setCurrentStreak(newStreak); // 👈 2. Guardamos la racha real en el estado
    
    console.log(`ATP ganado: +${gained}`);
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
  const accuracy = Math.round(((total - incorrect) / total) * 100);

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

  const getNightIllustration = (dayImg, nightImg, daySize = "20rem", nightSize = "20rem") => {
    const currentHour = new Date().getHours();
    const isNightTime = currentHour >= 20 || currentHour < 5;
    
    return {
      src: isNightTime ? nightImg : dayImg,
      size: isNightTime ? nightSize : daySize
    };
  };

  // Mensajes con su respectiva ilustración dinámica
  const messages = {
    very_fast: {
      perfect: { 
        title: `¿Qué veo? ¿El ingreso?`, 
        subtitle: `Rápido y sin errores. Excelente base !Sigue así!`,
        illustrationData: brainIlustration
      },
      good: { 
        title: `¡Cuchau!`, 
        subtitle: `${avgMinutesText} min por pregunta. Buena base, nos vemos entre los 150.`,
        illustrationData: fastCarIlustration
      },
      ok: { 
        title: `Ritmo muy alto`, 
        subtitle: `${avgMinutesText} min por pregunta. Tranqui, la máquina no califican velocidad.`,
        illustrationData: getNightIllustration(dayIDefaultIllustration, nightIDefaultIllustration, "20rem", "15rem")
      },
      bad: { 
        title: `Fiaaauuuuuunnn`, 
        subtitle: `¿Eres Francesco Bernoullí? Lee con más calma.`,
        illustrationData: fastIlustration 
      }
    },
    fast: {
      perfect: { 
        title: `¿Qué veo? ¿El próximo techo?`, 
        subtitle: `Por el techo en la materia ¿Entendiste? Ejem... ${avgMinutesText} min por pregunta. Rápido y muy preciso, ingredientes para el ingreso.`,
        illustrationData: burgerIlustration
      },
      good: { 
        title: `Buen ritmo`, 
        subtitle: `${avgMinutesText} min por pregunta con buenos resultados.`,
        illustrationData: getNightIllustration(dayIDefaultIllustration, nightIDefaultIllustration, "18rem", "18rem")
      },
      ok: { 
        title: `Ritmo correcto`, 
        subtitle: `${avgMinutesText} min por pregunta, pero con errores a mejorar.`,
        illustrationData: getNightIllustration(dayIDefaultIllustration, nightIDefaultIllustration, "20rem", "15rem")
      },
      bad: { 
        title: `Fiaaauuuuuunnn`, 
        subtitle: `Francesco Virgolini se adelanta por la derecha de Maqueen ¡Directo a repasar! Muy rápido, conviene repasar.`,
        illustrationData: fastIlustration 
      }
    },
    normal: {
      perfect: { 
        title: `Nos vemos entre los 150.`, 
        subtitle: `${avgMinutesText} min por pregunta. Preciso y controlado.`,
        illustrationData: geniusIlustration
      },
      good: { 
        title: `Perfectamente equilibrado, como todo debería ser.`, 
        subtitle: `${avgMinutesText} min por pregunta, buena comprensión.`,
        illustrationData: thanosDaggerIlustration 
      },
      ok: { 
        title: `Correcto`, 
        subtitle: `${avgMinutesText} min por pregunta. Puedes afinar detalles.`,
        illustrationData: budaIlustration 
      },
      bad: { 
        title: `Comprensión a reforzar`, 
        subtitle: `${avgMinutesText} min por pregunta.`,
        illustrationData: budaIlustration 
      }
    },
    slow: {
      perfect: { 
        title: `Namasté`, 
        subtitle: `${avgMinutesText} min por pregunta. Sin errores, muy relajado. ¿Quién eres, Buda?`,
        illustrationData: budaIlustration 
      },
      good: { 
        title: `Buen entendimiento`, 
        subtitle: `${avgMinutesText} min por pregunta. Falta agilidad.`,
        illustrationData: budaIlustration 
      },
      ok: { 
        title: `Tiempo elevado`, 
        subtitle: `${avgMinutesText} min por pregunta y varios errores.`,
        illustrationData: slowAndWrongIlustration 
      },
      bad: { 
        title: `Conviene repasar`, 
        subtitle: `${avgMinutesText} min por pregunta.`,
        illustrationData: badIdeaIlustration 
      }
    },
    very_slow: {
      perfect: { 
        title: `Vamos Soos, Dipper necesita respuestas.`, 
        subtitle: `${avgMinutesText} min por pregunta. Sin errores, pero tiempo excesivo.`,
        illustrationData: gFallsIlustration 
      },
      good: { 
        title: `Ritmo bajo`, 
        subtitle: `${avgMinutesText} min por pregunta. Refuerza conceptos.`,
        illustrationData: getNightIllustration(dayIDefaultIllustration, nightIDefaultIllustration, "18rem", "18rem")
      },
      ok: { 
        title: `Ritmo muy bajo`, 
        subtitle: `Errores frecuentes. Refuerza la lectura.`,
        illustrationData: readingIllustration 
      },
      bad: { 
        title: `Recomendiendo repasar.`, 
        subtitle: `Antes de continuar.`,
        illustrationData: badIdeaIlustration
      }
    }
  };

  const feedback = messages[speed][precision];

  useEffect(() => {
    if (hasProcessed.current) return;
    if (!questions || questions.length === 0) return;

    hasProcessed.current = true;
    onQuizFinished({ speed, accuracy });
  }, [questions, speed, accuracy]);

  if (showStreak) {
    return <StreakScreen streakProp={currentStreak} />;
  }

  return (
    <div
      className="quiz-feedback"
      style={{
        fontFamily: "Nunito, sans-serif",
        fontWeight: "600",
        backgroundColor: "#ffffff",
        color: "#f2a33b",
        textAlign: "center",
        padding: "2rem 1.5rem",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxSizing: "border-box"
      }}
    >
      <div style={{
        flex: 1,
        display: "flex",
        justifyContent: "center",
        maxHeight: "15rem",
      }}>
        <SvgComponent 
          src={typeof feedback.illustrationData === 'string' ? feedback.illustrationData : feedback.illustrationData.src} 
          size={feedback.illustrationData.size || "20rem"} 
        />
      </div>
      
      {/* Sección de Mensajes */}
      <div>
        <h3 style={{
          fontFamily: "'Bubbleboddy', sans-serif",
          fontWeight: "bolder",
          fontSize: "1.5rem",
          marginTop: "-3rem"
          }}>
          {feedback.title}
        </h3>
        <h3 style={{ color: '#76767a', fontSize: "1.1rem", fontWeight: "600" }}>
          {feedback.subtitle}
        </h3> 

        {/* Contenedor de Estadísticas */}
        <div className="stats-container" style={{
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'space-between',
          width: '100%',
          marginTop: '2rem'
        }}>
          
          {/* ATP Box */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            backgroundColor: "#7f5af0",
            borderRadius: "14px",
            padding: "2px",
            boxSizing: "border-box"
          }}>
            <span style={{ 
              color: "#252529", 
              fontSize: "0.7rem", 
              fontWeight: "800", 
              padding: "0.2rem 0",
              letterSpacing: "0.5px",
              textAlign: "center"
            }}>ATP</span>
            <div style={{
              backgroundColor: '#252529',
              color: '#7f5af0',
              borderRadius: '12px',
              height: '3.2rem',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              boxSizing: 'border-box',
              margin: '0 1px'
              }}>
              <SvgComponent src={boltIcon} size="1.3rem"/>
              <span style={{ marginLeft: '0.3rem', fontWeight: 'bold', fontSize: "1.1rem" }}>+{gainedATP}</span>
            </div>
          </div>

          {/* Precisión Box */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            backgroundColor: "#2cb67d",
            borderRadius: "14px",
            padding: "2px",
            boxSizing: "border-box"
          }}>
            <span style={{ 
              color: "#252529", 
              fontSize: "0.7rem", 
              fontWeight: "800", 
              padding: "0.2rem 0",
              letterSpacing: "0.5px",
              textAlign: "center"
            }}>PRECISIÓN</span>
            <div style={{
              backgroundColor: '#252529',
              color: '#2cb67d',
              borderRadius: '12px',
              height: '3.2rem',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              boxSizing: 'border-box',
              margin: '0 1px'
            }}>
              <SvgComponent src={targetIcon} size="1.3rem"/>
              <span style={{ marginLeft: '0.3rem', fontWeight: 'bold', fontSize: "1.1rem" }}>{accuracy}%</span>
            </div>
          </div>

          {/* Tiempo Box */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            backgroundColor: "#f2a33b",
            borderRadius: "14px",
            padding: "2px",
            boxSizing: "border-box"
          }}>
            <span style={{ 
              color: "#252529", 
              fontSize: "0.7rem", 
              fontWeight: "800", 
              padding: "0.2rem 0",
              letterSpacing: "0.5px",
              textAlign: "center"
            }}>TIEMPO</span>
            <div style={{
              backgroundColor: '#252529',
              color: '#f2a33b',
              borderRadius: '12px',
              height: '3.2rem',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              boxSizing: 'border-box',
              margin: '0 1px'
            }}>
              <SvgComponent src={timerIcon} size="1.3rem"/>
              <span style={{ marginLeft: '0.3rem', fontWeight: 'bold', fontSize: "1.1rem" }}>{timeFormatted}</span>
            </div>
          </div>

        </div>
      </div>

      {/* Botón Aceptar */}
      <button
        onClick={() => setShowStreak(true)}
        style={{
          width: "100%",
          padding: "0.8rem",
          borderRadius: "8px",
          border: "none",
          backgroundColor: "#7f5af0",
          color: "#fffffe",
          cursor: "pointer",
          fontFamily: "Nunito, sans-serif",
          fontWeight: "bold",
          fontSize: "1rem"
        }}
      >
        Aceptar
      </button>
    </div>
  );
}