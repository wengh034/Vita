import { openDB } from "idb";
import { apiFetch } from "./config/api.js";

const DB_NAME = "vitadb";
const DB_VERSION = 15;

export async function initDB() {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("books"))
        db.createObjectStore("books", { keyPath: "idBook" });

      if (!db.objectStoreNames.contains("chapters"))
        db.createObjectStore("chapters", { keyPath: "idChapter" });

      if (!db.objectStoreNames.contains("questions"))
        db.createObjectStore("questions", { keyPath: ["idChapter", "id"] });

      // Store para progreso de quiz
      if (!db.objectStoreNames.contains("quizProgress")) {
        const store = db.createObjectStore("quizProgress", { keyPath: ["idChapter", "idAsk"] });
        store.createIndex("byChapter", "idChapter");
        store.createIndex("byBook", "idBook");
      }
      //store para estadísticas de usuario
      if (!db.objectStoreNames.contains("userStats")) {
        db.createObjectStore("userStats", { keyPath: "key" });
      }
    },
  });

  return db;
}

// 1. Guardar forzando conversión a Number
export async function saveQuizAnswer({ idBook, idChapter, idAsk, status }) {
  const db = await initDB();
  const tx = db.transaction("quizProgress", "readwrite");
  const store = tx.objectStore("quizProgress");

  // Al usar idAsk único, .put() SOBRESCRIBE si la pregunta ya existía con status 0
  await store.put({
    idAsk: Number(idAsk),
    idBook: Number(idBook),
    idChapter: Number(idChapter),
    status: Number(status), // Si responde bien (1), sobrescribe el (0) anterior
    answeredAt: Date.now(),
  });

  await tx.done;
}
export async function getUserStats() {
  const db = await initDB();
  const tx = db.transaction("userStats", "readonly");
  const store = tx.objectStore("userStats");
  const stats = await store.get("stats");
  await tx.done;
  return stats;
}

export async function updateUserStats(updates) {
  const db = await initDB();
  const tx = db.transaction("userStats", "readwrite");
  const store = tx.objectStore("userStats");

  const stats = await store.get("stats") || {};
  await store.put({ ...stats, ...updates, key: "stats" });

  await tx.done;
  return { ...stats, ...updates };
}


// Leer preguntas respondidas de un capítulo
export async function getAnsweredQuestions(idChapter) {
  const db = await initDB();
  const store = db.transaction("quizProgress", "readonly").objectStore("quizProgress");
  const all = await store.getAll();
  return all.filter(q => Number(q.idChapter) === Number(idChapter));
}
// IDs de preguntas respondidas
export async function getAnsweredIds(idChapter) {
  const db = await initDB();
  const store = db.transaction("quizProgress", "readonly").objectStore("quizProgress");
  const all = await store.getAll();

  // Devuelve las preguntas que ya fueron respondidas CORRECTAMENTE (status === 1)
  const latestMap = new Map();
  all.forEach((item) => {
    if (Number(item.idChapter) === Number(idChapter)) {
      latestMap.set(Number(item.idAsk), Number(item.status));
    }
  });

  const correctIds = [];
  latestMap.forEach((status, idAsk) => {
    if (status === 1) {
      correctIds.push(idAsk);
    }
  });

  return correctIds;
}
// guardar meta de capítulo
export async function saveChapterMeta({ idChapter, total, version }) {
  const db = await initDB();
  await db.put("chapters", {
    idChapter,
    total,
    version,
    updatedAt: Date.now(),
  });
}

// leer meta
export async function getChapterMeta(idChapter) {
  const db = await initDB();
  return db.get("chapters", Number(idChapter));
}
// inicializar estadísticas de usuario
export async function initUserStats() {
  const db = await initDB();
  const tx = db.transaction("userStats", "readwrite");
  const store = tx.objectStore("userStats");

  const existing = await store.get("stats");
  if (!existing) {
    await store.put({
      key: "stats",
      atp: 15,
      enthalpy: 0,
      lastEnthalpyDate: null,
    });
  }

  await tx.done;
}

// actualizar ATP de usuario
export async function getUserATP() {
  const db = await initDB();
  const stats = await db.get("userStats", "stats");
  return stats?.atp ?? 0;
}
// sumar ATP de usuario
// export async function addUserATP(amount) {
//   const db = await initDB();
//   const tx = db.transaction("userStats", "readwrite");
//   const store = tx.objectStore("userStats");

//   const stats = await store.get("stats");

//   const updated = {
//     ...stats,
//     atp: Math.max(0, stats.atp + amount)
//   };

//   await store.put(updated);
//   await tx.done;

//   return updated.atp;
// }
export async function addUserATP(amount) {
  const db = await initDB();
  const tx = db.transaction("userStats", "readwrite");
  const store = tx.objectStore("userStats");

  const stats = await store.get("stats");

  // validación
  if (amount < 0 && stats.atp < Math.abs(amount)) {
    await tx.done;
    return false; //atp insuficiente
  }

  const updated = {
    ...stats,
    atp: stats.atp + amount
  };

  await store.put(updated);
  await tx.done;

  return true; //listo
}

export async function syncChaptersMeta() {
  const metaRes = await apiFetch("/chapters/meta");
  const serverMeta = await metaRes.json();

  for (const m of serverMeta) {
    const local = await getChapterMeta(m.idChapter);

    if (!local || local.version !== m.version) {
      const countRes = await apiFetch(
        `/chapters/${m.idChapter}/count`
      );
      const { total } = await countRes.json();

      await saveChapterMeta({
        idChapter: m.idChapter,
        total,
        version: m.version,
      });
    }
  }
}
export async function getWrongAnsweredIds({ idBook, idChapter }) {
  const db = await initDB();
  const store = db.transaction("quizProgress", "readonly").objectStore("quizProgress");
  const all = await store.getAll();

  // Creamos un Map por idAsk para obtener ÚNICAMENTE el estado más reciente de cada pregunta
  const latestMap = new Map();
  
  all.forEach((item) => {
    if (
      Number(item.idBook) === Number(idBook) &&
      Number(item.idChapter) === Number(idChapter)
    ) {
      latestMap.set(Number(item.idAsk), Number(item.status));
    }
  });

  const wrongIds = [];
  latestMap.forEach((status, idAsk) => {
    if (status === 0) {
      wrongIds.push(idAsk);
    }
  });

  return wrongIds;
}
export async function updateStreak() {
  const db = await initDB();
  const tx = db.transaction("userStats", "readwrite");
  const store = tx.objectStore("userStats");

  const stats = (await store.get("stats")) || {
    key: "stats",
    atp: 15,
    enthalpy: 0,
    lastEnthalpyDate: null,
  };

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0]; // "YYYY-MM-DD"
  
  const lastDateStr = stats.lastEnthalpyDate
    ? new Date(stats.lastEnthalpyDate).toISOString().split("T")[0]
    : null;

  // Si ya hizo un quiz hoy, mantiene la racha del día sin duplicar
  if (lastDateStr === todayStr) {
    await tx.done;
    return stats.enthalpy;
  }

  // Verificar si la última actividad fue ayer
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  let newEnthalpy = stats.enthalpy || 0;

  if (lastDateStr === yesterdayStr) {
    newEnthalpy += 1; // Continuó la racha del día anterior
  } else {
    newEnthalpy = 1;  // Inicia racha nueva en 1
  }

  const updatedStats = {
    ...stats,
    enthalpy: newEnthalpy,
    lastEnthalpyDate: now.toISOString(),
    key: "stats",
  };

  await store.put(updatedStats);
  await tx.done;
  return newEnthalpy;
}