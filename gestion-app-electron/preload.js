// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  get: (ruta) => ipcRenderer.invoke('api:get', ruta),
  post: (ruta, data) => ipcRenderer.invoke('api:post', { ruta, data }),
  delete: (ruta) => ipcRenderer.invoke('api:delete', ruta)
});
