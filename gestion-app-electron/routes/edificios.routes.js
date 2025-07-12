const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { getRecordById } = require('../helpers/queries.js'); 

router.get('/', (req, res) => {
  try {
    const datos = db.prepare(`
      SELECT
        e.nombre AS edificio_nombre,
        e.imagen,
        e.direccion,
        d.id AS departamento_id,
        d.numero AS departamento_numero,
        d.piso AS departamento_piso
      FROM edificio e
      INNER JOIN departamento d ON d.edificio_id = e.id
      ORDER BY e.nombre, d.piso, d.numero
    `).all();

    const agrupado = {};

    for (const fila of datos) {
      const {
        edificio_nombre,
        imagen,
        direccion,
        departamento_id,
        departamento_numero,
        departamento_piso,
      } = fila;

      let imagenBase64 = null;
      if (imagen) {
        imagenBase64 = `data:image/jpeg;base64,${Buffer.from(imagen).toString('base64')}`;
      }

      if (!agrupado[edificio_nombre]) {
        agrupado[edificio_nombre] = {
          direccion,
          imagen: imagenBase64,
          pisos: {},
        };
      }

      if (!agrupado[edificio_nombre].pisos[departamento_piso]) {
        agrupado[edificio_nombre].pisos[departamento_piso] = [];
      }

      agrupado[edificio_nombre].pisos[departamento_piso].push({
        id: departamento_id,
        numero: departamento_numero,
        piso: departamento_piso,
      });
    }

    res.json(agrupado);

  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/departamento/:id',(req,res)=>{
  try {
  const {id}=req.params;
  const departamento=getRecordById("departamento",id);
  if (!departamento) {
    return res.status(404).json({ error: 'Departamento no encontrado' });
  }
  const ordenes=db.prepare(`
    SELECT * FROM orden_servicio
    WHERE departamento_id=?
    ORDER BY fecha DESC;
    `).all(id)
    
  const bienesAsignados=db.prepare(`
  SELECT 
    ai.id AS id_identificado,
    ai.codigo,
    a.nombre AS nombre_articulo,
    a.descripcion,
    os.nombre AS nombre_orden,
    os.fecha
  FROM articulos_identificados_asignados aias
  JOIN articulo_identificado ai ON aias.articulo_identificado_id = ai.id
  JOIN articulo a ON ai.id_articulo = a.id
  JOIN orden_servicio os ON aias.orden_servicio_id = os.id
  WHERE os.departamento_id = ?
  ORDER BY os.fecha DESC
`).all(id);
    
  res.json({ordenes,departamento,bienesAsignados});
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error al obtener el departamento' });
  }
})



module.exports = router;