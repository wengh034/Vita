
// const API_URL =
//   import.meta.env.VITE_API_URL || "/api";

// export async function apiFetch(endpoint, options = {}) {
//   const response = await fetch(
//     `${API_URL}${endpoint}`,
//     options
//   );

//   if (!response.ok) {
//     throw new Error(
//       `API error ${response.status}: ${response.statusText}`
//     );
//   }

//   return response;
// }
const API_URL = import.meta.env.VITE_API_URL || "https://desktop-5fmemtd.tailad2723.ts.net/api"; export async function apiFetch(endpoint, options = {}) { const url = `${API_URL}${endpoint}`; console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"); console.log("🔥 [API FETCH]"); console.log("📌 VITE_API_URL:", import.meta.env.VITE_API_URL); console.log("📌 API_URL usada:", API_URL); console.log("📌 Endpoint:", endpoint); console.log("🌐 URL FINAL:", url); console.log("📡 Method:", options.method || "GET"); console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"); try { const response = await fetch(url, options); console.log("✅ [API RESPONSE]"); console.log("🌐 URL:", url); console.log("📡 Status:", response.status); console.log("📡 Status text:", response.statusText); if (!response.ok) { console.error( "❌ [API ERROR]", response.status, response.statusText, url ); throw new Error( `API error ${response.status}: ${response.statusText}` ); } return response; } catch (error) { console.error("💥 [API FETCH FAILED]"); console.error("🌐 URL:", url); console.error("📌 API_URL:", API_URL); console.error("📌 Endpoint:", endpoint); console.error("❌ Error:", error); throw error; } }