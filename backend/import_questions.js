import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sqlite3 from 'sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { verbose } = sqlite3;
const sqlite = verbose();

// Obtener argumentos de la línea de comandos
const args = process.argv.slice(2);
const filePath = args[0];
const chapterArg = args.find(arg => arg.startsWith('--chapter='));

if (!filePath || !chapterArg) {
  console.error("Uso: node import_questions.js <ruta_archivo.txt> --chapter=<idChapter>");
  process.exit(1);
}

const chapterId = parseInt(chapterArg.split('=')[1], 10);
const dbPath = path.join(__dirname, 'vita.db');

if (!fs.existsSync(dbPath)) {
  console.error(`Error: No se encontró la base de datos en ${dbPath}`);
  process.exit(1);
}

const db = new sqlite.Database(dbPath);

// Leer y parsear el archivo .txt
function parseTxtFile(pathToFile) {
  const content = fs.readFileSync(pathToFile, 'utf8');
  const lines = content.split(/\r?\n/);
  const questions = [];

  let currentQuestion = null;
  let jsonBuffer = '';
  let insideJson = false;

  for (let line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('*')) {
      if (currentQuestion && jsonBuffer) {
        currentQuestion.answers = JSON.parse(jsonBuffer);
        questions.push(currentQuestion);
        jsonBuffer = '';
        insideJson = false;
      }
      currentQuestion = { question: trimmed.substring(1).trim() };
    } else if (trimmed.startsWith('[')) {
      insideJson = true;
      jsonBuffer += line + '\n';
    } else if (insideJson) {
      jsonBuffer += line + '\n';
      if (trimmed.startsWith(']')) {
        insideJson = false;
      }
    }
  }

  if (currentQuestion && jsonBuffer) {
    currentQuestion.answers = JSON.parse(jsonBuffer);
    questions.push(currentQuestion);
  }

  return questions;
}

// Envolver db.run en una Promesa
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

// Función principal asíncrona
async function main() {
  try {
    const parsedQuestions = parseTxtFile(filePath);
    console.log(`Se encontraron ${parsedQuestions.length} preguntas en el archivo.`);

    // Activar claves foráneas y empezar la transacción
    await dbRun("PRAGMA foreign_keys = ON;");
    await dbRun("BEGIN TRANSACTION;");

    let count = 0;

    // Usamos un bucle for...of clásico para que respete el "await"
    for (const q of parsedQuestions) {
      // 1. Insertar en tabla Ask
      const askResult = await dbRun(
        "INSERT INTO Ask (question, chapter) VALUES (?, ?)", 
        [q.question, chapterId]
      );
      
      const askId = askResult.lastID; // ID generado secuencialmente

      // 2. Insertar en tabla Answer
      const answersJsonString = JSON.stringify(q.answers);
      await dbRun(
        "INSERT INTO Answer (answer, ask) VALUES (?, ?)", 
        [answersJsonString, askId]
      );

      count++;
    }

    // Si todo sale bien, guardamos los cambios definitivamente
    await dbRun("COMMIT;");
    console.log(`¡Éxito! Se insertaron ${count} preguntas y sus respuestas vinculadas correctamente al idChapter: ${chapterId}.`);

  } catch (error) {
    console.error("Error procesando el archivo o BD:", error.message);
    // Si algo falla, cancelamos la transacción completa
    db.run("ROLLBACK;");
  } finally {
    db.close();
  }
}

// Ejecutar el script
main();
