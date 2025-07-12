const express = require('express');
const router = express.Router();
const db = require('../db/db');
const {getRecordById,getAllFromTable,insertRecord,getFormTable}=require('../helpers/queries.js');
const { PassThrough } = require('stream');

const tablasPermitidasPost = [
  'categoria',
  'marca',
  'ubicacion', 'articulo_identificado',
  'existencia',
  'proveedor', 'unidad_medida',
  'edificio', 'departamento',
  'articulo', 'vehiculos', 'atributos_vehiculos'
];

const tablasPermitidas = [
  'categoria',
  'licitacion', 'marca',
  'ubicacion', 'articulo_identificado',
  'existencia',
  'proveedor', 'unidad_medida',
  'edificio', 'departamento', 'articulos_orden_compra',
  'articulo', 'vehiculos', 'atributos_vehiculos',
  'orden_compra','orden_servicio'
];

/********** CONSULTAS GENERALES ***********/
//Ruta Post
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.post('/:tabla/', upload.any(), async (req, res) => {

  try {
      console.log('req.body:', req.body);
  console.log('req.files:', req.files);
    const { tabla } = req.params;
    if (!tablasPermitidasPost.includes(tabla)) {
      return res.status(400).json({ error: 'Tabla no válida' });
    }
    
    // Procesar datos y archivos
    const data = { ...req.body };
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        data[file.fieldname] = file.buffer;
      }
    }
    if (Object.keys(data).length === 0) {
      console.log('Datos recibidos para insertar:', data);
      return res.status(400).json({ error: 'No estás enviando datos' });
    }

    console.log('Datos recibidos para insertar:', data);

    const resultado = await insertRecord(tabla, data);
    res.status(201).json({ message: `Registro insertado correctamente en la tabla '${tabla}'`, resultado });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

//Ruta para obtener todos los registros necesarios para un form 
router.get('/form/:tabla', (req, res) => {
  const { tabla } = req.params;

  try {
    if (!tablasPermitidas.includes(tabla)) {
      return res.status(400).json({ error: "Tabla no válida para esta función" });
    }

    const data = getFormTable(tabla); // Esta función debe devolver estructura con campos y datos de tablas relacionadas

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Ruta para obtener todos los registros de una tabla
router.get('/:tabla', (req, res) => {
  const { tabla } = req.params;
  try {
    if (!tablasPermitidas.includes(tabla)) {
      return res.status(400).json({ error: 'Tabla no válida' });
    }
    const rows = getAllFromTable(tabla);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});



// Ruta para obtener un registro específico por ID
router.get('/especifica/:tabla/:id',  (req, res) => {
  const { tabla, id } = req.params;
  try {
    if (!tablasPermitidas.includes(tabla)) {
      return res.status(400).json({ error: 'Tabla no válida' });
    }
    const row=getRecordById(tabla,id);
    
    if (!row) {
      return res.status(404).json({ error: `${tabla} con id ${id} no encontrada` });
    }
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//Eliminar elemento especifico
router.delete('/especifica/:tabla/:id', async (req,res)=>{
  const { tabla, id } = req.params;
  try{  
    if (!tablasPermitidas.includes(tabla)) {
      return res.status(400).json({ error: 'Tabla no válida' });
    }
    const sentencia= db.prepare(`DELETE FROM ${tabla} WHERE id=?`);
    const resultado= sentencia.run(id);
    if (resultado.changes===0){
        return res.status(404).json({error:`${tabla} no encontrada`});
    }
    res.status(200).json({ message: `${tabla} eliminada correctamente`});
  }catch(err){
    res.status(500).json({error:err.message});
  }
})



module.exports = router;