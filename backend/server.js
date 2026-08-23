import express from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "node:path";
import cors from "cors";
import { fileURLToPath } from "node:url";

const app = express();

// ============================================================
// LOGGING
// ============================================================

const log = {
  info: (...args) => console.log("ℹ️ [INFO]", ...args),
  success: (...args) => console.log("✅ [OK]", ...args),
  warn: (...args) => console.warn("⚠️ [WARN]", ...args),
  error: (...args) => console.error("❌ [ERROR]", ...args),
  request: (...args) => console.log("🌐 [API]", ...args),
  ai: (...args) => console.log("🤖 [AI]", ...args),
  db: (...args) => console.log("💾 [DB]", ...args),
  system: (...args) => console.log("⚙️ [SYSTEM]", ...args),
};

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(cors({
  origin: [
    "https://wengh034.github.io",
    "http://localhost:5173",
  ],
}));

app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Private-Network",
    "true"
  );

  next();
});

app.use(express.json());

// Logger global de peticiones API
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;

    log.request(
      `${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`
    );
  });

  next();
});

// ============================================================
// PATHS
// ============================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "vita.db");

// ============================================================
// DB
// ============================================================

const db = await open({
  filename: dbPath,
  driver: sqlite3.Database,
});

log.db(`SQLite conectado: ${dbPath}`);

// ============================================================
// API ROUTER
// ============================================================

const api = express.Router();


// ============================================================
// HEALTH
// ============================================================

api.get("/health", (req, res) => {
  res.json({
    status: "ok",
  });
});


// ============================================================
// PRUEBA DE ENDPOINTS PARA MINIJUEGOS
// ============================================================

api.get("/modules/:subjectId", async (req, res) => {
  const subjectId = req.params.subjectId;

  const modules = await db.all(
    `SELECT * 
     FROM interactive_modules 
     WHERE idSubject = ? 
       AND is_active = 1`,
    [subjectId]
  );

  res.json(modules);
});


// ============================================================
// IA — EXPLICACIÓN DE RESPUESTA INCORRECTA CON GEMINI
// ============================================================

api.post("/ai/explain-answer", async (req, res) => {
  const { askId, subId } = req.body;

  if (!askId || subId === undefined || subId === null) {
    return res.status(400).json({
      error: "Faltan datos obligatorios (askId, subId)",
    });
  }

  try {
    const ask = await db.get(
      `
      SELECT 
        A.idAsk, 
        A.question, 
        C.idChapter,
        C.chapter AS chapterName, 
        C.position AS chapterNum,
        B.idBook,
        B.name AS bookName
      FROM Ask A
      JOIN Chapter C ON A.chapter = C.idChapter
      JOIN Book B ON C.book = B.idBook
      WHERE A.idAsk = ?
      `,
      [askId]
    );

    const answerRow = await db.get(
      `SELECT answer FROM Answer WHERE ask = ?`,
      [askId]
    );

    if (!ask || !answerRow) {
      return res.status(404).json({
        error: "Pregunta u opciones no encontradas",
      });
    }

    const options = JSON.parse(answerRow.answer || "[]");

    const selectedOption = options.find(
      (opt) => Number(opt.subId) === Number(subId)
    );

    const correctOption = options.find(
      (opt) => opt.is_correct === 1 || opt.is_correct === true
    );

    if (!selectedOption || !correctOption) {
      return res.status(404).json({
        error: "Opción seleccionada o correcta no encontrada",
      });
    }

    // Cache
    if (selectedOption.explanation) {
      log.ai(
        `Explicación encontrada en cache — pregunta ${askId}, opción ${subId}`
      );

      return res.json({
        explanation: selectedOption.explanation,
        cached: true,
      });
    }

    log.ai("----------------------------------------");
    log.ai("Consulta IA - Explicación");
    log.ai(
      `Pregunta (ID ${ask.idAsk}): "${ask.question}"`
    );
    log.ai(
      `Libro (ID ${ask.idBook}): "${ask.bookName}"`
    );
    log.ai(
      `Capítulo (ID ${ask.idChapter}): "${ask.chapterName}" (Posición: ${ask.chapterNum})`
    );
    log.ai("----------------------------------------");

    const { explainWrongAnswer } = await import(
      "./services/geminiService.js"
    );

    const result = await explainWrongAnswer({
      question: ask.question,
      selectedAnswer:
        selectedOption.text || selectedOption.answer,
      correctAnswer:
        correctOption.text || correctOption.answer,
      bookId: ask.idBook,
      chapterNum: ask.chapterNum,
    });

    if (result.success && result.explanation) {
      selectedOption.explanation = result.explanation;

      await db.run(
        `UPDATE Answer SET answer = ? WHERE ask = ?`,
        [JSON.stringify(options), askId]
      );

      log.ai(
        `Explicación generada y almacenada — pregunta ${askId}, opción ${subId}`
      );
    }

    res.json({
      explanation: result.explanation,
      errorCode: result.errorCode || null,
      cached: false,
    });

  } catch (error) {
    log.error(
      "Error en /api/ai/explain-answer:",
      error
    );

    res.status(500).json({
      error: "Error al generar la explicación.",
    });
  }
});


