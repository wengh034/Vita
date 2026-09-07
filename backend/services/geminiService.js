import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

export async function explainWrongAnswer({ question, selectedAnswer, correctAnswer, bookId, chapterNum }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ ERROR CRÍTICO: GEMINI_API_KEY no está definida en el archivo .env");
    return { success: false, explanation: "Error de configuración en el servidor." };
  }

  const ai = new GoogleGenAI({ apiKey });

  const envKey = `GEMINI_FILE_BOOK_${bookId}_CAP_${chapterNum}`;
  const chapterUri = process.env[envKey];

  if (chapterUri) {
    console.log(`🔗 Archivo cargado desde env [${envKey}]: ${chapterUri}`);
  } else {
    console.warn(`⚠️ No se encontró URI en .env para la clave: ${envKey}`);
  }

  const contents = [];

  if (chapterUri) {
    contents.push({
      fileData: {
        fileUri: chapterUri,
        mimeType: "application/pdf",
      },
    });
  }

  const prompt = `
Pregunta: "${question}"
Opción elegida por el alumno (INCORRECTA): "${selectedAnswer}"
Opción correcta (VERDADERA): "${correctAnswer}"

Instrucción: Explica en 15 a 30 palabras por qué "${selectedAnswer}" es una opción incorrecta.
`;

  contents.push({ text: prompt });

  const systemInstruction = `
Eres un tutor de examen para una pantalla móvil pequeña.

Reglas obligatorias de formato:
- Comienza la respuesta NOMBRANDO DIRECTAMENTE a la opción elegida o personaje.
- NUNCA uses introducciones como "Según el texto", "Hola", o "Esta opción es incorrecta porque".
- Escribe exactamente 1 oración completa explicativa.
- Al final de la respuesta, incluye entre corchetes el número de página IMPRESO que figura en las esquinas del libro (NUNCA el número de página del archivo PDF). Ejemplo: "[pág. 245]". Si no es visible en el fragmento, omite los corchetes.
- Finaliza siempre con un punto final.
`;

  // Modelo actualizado según el requerimiento actual de la API
  const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";

  try {
    const apiPromise = ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.1,
        maxOutputTokens: 250,
      },
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("TIMEOUT_EXCEEDED")), 15000)
    );

    const response = await Promise.race([apiPromise, timeoutPromise]);
    const explanationText = response.text ? response.text.trim() : "";

    if (explanationText) {
      return { success: true, explanation: explanationText };
    }
    return { success: false, explanation: "Opción incorrecta." };

  } catch (err) {
    console.error("❌ Error en Gemini API:", err.message || err);

    const isQuota =
      err.status === 429 ||
      err.statusCode === 429 ||
      err.message?.includes("429") ||
      err.message?.includes("RESOURCE_EXHAUSTED") ||
      err.message?.toLowerCase().includes("quota");

    if (isQuota) {
      return {
        success: false,
        errorCode: "QUOTA_EXCEEDED",
        explanation: "⚠️ [Error: Cuota de IA agotada]. Notifica al administrador para restablecer el servicio."
      };
    }

    return { success: false, explanation: "Opción incorrecta." };
  }
}