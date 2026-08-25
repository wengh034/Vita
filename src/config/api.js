const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://desktop-5fmemtd.tailad2723.ts.net/api";

export async function apiFetch(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;

  try {
    const response = await fetch(url, options);

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