// ============================================================
// ADMIN — MASSIVE CREATE
// ============================================================

api.post("/admin/questions/batch", async (req, res) => {
  const {
    matter,
    book,
    chapter,
    questions,
  } = req.body;

  if (!chapter) {
    return res.status(400).json({
      error: "Capítulo obligatorio",
    });
  }

  if (!questions || questions.length === 0) {
    return res.status(400).json({
      error: "No hay preguntas para subir",
    });
  }

  try {
    await db.run("BEGIN TRANSACTION");

    // --------------------------------------------------------
    // Materia
    // --------------------------------------------------------

    let matterId = null;

    if (matter) {
      if (matter.id) {
        matterId = matter.id;
      } else if (matter.name) {
        const existingMatter = await db.get(
          `SELECT idMatter 
           FROM Matter 
           WHERE name = ?`,
          [matter.name]
        );

        if (existingMatter) {
          matterId = existingMatter.idMatter;
        } else {
          matterId = (
            await db.run(
              `INSERT INTO Matter(name) VALUES(?)`,
              [matter.name]
            )
          ).lastID;
        }
      }
    }

    // --------------------------------------------------------
    // Libro opcional
    // --------------------------------------------------------

    let bookId = null;

    if (book) {
      if (book.id) {
        bookId = book.id;
      } else if (book.name) {
        const existingBook = await db.get(
          `SELECT idBook 
           FROM Book 
           WHERE name = ? 
             AND matter IS ?`,
          [book.name, matterId]
        );

        if (existingBook) {
          bookId = existingBook.idBook;
        } else {
          bookId = (
            await db.run(
              `INSERT INTO Book(name, matter) 
               VALUES(?, ?)`,
              [book.name, matterId]
            )
          ).lastID;
        }
      }
    }

    // --------------------------------------------------------
    // Capítulo obligatorio
    // --------------------------------------------------------

    let chapterId = null;

    if (chapter) {
      if (chapter.id) {
        chapterId = chapter.id;
      } else if (chapter.name) {
        const existingChapter = await db.get(
          `SELECT idChapter 
           FROM Chapter 
           WHERE chapter = ? 
             AND book IS ?`,
          [chapter.name, bookId]
        );

        if (existingChapter) {
          chapterId = existingChapter.idChapter;
        } else {
          const posRow = await db.get(
            `SELECT MAX(position) as maxPos 
             FROM Chapter 
             WHERE book IS ?`,
            [bookId]
          );

          const nextPos = (posRow?.maxPos || 0) + 1;

          chapterId = (
            await db.run(
              `INSERT INTO Chapter(
                chapter, 
                book, 
                position
              ) VALUES(?, ?, ?)`,
              [
                chapter.name,
                bookId,
                nextPos,
              ]
            )
          ).lastID;
        }
      }
    }

    // --------------------------------------------------------
    // Preguntas
    // --------------------------------------------------------

    for (const q of questions) {
      let questionId = null;

      const existingQ = await db.get(
        `SELECT idAsk 
         FROM Ask 
         WHERE question = ? 
           AND chapter = ?`,
        [
          q.question,
          chapterId,
        ]
      );

      if (existingQ) {
        questionId = existingQ.idAsk;

        await db.run(
          `DELETE FROM Answer WHERE ask = ?`,
          [questionId]
        );
      } else {
        const { lastID } = await db.run(
          `INSERT INTO Ask(question, chapter) 
           VALUES(?, ?)`,
          [
            q.question,
            chapterId,
          ]
        );

        questionId = lastID;
      }

      const optionsJson = q.answers.map((ans, idx) => ({
        subId: idx + 1,
        text: ans.text,
        is_correct: ans.correct ? 1 : 0,
        explanation: ans.explanation || null,
      }));

      await db.run(
        `INSERT INTO Answer(ask, answer) 
         VALUES(?, ?)`,
        [
          questionId,
          JSON.stringify(optionsJson),
        ]
      );
    }

    await db.run("COMMIT");

    log.db(
      `Batch de preguntas procesado correctamente — capítulo ${chapterId}`
    );

    res.json({
      ok: true,
    });

  } catch (err) {
    await db.run("ROLLBACK");

    log.error(
      "Error en /api/admin/questions/batch:",
      err
    );

    res.status(500).json({
      error: "Error subiendo batch",
    });
  }
});


