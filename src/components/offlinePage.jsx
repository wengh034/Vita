import React from "react";
import SVGComponent from "./SvgComponent";
import vitaLogo from "../assets/icons/vita-logo.svg";
export default function OfflinePage({ onRetry, retrying }) {
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
          Vita no puede conectarse con el servidor.
        </p>

        <button
          onClick={onRetry}
          disabled={retrying}
        >
          {retrying
            ? "Comprobando..."
            : "Reintentar conexión"}
        </button>

      </div>

    </div>
  );
}
