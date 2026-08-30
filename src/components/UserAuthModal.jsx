import React, { useState, useEffect } from "react";
import { apiFetch } from "../config/api.js";

export default function UserAuthModal({ userStatus, userData, onRegister }) {
  const [nickname, setNickname] = useState("");
  const [submittedNick, setSubmittedNick] = useState(""); 
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [supportPhone, setSupportPhone] = useState("");

  // Cargar el teléfono de soporte una sola vez al montar el componente
  useEffect(() => {
    let isMounted = true;
    const fetchSupportPhone = async () => {
      try {
        const res = await apiFetch("/config/support-phone");
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setSupportPhone(data.phone);
        }
      } catch (err) {
        console.error("Error al obtener número de soporte:", err);
      }
    };

    fetchSupportPhone();

    return () => {
      isMounted = false;
    };
  }, []);

  const activeNick = userData?.nickname || submittedNick || nickname;

  const waMessage = encodeURIComponent(
    `Hola, me registré en Vita con el usuario "*${activeNick}*" y quisiera solicitar acceso a mi cuenta.`
  );
  const waLink = `https://wa.me/${supportPhone}?text=${waMessage}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanNick = nickname.trim();
    if (!cleanNick) return;

    setSubmitting(true);
    setErrorMsg("");
    setSubmittedNick(cleanNick);

    try {
      await onRegister(cleanNick);
    } catch (err) {
      setErrorMsg(err.message || "Error al registrar el usuario. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 className="Bobbleboddy-font" style={styles.title}>Vita</h1>

        {/* 1. VISTA DE INGRESO DE NICKNAME */}
        {!userStatus && (
          <form onSubmit={handleSubmit} style={styles.form}>
            <p style={styles.text}>Ingresa un nombre de usuario para solicitar acceso:</p>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Ej: Alex"
              disabled={submitting}
              style={styles.input}
              maxLength={20}
              required
            />
            {errorMsg && <p style={styles.error}>{errorMsg}</p>}
            <button type="submit" disabled={submitting} style={styles.button}>
              {submitting ? "Enviando..." : "Solicitar acceso"}
            </button>
          </form>
        )}

        {/* 2. VISTA DE PENDIENTE DE APROBACIÓN */}
        {userStatus === "pending" && (
          <div>
            <h2 style={{ color: "#f7c948", margin: "0 0 1rem 0" }}>Registro pendiente</h2>
            <p style={styles.text}>
              Tu solicitud fue enviada correctamente. El administrador aún no ha revisado tu acceso.
            </p>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.waButton}
            >
              Contactar por WhatsApp
            </a>
          </div>
        )}

        {/* 3. VISTA DE REVOCADO / RECHAZADO */}
        {userStatus === "rejected" && (
          <div>
            <h2 style={{ color: "#ff5c5c", margin: "0 0 1rem 0" }}>🚫 Acceso revocado</h2>
            <p style={styles.text}>
              Tu acceso a Vita ha sido denegado o revocado por el administrador.
            </p>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.waButton}
            >
              Soporte
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    width: "100vw",
    backgroundColor: "#16161a",
    color: "#fffffe",
    padding: "1rem",
    boxSizing: "border-box",
  },
  card: {
    textAlign: "center",
    maxWidth: "400px",
    width: "100%",
    padding: "2rem",
    backgroundColor: "#242629",
    borderRadius: "12px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
  },
  title: {
    margin: "0 0 1.5rem 0",
    color: "#7f5af0",
    fontSize: "2.5rem",
  },
  text: {
    margin: "0 0 1.5rem 0",
    color: "#94a1b2",
    lineHeight: "1.5",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  input: {
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    border: "1px solid #7f5af0",
    backgroundColor: "#16161a",
    color: "#fffffe",
    fontSize: "1rem",
    textAlign: "center",
  },
  button: {
    backgroundColor: "#7f5af0",
    color: "#fffffe",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: "bold",
    cursor: "pointer",
  },
  waButton: {
    display: "inline-block",
    backgroundColor: "#25D366",
    color: "#ffffff",
    padding: "0.75rem 1.25rem",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: "bold",
    fontSize: "0.95rem",
    marginTop: "0.5rem",
  },
  error: {
    color: "#ff5c5c",
    fontSize: "0.875rem",
    margin: 0,
  },
};