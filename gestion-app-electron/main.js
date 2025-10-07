// main.js
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const express = require("express");
const cors = require("cors");

// ------------------ Helpers DB/Paths ------------------
function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function resolveDbPath() {
  const customPath = process.env.DB_PATH;
  if (customPath && fs.existsSync(customPath)) return customPath;

  // Fallback: usa la carpeta data dentro del ejecutable
  const baseDir = process.resourcesPath || __dirname;
  const dbDir = path.join(baseDir, "data");
  ensureDir(dbDir);
  return path.join(dbDir, "app.db");
}

function ensureBackupsFolderFor(dbPath) {
  const dir = path.join(path.dirname(dbPath), "backups");
  ensureDir(dir);
  return dir;
}

let BASE_URL = null;
let globalDb = null;

// ------------------ DB Init ------------------
const initDatabase = require("./db/db.js");

// ------------------ Rutas Express ------------------
const generalesRoutes = require("./routes/generales.routes");
const licitacionRoutes = require("./routes/licitacion.routes");
const ordenCompraRoutes = require("./routes/ordenCompra.routes");
const ordenServicioRoutes = require("./routes/ordenServicio.routes");
const edificiosRoutes = require("./routes/edificios.routes");
const inventarioRoutes = require("./routes/inventario.routes");

async function startApiServer() {
  const api = express();
  api.use(cors());
  api.use(express.json({ limit: "10mb" }));
  api.use(express.urlencoded({ extended: true, limit: "10mb" }));

  api.use("/api/generico", generalesRoutes);
  api.use("/api", licitacionRoutes);
  api.use("/api", ordenCompraRoutes);
  api.use("/api", ordenServicioRoutes);
  api.use("/api/edificios", edificiosRoutes);
  api.use("/api/inventario", inventarioRoutes);

  await new Promise((resolve) => {
    const server = api.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      BASE_URL = `http://127.0.0.1:${port}`;
      console.log("API interna corriendo en:", BASE_URL);
      resolve();
    });
    app.on("before-quit", () => {
      try { server.close(); } catch (_) {}
    });
  });
}

// ------------------ IPC HTTP Bridge ------------------
ipcMain.handle("api:get", async (_e, ruta) => {
  try {
    const r = await axios.get(`${BASE_URL}${ruta}`);
    return r.data;
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle("api:post", async (_e, { ruta, data }) => {
  try {
    const r = await axios.post(`${BASE_URL}${ruta}`, data);
    return r.data;
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle("api:delete", async (_e, ruta) => {
  try {
    const r = await axios.delete(`${BASE_URL}${ruta}`);
    return r.data;
  } catch (error) {
    return { error: error.message };
  }
});

// ------------------ IPC Backups ------------------
ipcMain.handle("backup:create", async () => {
  try {
    const dbPath = resolveDbPath();
    try { globalDb?.prepare?.("PRAGMA wal_checkpoint(TRUNCATE)")?.run?.(); } catch (_) {}

    const defaultDir = ensureBackupsFolderFor(dbPath);
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: "Guardar backup de base de datos",
      defaultPath: path.join(defaultDir, `backup_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.db`),
      filters: [{ name: "SQLite DB", extensions: ["db"] }],
    });

    if (canceled || !filePath) return { ok: false, canceled: true };
    fs.copyFileSync(dbPath, filePath);
    return { ok: true, path: filePath };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle("backup:quick", async () => {
  try {
    const dbPath = resolveDbPath();
    try { globalDb?.prepare?.("PRAGMA wal_checkpoint(TRUNCATE)")?.run?.(); } catch (_) {}
    const backupsDir = ensureBackupsFolderFor(dbPath);
    const dest = path.join(backupsDir, `backup_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.db`);
    fs.copyFileSync(dbPath, dest);
    return { ok: true, path: dest };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle("backup:import", async () => {
  try {
    const dbPath = resolveDbPath();
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: "Selecciona un backup .db",
      filters: [{ name: "SQLite DB", extensions: ["db"] }],
      properties: ["openFile"],
      defaultPath: ensureBackupsFolderFor(dbPath),
    });
    if (canceled || !filePaths?.[0]) return { ok: false, canceled: true };
    fs.copyFileSync(filePaths[0], dbPath);
    return { ok: true, path: dbPath };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// ------------------ Ventana ------------------
function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 800,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  win.webContents.on('did-fail-load', (_e, code, desc, url) => {
    console.error('did-fail-load', { code, desc, url });
  });
  win.webContents.on('render-process-gone', (_e, details) => {
    console.error('render-process-gone', details);
  });
  win.webContents.on('console-message', (_e, level, message, line, sourceId) => {
    console.log('[Renderer]', { level, message, line, sourceId });
  });

  win.once("ready-to-show", () => win.show());

  const isDev = !app.isPackaged;
  if (isDev) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL || "http://localhost:5173");
    // win.webContents.openDevTools({ mode: 'detach' });
  } else {
    const prodIndex = path.join(process.resourcesPath, "renderer", "dist", "index.html");
    // Cualquiera de las dos funciona; probá loadFile que es más simple:
    win.loadFile(prodIndex); // <- recomendado
    // win.loadURL(`file://${prodIndex}`);
  }
}
// ------------------ App Lifecycle ------------------
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.whenReady().then(async () => {
    const dbPath = resolveDbPath();
    globalDb = initDatabase(dbPath);
    await startApiServer();
    createWindow();
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