// ============================================================
// ADMIN — MATERIAS / LIBROS / CAPÍTULOS / PREGUNTAS
// ============================================================

api.get("/admin/matters", async (req, res) => {
  const rows = await db.all(`
    SELECT idMatter, name
    FROM Matter
    ORDER BY name
  `);

  res.json(rows);
});


api.get(
  "/admin/matters/:matterId/books",
  async (req, res) => {
    const { matterId } = req.params;

    const rows = await db.all(
      `
      SELECT idBook, name
      FROM Book
      WHERE matter = ?
      ORDER BY name
      `,
      [matterId]
    );

    res.json(rows);
  }
);


api.post("/admin/matters", async (req, res) => {
  const { name } = req.body;

  const { lastID } = await db.run(
    `INSERT INTO Matter(name) VALUES(?)`,
    [name]
  );

  res.json({
    idMatter: lastID,
    name,
  });
});


api.post("/admin/books", async (req, res) => {
  const {
    name,
    matter,
  } = req.body;

  const { lastID } = await db.run(
    `INSERT INTO Book(name, matter) VALUES(?, ?)`,
    [
      name,
      matter || null,
    ]
  );

  res.json({
    idBook: lastID,
    name,
    matter,
  });
});


api.get(
  "/admin/books/:bookId/chapters",
  async (req, res) => {
    const { bookId } = req.params;

    const rows = await db.all(
      `
      SELECT idChapter, chapter
      FROM Chapter
      WHERE book = ?
      ORDER BY position
      `,
      [bookId]
    );

    res.json(rows);
  }
);


api.get(
  "/admin/chapters/:chapterId/questions",
  async (req, res) => {
    const { chapterId } = req.params;

    const rows = await db.all(
      `
      SELECT idAsk, question
      FROM Ask
      WHERE chapter = ?
      ORDER BY idAsk DESC
      `,
      [chapterId]
    );

    res.json(rows);
  }
);


// ============================================================
// ADMIN — EDITAR PREGUNTA
// ============================================================

