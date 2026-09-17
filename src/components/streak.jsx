import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import streakGif from "../assets/animations/Meditation.gif"; 

export default function StreakScreen({ streakProp }) {
  const navigate = useNavigate();
  const [streakDays, setStreakDays] = useState(streakProp || 0);
  const [userName, setUserName] = useState(""); 
  const [weekDays, setWeekDays] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Cálculo realista de los días de la semana basado en la racha actual
  useEffect(() => {
    const daysMap = ['D', 'L', 'Ma', 'Mi', 'J', 'V', 'S'];
    const today = new Date();
    const currentStreak = streakProp !== undefined ? streakProp : streakDays;

    const generatedDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(today.getDate() - (6 - i));
      const dayOfWeek = d.getDay();
      const isToday = i === 6;

      // Lógica realista: Un día está completado solo si entra dentro del conteo de la racha actual hacia atrás desde hoy.
      // Ej: si racha es 1, solo hoy está completado. Si es 3, hoy y los 2 días anteriores lo están.
      const daysAgoFromToday = 6 - i;
      const isCompleted = daysAgoFromToday < currentStreak;

      return {
        label: daysMap[dayOfWeek],
        completed: isCompleted, 
        active: isToday
      };
    });

    setWeekDays(generatedDays);
  }, [streakProp, streakDays]);

  // 2. Obtener nombre del usuario mediante el UUID del LocalStorage y respaldo de racha
  useEffect(() => {
    async function fetchUserData() {
      try {
        // A. Respaldo por si se entra de forma directa sin pasar props
        if (streakProp === undefined) {
          const dbRequest = indexedDB.open('vita_db', 1); 
          dbRequest.onsuccess = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('userStats')) return;
            
            const transaction = db.transaction('userStats', 'readonly');
            const store = transaction.objectStore('userStats');
            const getRequest = store.get('stats');

            getRequest.onsuccess = () => {
              if (getRequest.result) {
                setStreakDays(getRequest.result.enthalpy || 0);
              }
            };
          };
        }

        // B. Obtener el nombre del usuario desde tu backend usando ngrok
        const uuid = localStorage.getItem('vita_user_uuid');
        if (uuid) {
          const response = await fetch(`https://negation-subsoil-ramp.ngrok-free.dev/api/users/${uuid}`, {
            headers: {
              "ngrok-skip-browser-warning": "true"
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data && data.name) {
              setUserName(data.name.toUpperCase());
            }
          }
        }
      } catch (error) {
        console.error("Error al cargar los datos del usuario:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [streakProp]);

  if (loading) return null;

  return (
    <div
      style={{
        fontFamily: "'Bubbleboddy', sans-serif",
        // backgroundColor: "#121214",
        backgroundColor: "#fffffe",
        color: "#fffffe",
        textAlign: "center",
        padding: "2rem 1.5rem",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxSizing: "border-box"
      }}
    >
      {/* 1. Encabezado / GIF Animado */}
      <div style={{
        flex: 1,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        maxHeight: "16rem",
      }}>
        <img 
          src={streakGif} 
          alt="Streak Animation" 
          style={{ width: "19rem", height: "19rem", objectFit: "contain" }} 
        />
      </div>

      {/* 2. Sección de Contador y Calendario Semanal */}
      <div style={{marginTop: "-5rem"}}>
        <h1 style={{
          fontWeight: "950",
          fontSize: "5.5rem",
          color: "#f2a33b",
          margin: "0",
          lineHeight: "1"
        }}>
          {streakDays}
        </h1>
        <h3 style={{ 
          color: "#f2a33b", 
          fontSize: "1.3rem", 
          fontWeight: "700",
          marginTop: "0.5rem",
          marginBottom: "2.5rem"
        }}>
          días de racha
        </h3> 

        {/* Barra dinámica y realista de los días de la semana */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          maxWidth: '350px',
          margin: '0 auto 1.5rem auto'
        }}>
          {weekDays.map((day, index) => (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', color: day.completed ? '#f2a33b' : '#76767a', fontWeight: 'bold' }}>{day.label}</span>
              <div style={{
                width: '2.4rem',
                height: '2.4rem',
                borderRadius: '50%',
                backgroundColor: day.completed ? '#f2a33b' : '#252529',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                border: day.active ? '2px solid #38bdf8' : 'none',
                opacity: day.completed ? 1 : 0.5
              }}>
                {day.completed && <span style={{ color: '#121214', fontWeight: 'bold', fontSize: '0.9rem' }}>✓</span>}
              </div>
            </div>
          ))}
        </div>

        <p style={{fontFamily: "Nunito, sans-serif", color: '#252529', fontSize: '1rem', fontWeight: '600', marginBottom: '1.5rem' }}>
          ¡Sigue así!
        </p>
      </div>

      {/* 3. Botón de Acción Inferior */}
      <button
        onClick={() => navigate("/")}
        style={{
          width: "100%",
          padding: "1rem",
          borderRadius: "14px",
          border: "none",
          backgroundColor: "#7f5af0",
        //   color: "#121214",
          color:"#fffffe",
          cursor: "pointer",
          fontFamily: "Nunito, sans-serif",
          fontWeight: "900",
          fontSize: "1rem",
          letterSpacing: "1px"
        }}
      >
        NADA TE DETIENE {userName || " "}
      </button>
    </div>
  );
}