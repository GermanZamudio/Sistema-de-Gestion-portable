const express = require('express');
const router = express.Router();
const db = require('../db/db');
const multer = require('multer'); 
const { insertRecord,getRecordById } = require('../helpers/queries.js'); 


const uploadUso = multer({ storage: multer.memoryStorage() });
const uploadConsumo = multer({ storage: multer.memoryStorage() });




router.get('/existencias/:tipo', (req, res) => {
  try {
    const tipo = req.params.tipo.toUpperCase();
    const tiposValidos = ['STOCK', 'USO', 'CONSUMO', 'HERRAMIENTA'];
    console.log(tipo)
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({ error: 'Tipo de bien no válido' });
    }

    const resultados = db.prepare(`
    SELECT
      e.id AS existencia_id,
      e.cantidad,
      e.pendiente_a_entregar AS pendiente,
      u.nombre AS ubicacion,
      a.id AS articulo_id,
      a.nombre AS articulo_nombre,
      a.descripcion,
      a.imagen,
      a.tipo_bien 
    FROM articulo a
    LEFT JOIN existencia e ON a.id = e.articulo_asociado_id
    LEFT JOIN ubicacion u ON u.id = e.ubicacion_id
    WHERE a.tipo_bien = ?
    ORDER BY a.nombre
    `).all(tipo);

    console.log(resultados)
    const mapa = new Map();

    for (const fila of resultados) {
      const {
        articulo_id,
        articulo_nombre,
        descripcion,
        imagen,
        existencia_id,
        cantidad,
        pendiente,
        ubicacion
      } = fila;

      const imagenBase64 = imagen ? `data:image/jpeg;base64,${Buffer.from(imagen).toString('base64')}` : null;

      if (!mapa.has(articulo_id)) {
        mapa.set(articulo_id, {
          id: articulo_id,
          nombre: articulo_nombre,
          descripcion,
          imagen: imagenBase64,
          existencias: []
        });
      }

      mapa.get(articulo_id).existencias.push({
        id: existencia_id,
        cantidad,
        pendiente,
        ubicacion
      });
    }

    res.json(Array.from(mapa.values()));
  } catch (err) {
    console.error('Error al obtener existencias:', err.message);
    res.status(500).json({ error: 'Error al obtener existencias' });
  }
});

/******Orden de servicio*******/

