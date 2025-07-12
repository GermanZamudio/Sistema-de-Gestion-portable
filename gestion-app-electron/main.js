
// main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');
const axios = require('axios');
const baseURL = 'http://localhost:3001';
const { ipcMain } = require('electron');

ipcMain.handle('api:get', async (event, ruta) => {
  try {
    const res = await axios.get(`${baseURL}${ruta}`);
    return res.data;
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('api:post', async (event, { ruta, data }) => {
  try {
    const res = await axios.post(`${baseURL}${ruta}`, data);
    return res.data;
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('api:delete', async (event, ruta) => {
  try {
    const res = await axios.delete(`${baseURL}${ruta}`);
    return res.data;
  } catch (error) {
    return { error: error.message };
  }
});
//express para pruebas POSTMAN
const express=require('express');
const cors=require('cors');

const initDatabase = require('./db/initDb');


//Inicializa base de Datos
initDatabase(); 

// ================= CRUD ==============
const api = express();
api.use(cors());

// AUMENTAMOS LÍMITE PARA ENVÍO DE IMAGENES EN BASE64
api.use(express.json({ limit: '10mb' }));
api.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rutas
const generalesRoutes = require('./routes/generales.routes');
const licitacionRoutes = require('./routes/licitacion.routes');
const ordenCompraRoutes = require('./routes/ordenCompra.routes');
const ordenServicioRoutes = require('./routes/ordenServicio.routes');
const edificiosRoutes = require('./routes/edificios.routes');
const inventarioRoutes = require('./routes/inventario.routes');

// Asignamos rutas con prefijos si querés
api.use('/api/generico', generalesRoutes);              
api.use('/api', licitacionRoutes);    
api.use('/api', ordenCompraRoutes); 
api.use('/api', ordenServicioRoutes);
api.use('/api/edificios', edificiosRoutes);  
api.use('/api/inventario', inventarioRoutes);  

 
//Levantar el servidor (POSTMAN va a esto)
api.listen(3001,()=>{
  console.log('API escuchando en http://localhost:3001')
})

// =============== Ventana Electron =================
function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // opcional, pero buena práctica
    },
  });

  // Durante desarrollo, cargamos el servidor de Vite
  win.loadURL('http://localhost:5173');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // En macOS es común reabrir la app si no hay ventanas abiertas
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  // En macOS las apps suelen mantenerse abiertas hasta que el usuario cierra explícitamente
  if (process.platform !== 'darwin') app.quit();
});
