import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import SVGComponent from "./SvgComponent";
import extensionIcon from "../assets/icons/extension.svg";
import expandMoreIcon from "../assets/icons/expand_more.svg";
import { apiFetch } from "../config/api.js";
const GameRenderer = ({ subjectId }) => {
  const [modules, setModules] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!subjectId) return;

    apiFetch(`/modules/${subjectId}`)
      .then(res => res.json())
      .then(data => {
        setModules(data);
      });
  }, [subjectId]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!modules.length) {
    return (
      <button style={{ all: "unset" }}>
        Minijuegos
      </button>
    );
  }

  return (
    <div
      ref={dropdownRef}
      className={`games-dropdown-container ${dropdownOpen ? "open" : ""}`}
    >
      {/* Botón trigger */}
      <button
        className={`book-floating-label ${dropdownOpen ? "open" : ""}`}
        onClick={() => setDropdownOpen(o => !o)}
        style={{
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          fontFamily: "Nunito, sans-serif",
          fontWeight: 700,
          backgroundColor: "#7f5af0",
        }}
      >
        <SVGComponent src={extensionIcon} />
        Minijuegos
        <SVGComponent
          src={expandMoreIcon}
          size="1.5rem"
          className={`games-dropdown-chevron ${dropdownOpen ? "open" : ""}`}        />
      </button>

      {/* Dropdown */}
      <ul className={`games-dropdown-menu ${dropdownOpen ? "open" : ""}`}>
        {modules.map(m => (
          <li key={m.slug} style={{ marginBottom: "0.25rem" }}>
            <button
              className="books-btn-list"
              style={{
                textAlign: "center",
                fontFamily: "Nunito, sans-serif",
                fontSize: "0.9rem",
                fontWeight: "600",
                color: "#fffffe",
                backgroundColor: "transparent",
              }}
              onClick={() => {
                setDropdownOpen(false);
                navigate(`/game/${subjectId}/${m.slug}`); // 👈 navegación
              }}
            >
              {m.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GameRenderer;