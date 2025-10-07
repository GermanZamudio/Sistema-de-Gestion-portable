// preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  // HTTP bridge
  get:    (ruta)         => ipcRenderer.invoke("api:get", ruta),
  post:   (ruta, data)   => ipcRenderer.invoke("api:post", { ruta, data }),
  delete: (ruta)         => ipcRenderer.invoke("api:delete", ruta),

  // Backups
  backupDB:     ()       => ipcRenderer.invoke("backup:run"),     // si querés mantener compat
  importDB:     ()       => ipcRenderer.invoke("backup:import"),
  backupCreate: ()       => ipcRenderer.invoke("backup:create"),  // “Guardar como…”
  backupQuick:  ()       => ipcRenderer.invoke("backup:quick"),   // directo a /backups
});
