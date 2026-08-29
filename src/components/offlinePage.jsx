import React from "react";
import SVGComponent from "./SvgComponent";
import vitaLogo from "../assets/icons/vita-logo.svg";
export default function OfflinePage({ onRetry, isRetrying }) {
  return (
    <div className="offline-page">

      <div className="offline-content">

            <div style={{display: "flex", alignItems: "center", gap: "1rem"}}>
            <SVGComponent
            src={vitaLogo}
            fillColor="#FDFEFE"
            size="4rem"
            />
            <h1 className="Bobbleboddy-font">Sin conexión</h1>
            </div> 

        <p>
          No se pudo conectar con el servidor de Vita. Comprueba tu conexión a internet o intenta de nuevo más tarde.
        </p>

        <button
          onClick={onRetry}
          disabled={isRetrying}
        >
          {isRetrying
            ? "Comprobando..."
            : "Reintentar conexión"}
        </button>

      </div>

    </div>
  );
}
