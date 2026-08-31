import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";

import {
  initUserStats,
  syncChaptersMeta,
} from "./progress";

import { validateStreak } from "./streakValidation.js";
import { apiFetch } from "./config/api.js";

import BooksList from "./components/BooksList.jsx";
import ChapterPage from "./components/ChapterPage.jsx";
import GamePage from "./components/GamePage.jsx";
import InstallPage from "./components/installPage.jsx";
import OfflinePage from "./components/offlinePage.jsx";
import UserAuthModal from "./components/UserAuthModal.jsx";

import "./App.css";
import "./responsive.css";

export default function App() {

  // =========================================================
  // DATOS
  // =========================================================

  const [dataLoaded, setDataLoaded] = useState(false);
  const [contentReady, setContentReady] = useState(false);
  const [showLoading, setShowLoading] = useState(true);

  const [subjects, setSubjects] = useState([]);
  const [books, setBooks] = useState([]);
  const [serverDate, setServerDate] = useState(null);

  // =========================================================
  // USUARIO / AUTENTICACIÓN
  // =========================================================

  const [userStatus, setUserStatus] = useState(null);
  const [userData, setUserData] = useState(null); // MODIFICACIÓN 1: Guardar la data del usuario (nickname, status)

  // =========================================================
  // CONEXIÓN
  // =========================================================

  const [connectionError, setConnectionError] = useState(false);
  const [retryingConnection, setRetryingConnection] = useState(false);

  // =========================================================
  // LOADING
  // =========================================================

  const startTimeRef = useRef(performance.now());
  const loadingFinishedRef = useRef(false);

  // =========================================================
  // PWA
  // =========================================================

  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // =========================================================
  // COMPROBAR CONEXIÓN CON BACKEND
  // =========================================================

  const checkConnection = async () => {
    try {
      // console.log("🌐 Comprobando conexión con backend...");
      const res = await apiFetch("/health");

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      // console.log("✅ Conexión con backend confirmada");
      return true;
    } catch (err) {
      console.error("❌ Backend no disponible:", err);
      return false;
    }
  };

  // =========================================================
  // ARRANQUE DE LA APLICACIÓN
  // =========================================================

  useEffect(() => {
    let cancelled = false;

    const startApp = async () => {
      console.log("🚀 Iniciando Vita...");

      // -------------------------------------------------------
      // 1. COMPROBAR BACKEND
      // -------------------------------------------------------

      const connected = await checkConnection();

      if (cancelled) return;

      if (!connected) {
        console.log("🔴 Vita iniciada sin conexión con el backend");
        setConnectionError(true);
        setShowLoading(false); // 👈 Apaga el loader para mostrar la vista de error
        return;
      }

      // -------------------------------------------------------
      // 2. VERIFICAR ESTADO DEL USUARIO
      // -------------------------------------------------------

      const storedUuid = localStorage.getItem("vita_user_uuid");

      if (storedUuid) {
        try {
          const statusRes = await apiFetch(`/users/status/${storedUuid}`);

          if (statusRes.ok) {
            const data = await statusRes.json();
            if (cancelled) return;

            setTimeout(() => {
              if (cancelled) return;
              setUserData(data); // MODIFICACIÓN 2: Guardar los datos devueltos por la API
              setUserStatus(data.status);

              if (data.status !== "approved") {
                console.log(`⚠️ Usuario en estado '${data.status}'. Acceso restringido.`);
                setShowLoading(false);
              }
            }, 0);

            if (data.status !== "approved") return;

          } else if (statusRes.status === 404) {
            // 🟢 EL UUID NO EXISTE EN LA BASE DE DATOS (ej. intento con otro dispo o DB reiniciada)
            // console.warn("⚠️ UUID no encontrado en servidor. Limpiando sesión local...");
            localStorage.removeItem("vita_user_uuid");
            
            setTimeout(() => {
              if (!cancelled) {
                setUserData(null);
                setUserStatus(null); // Muestra la pantalla de registro limpio
                setShowLoading(false);
              }
            }, 0);
            return;
          } else {
            throw new Error(`Error en servidor: HTTP ${statusRes.status}`);
          }
        } catch (err) {
          // Si el error fue un 404 proveniente de apiFetch
          if (err.status === 404) {
            console.warn("⚠️ UUID no válido (404). Limpiando localStorage...");
            localStorage.removeItem("vita_user_uuid");
            setTimeout(() => {
              if (!cancelled) {
                setUserData(null);
                setUserStatus(null);
                setShowLoading(false);
              }
            }, 0);
            return;
          }

          // 🔴 SOLO si falla la red o el backend da 500 se muestra la pantalla de error de conexión
          console.error("❌ Error de red/servidor al verificar estado:", err);
          setTimeout(() => {
            if (!cancelled) {
              setConnectionError(true);
              setShowLoading(false);
            }
          }, 0);
          return;
        }
      } else {
        // No hay UUID guardado -> Registro limpio
        setTimeout(() => {
          if (!cancelled) {
            setShowLoading(false);
          }
        }, 0);
        return;
      }

      // -------------------------------------------------------
      // 3. CARGAR DATOS (Solo para usuarios APROBADOS)
      // -------------------------------------------------------

      try {
        console.log("📦 Cargando datos iniciales...");

        const [subjectsData, booksData] = await Promise.all([
          apiFetch("/matters").then((res) => {
            if (!res.ok) {
              throw new Error(`Error /matters: HTTP ${res.status}`);
            }
            return res.json();
          }),

          apiFetch("/books").then((res) => {
            if (!res.ok) {
              throw new Error(`Error /books: HTTP ${res.status}`);
            }
            return res.json();
          }),
        ]);

        if (cancelled) return;

        setSubjects(subjectsData);
        setBooks(booksData);
        setDataLoaded(true);

        console.log("📚 Datos iniciales cargados");

        // -----------------------------------------------------
        // 4. FECHA DEL SERVIDOR
        // -----------------------------------------------------

        const dateRes = await apiFetch("/server-date");

        if (!dateRes.ok) {
          throw new Error(`Error /server-date: HTTP ${dateRes.status}`);
        }

        const dateData = await dateRes.json();

        if (cancelled) return;

        setServerDate(dateData.date);

        // -----------------------------------------------------
        // 5. STATS LOCALES
        // -----------------------------------------------------

        await initUserStats();

        if (cancelled) return;

        // -----------------------------------------------------
        // 6. SINCRONIZAR METADATA
        // -----------------------------------------------------

        await syncChaptersMeta();

        if (cancelled) return;

        // -----------------------------------------------------
        // 7. LISTO
        // -----------------------------------------------------

        setContentReady(true);

        console.log("🚀 Vita lista");
      } catch (err) {
        console.error("❌ Error durante la inicialización:", err);

        if (!cancelled) {
          setConnectionError(true);
          setShowLoading(false); // 👈 Apaga el loader en caso de excepción en la carga
        }
      }
    };

    startApp();

    return () => {
      cancelled = true;
    };
  }, []);

  // =========================================================
  // HANDLER REGISTRO DE USUARIO
  // =========================================================

  // Función auxiliar para obtener o generar el UUID único del dispositivo
  const getOrCreateDeviceUuid = () => {
    let deviceUuid = localStorage.getItem("vita_user_uuid");
    if (!deviceUuid) {
      deviceUuid = crypto.randomUUID(); // Genera UUID v4 estándar
      localStorage.setItem("vita_user_uuid", deviceUuid);
    }
    return deviceUuid;
  };

  const handleRegisterUser = async (nickname) => {
    // 1. Obtiene o crea el UUID local en este navegador/dispositivo
    const deviceUuid = getOrCreateDeviceUuid();

    // 2. Envía nickname + deviceUuid al backend
    const res = await apiFetch("/users/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname, deviceUuid }),
    });

    const data = await res.json();

    // 3. Si el servidor retorna error (ej: nickname ocupado), lanza la excepción para el modal
    if (!res.ok) {
      throw new Error(data.error || `Error HTTP ${res.status}`);
    }

    // 4. Guarda confirmación del estado retornado ('pending')
    setUserData(data);
    setUserStatus(data.status);
  };

  // MODIFICACIÓN 3: Handler para resetear visualmente el estado desde el modal ("Volver al inicio")
  const handleResetUserStatus = () => {
    setUserStatus(null);
    setUserData(null);
  };

  // =========================================================
  // VALIDAR RACHA
  // =========================================================

  useEffect(() => {
    if (!serverDate) return;
    validateStreak(serverDate);
  }, [serverDate]);

  // =========================================================
  // CONFIGURAR ALTURA DE LA APP
  // =========================================================

  useEffect(() => {
    const setAppHeight = () => {
      document.documentElement.style.setProperty(
        "--app-height",
        `${window.innerHeight}px`
      );
    };

    setAppHeight();

    window.addEventListener("resize", setAppHeight);

    return () => {
      window.removeEventListener("resize", setAppHeight);
    };
  }, []);

  // =========================================================
  // PWA
  // =========================================================

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    if (standalone) {
      console.log("📱 Vita está ejecutándose como PWA");
      setIsInstalled(true);
    } else {
      console.log("🌐 Vita está ejecutándose en navegador");
    }

    const handleBeforeInstallPrompt = (event) => {
      console.log("🔥 beforeinstallprompt DISPARADO");
      event.preventDefault();
      setDeferredPrompt(event);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  // =========================================================
  // REINTENTAR MANUALMENTE
  // =========================================================

  const retryConnection = async () => {
    console.log("🔄 Reintentando conexión manualmente...");

    setRetryingConnection(true);

    const connected = await checkConnection();

    if (connected) {
      window.location.reload();
    }

    setRetryingConnection(false);
  };

  // =========================================================
  // CONTROL DEL LOADER
  // =========================================================

  useEffect(() => {
    if (!contentReady) return;

    if (loadingFinishedRef.current) {
      return;
    }

    const elapsed = performance.now() - startTimeRef.current;
    const remaining = Math.max(0, 3000 - elapsed);

    const timer = setTimeout(() => {
      if (loadingFinishedRef.current) {
        return;
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          loadingFinishedRef.current = true;
          setShowLoading(false);
        });
      });
    }, remaining);

    return () => {
      clearTimeout(timer);
    };
  }, [contentReady]);

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <>
      {/* 1. Prioridad: Si hay error de conexión se muestra el OfflinePage directamente */}
      {connectionError ? (
        <OfflinePage
          onRetry={retryConnection}
          isRetrying={retryingConnection}
        />
      ) : showLoading ? (
        /* 2. Si sigue cargando y no hay error, muestra el loader morado */
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            width: "100vw",
            height: "100vh",
            backgroundColor: "#7f5af0",
          }}
        >
          <div
            className="Bobbleboddy-font"
            style={{
              margin: "0",
              maxWidth: "3.5em",
              fontSize: "2.5em",
            }}
          >
            Vita
          </div>
        </div>
      ) : userStatus !== "approved" ? (
        /* 3. Si el usuario no está registrado o su estado no es 'approved' */
        /* MODIFICACIÓN 4: Pasar props userData y onReset */
        <UserAuthModal
          userStatus={userStatus}
          userData={userData}
          onRegister={handleRegisterUser}
          onReset={handleResetUserStatus}
        />
      ) : isInstalled && dataLoaded ? (
        /* 4. Si está aprobado, la PWA está instalada y con datos, carga la App */
        <Router basename="/Vita">
          <Routes>
            <Route
              path="/"
              element={
                <BooksList
                  subjects={subjects}
                  books={books}
                />
              }
            />
            <Route
              path="/book/:bookId/chapter/:chapterId"
              element={<ChapterPage />}
            />
            <Route
              path="/game/:subjectId/:moduleSlug"
              element={<GamePage />}
            />
          </Routes>
        </Router>
      ) : (
        /* 5. Pantalla de instalación */
        <InstallPage deferredPrompt={deferredPrompt} />
      )}
    </>
  );
}