api.put(
  "/admin/asks/:idAsk",
  async (req, res) => {
    const { idAsk } = req.params;
    const {
      question,
      answers,
    } = req.body;

    if (!question || !Array.isArray(answers)) {
      return res.status(400).json({
        error: "Pregunta y respuestas son requeridas",
      });
    }

    try {
      await db.run("BEGIN TRANSACTION");

      await db.run(
        `UPDATE Ask 
         SET question = ? 
         WHERE idAsk = ?`,
        [
          question,
          idAsk,
        ]
      );

      const formattedOptions = answers.map(
        (ans, idx) => ({
          subId: ans.subId || idx + 1,
          text: ans.text || ans.answer,
          is_correct:
            ans.correct || ans.is_correct ? 1 : 0,
          explanation:
            ans.explanation || null,
        })
      );

      await db.run(
        `UPDATE Answer 
         SET answer = ? 
         WHERE ask = ?`,
        [
          JSON.stringify(formattedOptions),
          idAsk,
        ]
      );

      await db.run("COMMIT");

      res.json({
        ok: true,
      });

    } catch (err) {
      await db.run("ROLLBACK");

      log.error(
        "Error al actualizar la pregunta:",
        err
      );

      res.status(500).json({
        error: "Error actualizando pregunta",
      });
    }
  }
);


// ============================================================
// FECHA DEL SERVIDOR
// ============================================================

api.get("/server-date", (req, res) => {
  res.json({
    date: new Date().toISOString(),
  });
});


// ============================================================
// MATERIAS
// ============================================================

api.get("/matters", async (req, res) => {
  const rows = await db.all(
    `SELECT * FROM Matter`
  );

  res.json(rows);
});


api.get(
  "/matters/:id/books",
  async (req, res) => {
    const { id } = req.params;

    const rows = await db.all(
      `SELECT * 
       FROM Book 
       WHERE matter = ?`,
      [id]
    );

    res.json(rows);
  }
);


// ============================================================
// LIBROS
// ============================================================

api.get("/books", async (req, res) => {
  const rows = await db.all(
    `SELECT * FROM Book`
  );

  res.json(rows);
});


// ============================================================
// CAPÍTULOS
// ============================================================

api.get(
  "/books/:bookId/chapters",
  async (req, res) => {
    const { bookId } = req.params;

    const chapters = await db.all(
      `
      SELECT 
        idChapter, 
        chapter, 
        position 
      FROM Chapter 
      WHERE book = ? 
      ORDER BY position ASC
      `,
      [bookId]
    );

    res.json(chapters);
  }
);


// ============================================================
// PREGUNTA COMPLETA
// ============================================================

api.get(
  "/asks/:askId",
  async (req, res) => {
    const { askId } = req.params;

    const ask = await db.get(
      `
      SELECT 
        idAsk, 
        question, 
        explanation 
      FROM Ask 
      WHERE idAsk = ?
      `,
      [askId]
    );

    if (!ask) {
      return res.status(404).json({
        error: "Pregunta no encontrada",
      });
    }

    const answers = await db.all(
      `
      SELECT idAnswer, answer
      FROM Answer
      WHERE ask = ?
      ORDER BY RANDOM()
      `,
      [askId]
    );

    res.json({
      id: ask.idAsk,
      question: ask.question,
      answers,
    });
  }
);


// ============================================================
// VERIFICAR RESPUESTA
// ============================================================

api.post(
  "/asks/:askId/check",
  async (req, res) => {
    const { askId } = req.params;
    const { subId } = req.body;

    if (
      subId === undefined ||
      subId === null
    ) {
      return res.status(400).json({
        error: "Parámetro 'subId' es requerido",
      });
    }

    const row = await db.get(
      `SELECT answer 
       FROM Answer 
       WHERE ask = ?`,
      [askId]
    );

    if (!row) {
      return res.status(404).json({
        error: "Pregunta no encontrada",
      });
    }

    const options = JSON.parse(
      row.answer || "[]"
    );

    const selectedOption = options.find(
      (opt) =>
        Number(opt.subId) === Number(subId)
    );

    if (!selectedOption) {
      return res.status(400).json({
        error:
          `Opción con subId ${subId} no encontrada`,
      });
    }

    res.json({
      correct: !!selectedOption.is_correct,
      explanation:
        selectedOption.explanation || null,
    });
  }
);


// ============================================================
// PREGUNTAS POR CAPÍTULO
// ============================================================

