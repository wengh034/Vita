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

// Guardar respuesta de una pregunta
export async function saveQuizAnswer({ idBook, idChapter, idAsk, status }) {
  const db = await initDB();
  const tx = db.transaction("quizProgress", "readwrite");
  const store = tx.objectStore("quizProgress");

  await store.put({
    idBook,
    idChapter,
    idAsk,
    status,       // 0 = incorrecto, 1 = correcto
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
  return all.filter(q => q.idChapter === Number(idChapter));
}

// IDs de preguntas respondidas
export async function getAnsweredIds(idChapter) {
  const answered = await getAnsweredQuestions(idChapter);
  return answered.map(q => q.idAsk);
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

  return all
    .filter(q =>
      q.idBook === idBook &&
      q.idChapter === idChapter &&
      q.status === 0
    )
    .map(q => q.idAsk);
}