router.post('/licitacion/uso', uploadUso.array('articulos[].imagen'), (req, res) => {
  try {
    // Los datos JSON vienen en req.body (campos de texto)
    // Los archivos están en req.files (array)

    const { nombre, año } = req.body;

    // Los articulos llegan en req.body.articulos, pero en multipart/form-data
    // req.body.articulos puede venir como string JSON, por lo que parseamos
    let articulos;
    if (typeof req.body.articulos === 'string') {
      articulos = JSON.parse(req.body.articulos);
    } else {
      articulos = req.body.articulos || [];
    }

    if (!nombre || !año || !Array.isArray(articulos)) {
      return res.status(400).json({ error: "Datos incompletos." });
    }

    const insertLicitacion = db.prepare(`
      INSERT INTO licitacion (nombre, año)
      VALUES (?, ?)
    `);

    const resultLicitacion = insertLicitacion.run(nombre, año);
    const licitacionId = resultLicitacion.lastInsertRowid;

    const insertArticulo = db.prepare(`
      INSERT INTO articulo (
        nombre, descripcion, codigo, precio, numero_serie, identificable,
        tipo_bien, licitacion_id, unidad_medida_id, categoria_id, marca_id, imagen
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertExistencia = db.prepare(`
      INSERT INTO existencia (
        cantidad, pendiente_a_entregar, articulo_asociado_id, ubicacion_id
      ) VALUES (?, 0, ?, ?)
    `);

    const identificables = [];

    // Mapear archivos por índice (orden) para vincular con articulos
    // multer guarda en req.files en orden de llegada, que coincide con articulos[]
    // Nota: el nombre del campo en multer es 'articulos[].imagen', pero puede variar según cómo envíes.
    // Para evitar problemas, lo ideal es enviar cada archivo con nombre 'imagen' y tenerlos en orden.

    for (let i = 0; i < articulos.length; i++) {
      const art = articulos[i];
      const {
        nombre,
        descripcion,
        codigo,
        precio,
        numero_serie,
        identificable,
        unidad_medida_id,
        categoria_id,
        marca_id,
        cantidad_existencia,
        ubicacion_id
      } = art;

      const tipo_bien = "USO";

      // Buscar archivo correspondiente (por orden)
      let imagenBuffer = null;
      if (req.files && req.files[i]) {
        imagenBuffer = req.files[i].buffer;
      }

      const resultArticulo = insertArticulo.run(
        nombre || '',
        descripcion || '',
        codigo || '',
        precio || 0,
        numero_serie || '',
        identificable ? 1 : 0,
        tipo_bien,
        licitacionId,
        unidad_medida_id || null,
        categoria_id || null,
        marca_id || null,
        imagenBuffer
      );

      const articuloId = resultArticulo.lastInsertRowid;

      insertExistencia.run(
        cantidad_existencia || 0,
        articuloId,
        ubicacion_id || null
      );

      if (identificable) {
        identificables.push({
          id: articuloId,
          nombre,
          cantidad: parseInt(cantidad_existencia || 0),
        });
      }
    }

    return res.json({
      mensaje: "Licitación creada correctamente",
      identificables,
    });

  } catch (error) {
    console.error("Error al crear licitación:", error.message);
    return res.status(500).json({ error: "Error interno al crear la licitación." });
  }
});
router.get('/form_licitacion', (req, res) => {
  try {
    const marca = db.prepare(`SELECT * FROM marca`).all();
    const unidad_medida = db.prepare(`SELECT * FROM unidad_medida`).all();
    const categoria = db.prepare(`SELECT * FROM categoria`).all();
    const ubicacion = db.prepare(`SELECT * FROM ubicacion`).all();

    const relaciones = [
      { nombre: "marca", datos: marca, labelField: "nombre" },
      { nombre: "unidad_medida", datos: unidad_medida, labelField: "nombre" },
      { nombre: "categoria", datos: categoria, labelField: "nombre" },
      { nombre: "ubicacion", datos: ubicacion, labelField: "nombre" },
    ];

    res.json({ relaciones });
  } catch (err) {
    console.error("Error en /form_licitacion:", err.message);
    res.status(500).json({ error: "Error al obtener datos del formulario" });
  }
});

router.post('/articulos-identificados', (req, res) => {
  try {
    const { codigos } = req.body;

    const insertIdentificado = db.prepare(`
      INSERT INTO articulo_identificado (codigo, id_articulo)
      VALUES (?, ?)
    `);

    const errores = [];

    for (const { codigo, id_articulo } of codigos) {
      if (!codigo || !id_articulo) continue;
      try {
        insertIdentificado.run(codigo, id_articulo);
      } catch (err) {
        errores.push({ codigo, error: err.message });
      }
    }

    if (errores.length > 0) {
      return res.status(400).json({ error: "Errores al guardar algunos códigos", detalles: errores });
    }

    return res.json({ mensaje: "Identificables guardados correctamente" });
  } catch (error) {
    console.error("Error al guardar identificables:", error.message);
    return res.status(500).json({ error: "Error interno al guardar identificables" });
  }
});

router.post('/licitacion/consumo', uploadConsumo.array('articulos[].imagen'), (req, res) => {
  const dbTransaction = db.transaction((nombre, año, articulos, files) => {
    const insertLicitacion = db.prepare(`
      INSERT INTO licitacion (nombre, año)
      VALUES (?, ?)
    `);
    const resultLicitacion = insertLicitacion.run(nombre, año);
    const licitacionId = resultLicitacion.lastInsertRowid;

    const insertArticulo = db.prepare(`
      INSERT INTO articulo (
        nombre, descripcion, codigo, precio, numero_serie, identificable,
        tipo_bien, licitacion_id, unidad_medida_id, categoria_id, marca_id, imagen
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertExistencia = db.prepare(`
      INSERT INTO existencia (
        cantidad, pendiente_a_entregar, articulo_asociado_id, ubicacion_id
      ) VALUES (?, 0, ?, ?)
    `);

    for (let i = 0; i < articulos.length; i++) {
      const art = articulos[i];
      const {
        nombre,
        descripcion,
        codigo,
        precio,
        numero_serie,
        unidad_medida_id,
        categoria_id,
        marca_id,
        cantidad_existencia,
        ubicacion_id
      } = art;

      const tipo_bien = "CONSUMO";
      const identificable = 0;

      // Obtener imagen buffer correspondiente (por orden)
      let imagenBuffer = null;
      if (files && files[i]) {
        imagenBuffer = files[i].buffer;
      }

      const resultArticulo = insertArticulo.run(
        nombre || '',
        descripcion || '',
        codigo || '',
        precio || 0,
        numero_serie || '',
        identificable,
        tipo_bien,
        licitacionId,
        unidad_medida_id || null,
        categoria_id || null,
        marca_id || null,
        imagenBuffer
      );

      const articuloId = resultArticulo.lastInsertRowid;

      insertExistencia.run(
        cantidad_existencia || 0,
        articuloId,
        ubicacion_id || null
      );
    }

    return { mensaje: "Licitación de consumo creada correctamente." };
  });

  try {
    const { nombre, año } = req.body;

    let articulos;
    if (typeof req.body.articulos === "string") {
      articulos = JSON.parse(req.body.articulos);
    } else {
      articulos = req.body.articulos || [];
    }

    if (!nombre || !año || !Array.isArray(articulos)) {
      return res.status(400).json({ error: "Datos incompletos." });
    }

    const result = dbTransaction(nombre, año, articulos, req.files);
    return res.json(result);
  } catch (error) {
    console.error("Error al crear licitación de consumo:", error.message);
    return res.status(500).json({ error: "Error interno al crear la licitación." });
  }
});


/************** Herramientas ***************/

router.post('/herramienta/', (req, res) => {
  const contentType = req.headers['content-type'];
  let articulos;
  if(contentType.includes('application/json')){
    articulos = req.body.articulo;
  }else if(contentType.includes('multipart/form-data')|| contentType.includes('application/x-www-form-urlencoded')){
    try{
      articulos=JSON.parse(req.body.articulo);
    }catch(err){
      console.log("Error al parsear los datos")
      return res.status(400).json({error:"Error al parsear el articulo enviado en form-data"})
    }
  }
console.log("Los articulos son:", JSON.stringify(articulos, null, 2));
  if (!Array.isArray(articulos)) {
    return res.status(400).json({ error: "El campo 'articulo' debe ser un array." });
  }

  for (const item of articulos) {
    if (!item.id || isNaN(parseInt(item.cantidad_existencia)) || !item.ubicacion_id) {
      console.log("Faltan datos obligatorios en uno de los artículos:", item);
      return res.status(400).json({ error: "Faltan datos obligatorios en uno de los artículos." });
    }
  }

  try {
    const insertExistencia = db.prepare(`
      INSERT INTO existencia (
        cantidad, pendiente_a_entregar, articulo_asociado_id, ubicacion_id
      ) VALUES (?, 0, ?, ?)
    `);
    const insertMany=db.transaction((items)=>{
      for (const item of items){
    insertExistencia.run(
      parseInt(item.cantidad_existencia),
      item.id,
      parseInt(item.ubicacion_id)
    );}
  })
  insertMany(articulos);
    return res.json({ mensaje: "Cantidad adicionada"});
  } catch (error) {
    console.error("Error al crear Herramienta:", error.message);
    return res.status(500).json({ error: "Error interno al crear la Herramienta." });
  }
});
router.get('/form/herramienta', (req, res) => {
  try {
    const ubicacion = db.prepare(`SELECT * FROM ubicacion`).all();
    const articulos=db.prepare(`SELECT id, nombre FROM articulo WHERE tipo_bien='HERRAMIENTA'`).all();
    const relaciones = [
         { nombre: "ubicacion", datos: ubicacion, labelField: "nombre" },
      { nombre: "articulos", datos: articulos, labelField: "nombre" },
    ];

    res.json({ relaciones });
  } catch (err) {
    console.error("Error en /form_herramienta:", err.message);
    res.status(500).json({ error: "Error al obtener datos del formulario" });
  }
});


/************** PRESTAMO *****************/

router.get('/form/prestamo', (req, res) => {
  try {
    const articulos=db.prepare(`SELECT a.id, a.nombre, COALESCE (m.nombre, '') AS marca, e.cantidad 
                                FROM articulo a
                                LEFT JOIN marca m ON m.id=a.marca_id
                                JOIN existencia e ON a.id=e.articulo_asociado_id
                                WHERE tipo_bien='HERRAMIENTA' AND e.cantidad>0`).all();


    res.json(articulos);
  } catch (err) {
    console.error("Error en /form_prestamo:", err.message);
    res.status(500).json({ error: "Error al obtener datos del formulario" });
  }
});
router.post('/form_prestamo', async (req, res) => {
  try {
    const { prestamo, articulos_asignados } = req.body;

    // Verificación de stock antes de insertar
    for (const item of articulos_asignados) {
      const result = getRecordById('existencia', item.articulo_id);
      const stockDisponible = result ? result.cantidad : 0;

      if (stockDisponible < item.cantidad_asignada) {
        return res.status(400).json({
          error: `Stock insuficiente para el artículo con ID ${item.articulo_id}. Disponible: ${stockDisponible}, solicitado: ${item.cantidad_asignada}`
        });
      }
    }

    // Inserta el préstamo
    const prestamoId = await insertRecord("prestamo", prestamo);
    console.log("ID de la orden guardada:", prestamoId.id);

    // Inserta artículos prestados
    const insertArticulo = db.prepare(`
      INSERT INTO articulos_prestados (
        estado,
        cantidad, 
        prestamo_id, 
        articulo_id
      )
      VALUES (?, ?, ?, ?)
    `);

    const insertManyArt = db.transaction((items) => {
      for (const item of items) {
        insertArticulo.run(
          'PRESTADO',
          item.cantidad_asignada,
          prestamoId.id,
          item.articulo_id
        );
      }
    });

    insertManyArt(articulos_asignados);

    res.json({ 
      message: 'Préstamo y artículos guardados correctamente',
      prestamo_id: prestamoId 
    });

  } catch (err) {
    console.error("Error en /form_prestamo-post:", err.message, err);
    res.status(500).json({ error: "Error al guardar el préstamo" });
  }
});

router.get('/prestamo/:id', (req, res) => {
  try {
    const { id } = req.params;

    const prestamo = db.prepare(`SELECT * FROM prestamo WHERE id=?`).get(id);
    if (!prestamo) {
      return res.status(404).json({ error: 'Orden de servicio no encontrada' });
    }

    const articulos_prestados = db.prepare(`
      SELECT a.nombre, a.tipo_bien ,ap.*
      FROM articulos_prestados ap
      JOIN articulo a ON a.id = ap.articulo_id
      WHERE ap.prestamo_id = ? 
    `).all(id);

    const response = {
      prestamo,
      articulos_prestados,
    };

    res.json(response);
  } catch (error) {
    console.error('Error en /prestamo/:id:', error.message);
    res.status(500).json({ error: 'Error al obtener la orden de prestamo' });
  }
});



module.exports = router;
