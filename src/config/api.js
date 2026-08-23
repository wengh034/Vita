
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
const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://desktop-5fmemtd.tailad2723.ts.net/api";

export async function apiFetch(endpoint, options = {}) {
  const response = await fetch(
    `${API_URL}${endpoint}`,
    options
  );

  if (!response.ok) {
    throw new Error(
      `API error ${response.status}: ${response.statusText}`
    );
  }

  return response;
}