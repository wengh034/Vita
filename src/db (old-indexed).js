import { openDB } from "idb";

const DB_NAME = "vitadb";


// export async function initDB() {
//   const db = await openDB(DB_NAME, 14, {
//     upgrade(db) {
//       if (!db.objectStoreNames.contains("books"))
//         db.createObjectStore("books", { keyPath: "idBook" });

//       if (!db.objectStoreNames.contains("chapters"))
//         db.createObjectStore("chapters", { keyPath: "idChapter" });

//       if (db.objectStoreNames.contains("questions")) {
//         db.deleteObjectStore("questions"); // 👈 elimina la vieja definición (solo 1 vez)
//       }

//       // ✅ Clave compuesta: capítulo + id de pregunta
//       const qStore = db.createObjectStore("questions", { keyPath: ["idChapter", "id"] });

//       // Índices opcionales (para búsquedas rápidas)
//       qStore.createIndex("byChapter", "idChapter");
//       qStore.createIndex("byBook", "idBook");
//     },
//   });

//   return db;
// }
export async function initDB() {
  const db = await openDB(DB_NAME, 14, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("books"))
        db.createObjectStore("books", { keyPath: "idBook" });

      if (!db.objectStoreNames.contains("chapters"))
        db.createObjectStore("chapters", { keyPath: "idChapter" });

      // ❌ Eliminamos la store solo si no existe una clave compuesta correcta (upgrade real)
      if (!db.objectStoreNames.contains("questions")) {
        const qStore = db.createObjectStore("questions", { keyPath: ["idChapter", "id"] });
        qStore.createIndex("byChapter", "idChapter");
        qStore.createIndex("byBook", "idBook");
      }
      // ⚠️ No borrar la store existente aquí
    },
  });

  return db;
}


// ---------- Guardar ----------
export async function saveBooks(books) {
  const db = await initDB();
  const tx = db.transaction("books", "readwrite");
  for (const book of books) await tx.store.put(book);
  await tx.done;
}

export async function saveChapters(chapters) {
  const db = await initDB();
  const tx = db.transaction("chapters", "readwrite");
  for (const ch of chapters) await tx.store.put(ch);
  await tx.done;
}


// export async function saveQuestions(chapter) {
//   const db = await initDB();
//   const tx = db.transaction("questions", "readwrite");

//   for (const q of chapter.questions) {
//     await tx.store.put({
//       ...q,
//       idBook: chapter.idBook,
//       bookName: chapter.bookName,
//       idChapter: Number(chapter.chapter), // 👈 usar "chapter" del JSON
//       chapterName: chapter.chapterName,
//     });
//   }

//   await tx.done;
// }

// export async function saveQuestionsMerge(chapter) {
//   const db = await initDB();
//   const tx = db.transaction("questions", "readwrite");
//   const store = tx.objectStore("questions");

//   for (const q of chapter.questions) {
//     const key = [Number(chapter.chapter), q.id]; // clave compuesta
//     const existing = await store.get(key);

//     const questionToSave = {
//       ...q,
//       idBook: chapter.idBook,
//       bookName: chapter.bookName,
//       idChapter: Number(chapter.chapter),
//       chapterName: chapter.chapterName,
//       status: "pending", // forzamos pending
//     };

//     if (existing) {
//       // actualizamos el contenido, pero reiniciamos status
//       await store.put(questionToSave);
//     } else {
//       // insertamos nueva pregunta
//       await store.add(questionToSave);
//     }
//   }

//   await tx.done;
//   console.log(`✅ Capítulo ${chapter.chapter} fusionado correctamente`);
// }
export async function saveQuestionsMerge(chapter) {
  const db = await openDB("vitadb", 14);
  const tx = db.transaction("questions", "readwrite");
  const store = tx.objectStore("questions");

  for (const q of chapter.questions) {
    const key = [Number(chapter.chapter), q.id];
    const existing = await store.get(key);

    const questionToSave = {
      ...q,
      idBook: chapter.idBook,
      bookName: chapter.bookName,
      idChapter: Number(chapter.chapter),
      chapterName: chapter.chapterName,
      // ✅ conserva estado si ya existe
      status: existing?.status || "pending",
    };

    if (existing) {
      // solo actualizamos texto o metadatos
      await store.put({ ...existing, ...questionToSave });
    } else {
      await store.add(questionToSave);
    }
  }

  await tx.done;
  console.log(`✅ Capítulo ${chapter.chapter} fusionado correctamente`);
}




// ---------- Leer ----------
export async function getBooks() {
  const db = await initDB();
  return db.getAll("books");
}
export async function getBook(idBook) {
  const db = await initDB();
  return db.get("books", idBook);
}

export async function getChapters(bookId) {
  const db = await initDB();
  const all = await db.getAll("chapters");
  return all.filter(ch => ch.idBook === bookId);
}

export async function updateChapterProgress(idChapter, progress) {
  const db = await initDB();
  const tx = db.transaction("chapters", "readwrite");
  const store = tx.objectStore("chapters");

  // 👇 fuerza número
  const key = Number(idChapter);

  const chapter = await store.get(key);
  if (!chapter) {
    console.warn("Capítulo no encontrado:", key);
    return;
  }

  chapter.progress = progress;
  await store.put(chapter);
  await tx.done;
  console.log("Progreso actualizado:", key, progress);
}

export async function getQuestions(idChapter) {
  const db = await initDB();
  const all = await db.getAll("questions");
  return all.filter(q => q.idChapter === Number(idChapter));
}




export async function updateQuestion(question) {
  const db = await initDB();
  const tx = db.transaction("questions", "readwrite");
  const store = tx.objectStore("questions");
  await store.put(question);
  await tx.done;
}
