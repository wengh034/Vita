const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://negation-subsoil-ramp.ngrok-free.dev/api";

export async function apiFetch(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;

  // Fusionamos los headers existentes con la cabecera necesaria para ngrok
  const headers = {
    "ngrok-skip-browser-warning": "69420", // 👈 Salta la pantalla de advertencia de ngrok
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // Intentamos leer el mensaje JSON enviado por el backend
      let serverErrorMessage = "";
      try {
        const errorData = await response.json();
        serverErrorMessage = errorData.error || errorData.message || "";
      } catch (e) {
        // Si la respuesta no era JSON, dejamos la cadena vacía
      }

      // Preparamos el mensaje de error final
      const finalMessage = serverErrorMessage || `API error ${response.status}: ${response.statusText}`;

      console.warn(`⚠️ Respuesta HTTP ${response.status} en ${endpoint}:`, finalMessage);

      // Creamos el error y le adjuntamos el status HTTP exacto (400, 404, etc.)
      const error = new Error(finalMessage);
      error.status = response.status;
      throw error;
    }

    return response;

  } catch (error) {
    // Si la llamada fetch falló por falta de conexión completa a internet o ngrok caído
    if (!error.status) {
      console.error("❌ Fallo crítico de red/conexión:", error);
    }
    throw error;
  }
}