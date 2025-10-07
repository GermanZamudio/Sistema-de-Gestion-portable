// db.js (en la raíz de gestion-app-electron)
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function getDbPath() {
  // Prioridad: ruta pasada por env
  if (process.env.DB_PATH) return process.env.DB_PATH;

  // Intentamos leer electron.app (puede no existir en algunos scripts)
  let electronApp = null;
  try { electronApp = require('electron').app; } catch (_) {}

  // DEV (no empaquetado): usar archivo del repo
  if (!electronApp || !electronApp.isPackaged) {
    const devDb = path.join(__dirname, 'db', 'gestion.sqlite');
    ensureDir(path.dirname(devDb));
    return devDb;
  }

  // PROD (empaquetado): <carpeta del exe>/data/app.db  (100% portable/escribible)
  const exeDir = process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(process.execPath);
  const dataDir = path.join(exeDir, 'data');
  ensureDir(dataDir);
  const dbPath = path.join(dataDir, 'app.db');

  // Si no existe, copiar semilla de resources/db/gestion.sqlite (si está)
  if (!fs.existsSync(dbPath)) {
    const seed = path.join(process.resourcesPath, 'db', 'gestion.sqlite');
    try {
      if (fs.existsSync(seed)) fs.copyFileSync(seed, dbPath);
      else fs.closeSync(fs.openSync(dbPath, 'a')); // crea vacío
    } catch (_) {
      try { fs.closeSync(fs.openSync(dbPath, 'a')); } catch (_) {}
    }
  }
  return dbPath;
}

const dbPath = getDbPath();
console.log('📘 DB usada:', dbPath);

const db = new Database(dbPath, { fileMustExist: false });
module.exports = db;