api.post(
  "/chapters/:chapterId/asks",
  async (req, res) => {
    const { chapterId } = req.params;

    try {
      const rows = await db.all(
        `
        SELECT 
          Ask.idAsk, 
          Ask.question, 
          Answer.answer as optionsJson
        FROM Ask
        JOIN Answer 
          ON Ask.idAsk = Answer.ask
        WHERE Ask.chapter = ?
        `,
        [chapterId]
      );

      const questions = rows.map((r) => {
        const options = JSON.parse(
          r.optionsJson || "[]"
        );

        return {
          idAsk: r.idAsk,
          question: r.question,

          answers: options.map((opt) => ({
            subId: opt.subId,
            answer:
              opt.text || opt.answer,
            is_correct: opt.is_correct,
            explanation:
              opt.explanation || null,
          })),
        };
      });

      res.json(questions);

    } catch (err) {
      log.error(
        "Error obteniendo preguntas:",
        err
      );

      res.status(500).json({
        error: "Error al obtener preguntas",
      });
    }
  }
);


// ============================================================
// META DE CAPÍTULOS
// ============================================================

api.get(
  "/chapters/meta",
  async (req, res) => {
    try {
      const rows = await db.all(`
        SELECT 
          chapter AS idChapter,
          COUNT(*) AS version
        FROM Ask
        GROUP BY chapter
      `);

      res.json(rows);

    } catch (err) {
      log.error(
        "chapters/meta error:",
        err
      );

      res.status(500).json({
        error: "meta error",
      });
    }
  }
);


// ============================================================
// CONTEO DE PREGUNTAS
// ============================================================

api.get(
  "/chapters/:chapterId/count",
  async (req, res) => {
    const { chapterId } = req.params;

    const row = await db.get(
      `
      SELECT COUNT(*) AS total 
      FROM Ask 
      WHERE chapter = ?
      `,
      [chapterId]
    );

    res.json({
      total: row.total,
    });
  }
);


// ============================================================
// PREGUNTAS POR IDS
// ============================================================

api.post(
  "/asks/by-ids",
  async (req, res) => {
    const { ids } = req.body;

    if (!ids || ids.length === 0) {
      return res.json([]);
    }

    const placeholders = ids
      .map(() => "?")
      .join(",");

    const questions = await db.all(
      `
      SELECT *
      FROM Ask
      WHERE idAsk IN (${placeholders})
      `,
      ids
    );

    res.json(questions);
  }
);


// ============================================================
// REGISTRAR ROUTER
// ============================================================

app.use("/api", api);


// ============================================================
// ERROR HANDLER GLOBAL DE EXPRESS
// ============================================================

app.use((err, req, res, next) => {
  log.error(
    `Error no controlado en ${req.method} ${req.originalUrl}:`,
    err
  );

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    error: "Error interno del servidor",
  });
});


// ============================================================
// SERVER
// ============================================================

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  log.success(
    `Vita backend corriendo en puerto ${PORT}`
  );

  log.system(
    `API: http://localhost:${PORT}/api`
  );

  log.db(
    `Base de datos: ${dbPath}`
  );
});


// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================

let shuttingDown = false;

const shutdown = async (signal) => {
  if (shuttingDown) return;

  shuttingDown = true;

  log.system(
    `Recibida señal ${signal}. Cerrando servidor...`
  );

  server.close(async () => {
    try {
      await db.close();

      log.db("Base de datos cerrada.");

      log.success(
        "Servidor detenido correctamente."
      );

      process.exit(0);

    } catch (error) {
      log.error(
        "Error cerrando la base de datos:",
        error
      );

      process.exit(1);
    }
  });
};


// ============================================================
// PROCESS ERROR HANDLING
// ============================================================

process.on("uncaughtException", (error) => {
  log.error(
    "Uncaught Exception:",
    error
  );

  shutdown("uncaughtException");
});

process.on("unhandledRejection", (error) => {
  log.error(
    "Unhandled Rejection:",
    error
  );

  shutdown("unhandledRejection");
});

process.on("SIGINT", () => {
  shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});