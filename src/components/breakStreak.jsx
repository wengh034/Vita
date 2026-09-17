import React from "react";
import SvgComponent from "./SvgComponent";
import keanuSadIlustration from "../assets/illustrations/keanu_sad.webp";

export default function BreakStreakScreen({ onAccept }) {
  return (
    <div
      style={{
        fontFamily: "Nunito, sans-serif",
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
      {/* 1. Encabezado / Ilustración WebP manejada por tu SvgComponent */}
      <div style={{
        flex: 1,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        maxHeight: "16rem",
      }}>
        <SvgComponent 
          src={keanuSadIlustration} 
          size="23rem" 
        />
      </div>

      {/* 2. Mensaje explicativo */}
      <div>
        <h1 style={{
            marginTop: "-7rem",
          fontFamily: "'Bubbleboddy', sans-serif",
          fontWeight: "950",
          fontSize: "2.5rem",
        //   color: "#ef4565", 
        color: "#7f5af0",
          lineHeight: "1.2"
        }}>
          ¡Racha perdida! :(
        </h1>
        <h3 style={{ 
          color: "#a1a1aa", 
          fontSize: "1.1rem", 
          fontWeight: "600",
          marginTop: "1rem",
          marginBottom: "2.5rem",
          padding: "0 1rem"
        }}>
          Pasó más de un día sin actividad. Tu racha ha vuelto a cero, ¡Pero hoy es un gran día para empezar de nuevo!
        </h3> 
      </div>

      {/* 3. Botón de Acción para continuar */}
      <button
        onClick={onAccept}
        style={{
          width: "100%",
          padding: "1rem",
          borderRadius: "14px",
          border: "none",
          backgroundColor: "#7f5af0",
          color: "#fffffe",
          cursor: "pointer",
          fontFamily: "Nunito, sans-serif",
          fontWeight: "900",
          fontSize: "1rem",
          letterSpacing: "0.5px"
        }}
      >
        ENTENDIDO, A SEGUIR
      </button>
    </div>
  );
}