const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { insertRecord } = require('../helpers/queries.js'); 


/********** Crear licitacion **********/
router.get('/crear_licitacion',(req,res)=>{
  try{
    const marca=db.prepare(`SELECT nombre FROM marca`).all();
    const unidad_medida=db.prepare(`SELECT nombre FROM unidad_medida`).all();
    const categoria=db.prepare(`SELECT nombre FROM categoria`).all();

    res.status(200).json({marca,unidad_medida,categoria})
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/crear_licitacion',(req,res)=>{
  try{
    const {licitacion, articulos}=req.body;
    if (!licitacion || !articulos || !Array.isArray(articulos)) {
      return res.status(400).json({ error: 'No estás enviando todos los datos requeridos correctamente' });
    }
    const resultLic = insertRecord('licitacion', licitacion);
    const licitacion_id = resultLic.lastInsertRowid;
    
    // Agregamos el id de la licitacion
    for (const art of articulos){
      //Esta es una forma de separar un atributo del resto
      const {cantidad, ...articuloData}=art;
      //Agregamos el ID de la licitacion al articulo
      articuloData.licitacion_id=licitacion_id;

      //Insertamos el articulo
      const resultArt=insertRecord('articulo',articuloData);
      const articulo_id=resultArt.lastInsertRowid;

      //Insertamos cantidades del articulo
      insertRecord('existencia',{
        cantidad:cantidad||0,
        articulo_asociado_id:articulo_id
      });
    }
    res.status(200).json({message:'Licitacion y articulos creados correctamente'})

  }catch(err){
    console.error(err.message);
    res.status(500).json("Error al crear licitación")
  }

})

module.exports = router;