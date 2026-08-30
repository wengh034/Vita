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
      console.error(
        "API error:",
        response.status,
        response.statusText,
        url
      );

      throw new Error(
        `API error ${response.status}: ${response.statusText}`
      );
    }

    return response;

  } catch (error) {
    console.error("API fetch failed:", error);
    throw error;
  }
}