const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { insertRecord,getRecordById } = require('../helpers/queries.js'); 



/******Orden de servicio*******/
router.get('/orden_servicio/:id', (req, res) => {
  try {
    const { id } = req.params;

    const orden = db.prepare(`SELECT * FROM orden_servicio WHERE id=?`).get(id);
    if (!orden) {
      return res.status(404).json({ error: 'Orden de servicio no encontrada' });
    }

    // Si orden.imagen existe y es buffer, convertir a base64 + prefijo
    if (orden.imagen && typeof orden.imagen === 'object' && orden.imagen.data) {
      // En SQLite puede venir como { type: 'Buffer', data: [...] }
      const buffer = Buffer.from(orden.imagen.data);
      orden.imagen = `data:image/jpeg;base64,${buffer.toString('base64')}`;
    } else if (orden.imagen instanceof Buffer) {
      // En otros casos, podría venir directamente como Buffer
      orden.imagen = `data:image/jpeg;base64,${orden.imagen.toString('base64')}`;
    } else {
      // Si no hay imagen, o está null, aseguramos que sea null o undefined para el frontend
      orden.imagen = null;
    }

    const edificio = db.prepare(`
      SELECT e.nombre AS nombre_edificio, d.id, d.numero, d.piso
      FROM departamento d
      JOIN edificio e ON e.id = d.edificio_id
      WHERE d.id = ?
    `).get(orden.departamento_id);

    const articulos_asignados = db.prepare(`
      SELECT a.nombre, a.tipo_bien, asi.*
      FROM articulos_asignados asi
      JOIN articulo a ON a.id = asi.articulo_id
      WHERE asi.orden_servicio_id = ? 
    `).all(id);


    const articulos_asignados_identificados = db.prepare(`
      SELECT 
              asi.id AS id,
              asi.estado,
             a.nombre AS nombre_articulo,
             ai.codigo
      FROM articulos_identificados_asignados asi
      JOIN articulo_identificado ai ON ai.id = asi.articulo_identificado_id
      JOIN articulo a ON a.id = ai.id_articulo
      WHERE asi.orden_servicio_id = ?
    `).all(id);

    const sobrantes_de_obra = db.prepare(`
      SELECT su.cantidad, a.nombre
      FROM sobrante_utilizado su
      JOIN sobrantes s ON s.id = su.sobrante_id
      JOIN articulo a ON a.id = s.articulo_id
      WHERE su.orden_id = ?
    `).all(id);

    const response = {
      orden,
      edificio,
      articulos_asignados,
      articulos_asignados_identificados,
      sobrantes_de_obra,
    };

    res.json(response);
  } catch (error) {
    console.error('Error en /orden_servicio/:id:', error.message);
    res.status(500).json({ error: 'Error al obtener la orden de servicio' });
  }
});

//POST
router.post('/form_orden_servicio',async (req,res)=>{
  try{
    const {orden_servicio,articulos_asignados,identificado_asignado}=req.body;


    for (const item of articulos_asignados) {
      const result = getRecordById('existencia',item.articulo_id)
      const stockDisponible = result ? result.cantidad : 0;

      if (stockDisponible < item.cantidad_asignada) {
        return res.status(400).json({
          error: `Stock insuficiente para el artículo con ID ${item.articulo_id}. Disponible: ${stockDisponible}, solicitado: ${item.cantidad_asignada}`
        });
      }
    }

    const ordenId= await insertRecord("orden_servicio",orden_servicio)
    console.log("ID de la orden guardada:", ordenId.id);
    //Modificar cantidad
    const updateCantidad = db.prepare(`
      UPDATE existencia
      SET 
        cantidad = cantidad - ?
      WHERE articulo_asociado_id = ?
    `); 

    //Articulos
    const insertArticulo=db.prepare(`
      INSERT INTO articulos_asignados(
      cantidad_asignada,cantidad_entregada, 
      orden_servicio_id, articulo_id)
      VALUES (?, ?, ?, ?)
      `)

    const insertManyart = db.transaction((items) => {
        for (const item of items) {
          insertArticulo.run(
            item.cantidad_asignada,
            item.cantidad_entregada,
            ordenId.id,
            item.articulo_id
          );

          // Restar al stock existente
          updateCantidad.run(
            item.cantidad_asignada,
            item.articulo_id
          );
        }
      });
    insertManyart(articulos_asignados);
    

    //Articulos Identificados
    const insertId=db.prepare(`
      INSERT INTO articulos_identificados_asignados(
      articulo_identificado_id,
      estado,
      orden_servicio_id)
      VALUES (?, ?, ?)
      `)
    const insertManyid=db.transaction((items)=>{
      for (const item of items) {
          insertId.run(
            item.articulo_identificado_id,
            item.estado,
            ordenId.id
          );
        }
    });
    if (identificado_asignado && identificado_asignado.length > 0) {
      insertManyid(identificado_asignado);
    }

    res.json({ message: 'Orden y artículos guardados correctamente', orden_id: ordenId });

}catch (err) {

    console.log("Error en /form_orden_servicio-post:",err.message,err)
    res.status(500).json({ error: err.message });
  }
});

//GET
router.get('/form_orden_servicio', (req,res) => {
  try {
  const departamentos = db.prepare(`
    SELECT d.id, d.numero, d.piso, e.nombre AS edificio
    FROM departamento d
    JOIN edificio e ON e.id = d.edificio_id
    ORDER BY e.nombre, d.piso, d.numero
  `).all();

    const ubicacion = db.prepare(`SELECT id, nombre FROM ubicacion`).all();
    const articulos = db.prepare(`
      SELECT a.id, a.tipo_bien, a.nombre, e.cantidad
       FROM articulo a 
       LEFT JOIN articulo_identificado ai ON a.id = ai.id_articulo
       LEFT JOIN existencia e ON a.id=e.articulo_asociado_id
       WHERE ai.id IS NULL AND e.cantidad>0 
       `).all();

    const identificados = db.prepare(`
      SELECT ai.id, ai.codigo, a.nombre AS nombre_articulo
      FROM articulo_identificado ai
      LEFT JOIN articulos_identificados_asignados aias
        ON ai.id = aias.articulo_identificado_id
      LEFT JOIN articulo a
        ON ai.id_articulo=a.id 
      WHERE aias.id IS NULL AND ai.estado = 'ALTA'
    `).all();

    if (departamentos.length === 0) {
      console.warn("No hay departamentos disponibles");
    }
    if (articulos.length === 0) {
      console.warn("No hay articulos disponibles");
    }
    if (identificados.length === 0) {
      console.warn("No hay articulos identificados disponibles");
    }
    console.log(articulos)
    res.json({
      departamentos,
      ubicacion,
      articulos,
      articulos_identificados: identificados,
    });

  } catch (err) {
    console.error("Error en /form_orden_servicio:",err.message);
    res.status(500).json({ error: "Error al obtener datos del formulario" });
  }
});

/*********** Stock ****************/
router.get('/inventario_stock',(req,res)=>{
  try{
    const data= db.prepare(`SELECT a.*, e.cantidad
                FROM articulo a 
                JOIN existencia e ON a.id=e.articulo_asociado_id
                WHERE e.cantidad>0
                `).all();
    console.log(data);
    res.json(data);
  }catch(err){
    console.log(err.message);
    res.status(500).json({error:"Error al intentar obtener el stock"})
  }
});

// GET - Obtener artículos disponibles para asignar
router.get('/form/agregar_items/', (req, res) => {
  try {
    const tipoBien = req.query.tipo_bien?.toUpperCase(); // 🔧 <-- acá

    let articulosQuery = `
      SELECT a.id, a.nombre, a.tipo_bien, e.cantidad
      FROM articulo a 
      LEFT JOIN articulo_identificado ai ON a.id = ai.id_articulo
      LEFT JOIN existencia e ON a.id = e.articulo_asociado_id
      WHERE ai.id IS NULL AND e.cantidad > 0
    `;
    console.log("El tipo de bien que pide es: ", tipoBien)
    const params = [];

    if (tipoBien) {
      articulosQuery += " AND a.tipo_bien = ?";
      params.push(tipoBien);
    }

    const articulos = db.prepare(articulosQuery).all(...params);
    console.log("Articulos",articulos)

    const identificados = db.prepare(`
      SELECT ai.id, ai.codigo, a.nombre AS nombre_articulo
      FROM articulo_identificado ai
      LEFT JOIN articulos_identificados_asignados aias
        ON ai.id = aias.articulo_identificado_id
      LEFT JOIN articulo a
        ON ai.id_articulo = a.id 
      WHERE aias.id IS NULL AND ai.estado = 'ALTA'
    `).all();
    console.log("Identificados",identificados)

    const sobrantes = db.prepare(`
      SELECT s.id, s.cantidad, a.nombre AS nombre_articulo 
      FROM sobrantes s 
      JOIN articulo a ON a.id = s.articulo_id
      WHERE s.cantidad > 0
    `).all();
    console.log("Sobrantes",sobrantes)

    res.status(200).json({
      articulos,
      identificados,
      sobrantes
    });

  } catch (err) {
    console.error("Error en /form/agregar_items:", err.message);
    res.status(500).json({ error: "Error al procesar artículos" });
  }
});

// POST - Insertar artículo/sobrante/identificado asignado, validar y actualizar stock
router.post('/form/agregar_items/:tipo/:id', (req, res) => {
  try {
    const { id, tipo } = req.params;
    const data = req.body;
    console.log(data)
    console.log(tipo)
    if (tipo === 'articulo') {
      const { cantidad_asignada, cantidad_entregada, articulo_id } = data;

      // Validar campos requeridos para artículo
      if (
        cantidad_asignada == null || 
        cantidad_entregada == null || 
        !articulo_id ||
        isNaN(cantidad_asignada) ||
        isNaN(cantidad_entregada)
      ) {
        return res.status(400).json({ error: "Datos incompletos o inválidos para artículo." });
      }

      // Buscar existencia actual del artículo
      const stock = db.prepare(`
        SELECT cantidad FROM existencia WHERE articulo_asociado_id = ?
      `).get(articulo_id);

      if (!stock) {
        return res.status(404).json({ error: "El artículo no tiene stock disponible." });
      }

      if (cantidad_asignada > stock.cantidad) {
        return res.status(400).json({ error: "No hay suficiente stock disponible para asignar esa cantidad." });
      }

      // Insertar artículo asignado
      db.prepare(`
        INSERT INTO articulos_asignados 
        (cantidad_asignada, cantidad_entregada, orden_servicio_id, estado, articulo_id)
        VALUES (?, ?, ?, ?, ?)
      `).run(cantidad_asignada, cantidad_entregada, id, 'ACTIVO', articulo_id);

      // Actualizar el stock restando la cantidad asignada
      db.prepare(`
        UPDATE existencia SET cantidad = cantidad - ?
        WHERE articulo_asociado_id = ?
      `).run(cantidad_asignada, articulo_id);

      return res.status(200).json({ mensaje: "Artículo asignado correctamente." });

    } else if (tipo === 'asignar_sobrante') {
      console.log("Ingrese")
      const { articulo_id, cantidad } = data;

      if (!articulo_id || cantidad == null || isNaN(cantidad) || cantidad <= 0) {
        return res.status(400).json({ error: "Datos incompletos o inválidos para sobrante." });
      }

      // Verificar existencia en sobrantes
      const sobranteStock = db.prepare(`
        SELECT cantidad FROM sobrantes WHERE articulo_id = ? 
      `).get(articulo_id);
      const sobrantes = db.prepare(`
        SELECT id FROM sobrantes WHERE articulo_id = ?
      `).get(articulo_id);
      const id_sobrantes=sobrantes.id;
      if (!sobranteStock) {
        return res.status(404).json({ error: "No hay sobrantes disponibles para ese artículo." });
      }

      if (cantidad > sobranteStock.cantidad) {
        return res.status(400).json({ error: "No hay suficiente cantidad en sobrantes para asignar." });
      }
      

      // Insertar asignación de sobrante (puedes necesitar tabla de asignaciones para sobrantes, o actualizar sobrantes con orden_id)
      db.prepare(`
        INSERT INTO sobrante_utilizado (cantidad, fecha, orden_id, sobrante_id)
        VALUES (?, date('now'), ?, ?)
      `).run(cantidad, id, id_sobrantes);

      // Actualizar sobrantes restando cantidad asignada
      console.log("La cantidad es: ", cantidad);
      db.prepare(`
        UPDATE sobrantes SET cantidad = cantidad - ?
        WHERE id = ?
      `).run(cantidad, id_sobrantes);

      return res.status(200).json({ mensaje: "Sobrante asignado correctamente." });

    } else if (tipo === 'identificado') {
      const { articulo_identificado_id } = data;

      if (!articulo_identificado_id) {
        return res.status(400).json({ error: "ID artículo identificado requerido." });
      }

      // Verificar que no esté asignado ya
      const yaAsignado = db.prepare(`
        SELECT id FROM articulos_identificados_asignados WHERE articulo_identificado_id = ?
      `).get(articulo_identificado_id);

      if (yaAsignado) {
        return res.status(400).json({ error: "El artículo identificado ya está asignado." });
      }

      // Insertar artículo identificado asignado
      db.prepare(`
        INSERT INTO articulos_identificados_asignados (estado, articulo_identificado_id, orden_servicio_id)
        VALUES (?, ?, ?)
      `).run('ASIGNADO', articulo_identificado_id, id);

      return res.status(200).json({ mensaje: "Artículo identificado asignado correctamente." });

    } else {
      return res.status(400).json({ error: "Tipo inválido." });
    }

  } catch (err) {
    console.error("Error en /form/agregar_items/:tipo/:id:", err.message);
    res.status(500).json({ error: "Error al procesar asignación." });
  }
});

//Botones

router.post('/modificar_articulos_asignados/:id', (req, res) => {
  try {
    const { id } = req.params;
    const cantidad = Number(req.body.cant_entregada);

    const articulo = db.prepare('SELECT cantidad_asignada, cantidad_entregada FROM articulos_asignados WHERE id = ?').get(id);

    if (!articulo) {
      return res.status(404).json({ error: 'Artículo asignado no encontrado' });
    }

    // Validar que la nueva cantidad entregada no supere la asignada
    if (articulo.cantidad_entregada + cantidad > articulo.cantidad_asignada) {
      return res.status(400).json({ error: 'La cantidad entregada no puede ser mayor que la asignada' });
    }

    const updateCantidad = db.prepare(`
      UPDATE articulos_asignados
      SET cantidad_entregada = cantidad_entregada + ?
      WHERE id = ?
    `);

    const result = updateCantidad.run(cantidad, id);

    res.status(200).json({ message: `Se actualizaron ${result.changes} registros` });
  } catch (err) {
    console.error("Error en /modificar_articulos_asignados:", err.message);
    res.status(500).json({ error: "Error al procesar articulos entregados" });
  }
});

router.delete('/delete_articulo_asignado/:id',(req,res)=>{
  try{
    const {id}=req.params;
    const {devolver}=req.body;
    const articuloAsignado=db.prepare(`
      SELECT cantidad_asignada,cantidad_entregada, articulo_id 
      FROM articulos_asignados 
      WHERE id=?
      `).get(id);
    
    if (!articuloAsignado){
      return res.status(404).json({error:"Registro no encontrado"});
    }  

    const updateCantidad=db.prepare(`
      UPDATE existencias
      SET 
      cantidad=cantidad-?
      WHERE 
      articulo_asociado_id=?
      `);
    const cantidad=0;
    if(devolver){
      cantidad=articuloAsignado.cantidad_asignada+articuloAsignado.cantidad_entregada;
    }
    else{
      cantidad=articuloAsignado.cantidad_asignada;
    }  
    updateCantidad.run(cantidad,articuloAsignado.articulo_id);
    
    const deleteRegistro=db.prepare(`
      DELETE FROM articulos_asignados
      WHERE id=?
      `)
    deleteRegistro.run(id);

    res.json({message:'Articulo asignado eliminado y stock actualizado'})}
  catch(err){
    console.error("Error en /delete_articulo_asignado:",err);
    res.status(500).json({error:"Error interno del servidor"});
  }
});

router.get('/modal_cerrar_orden_servicio/:id',(req,res)=>{
  try{
    const {id}=req.params;
        // Obtener artículos asignados a esa orden
    const articulos = db.prepare(`
          SELECT art.nombre, a.articulo_id, a.cantidad_asignada, a.cantidad_entregada, o.ubicacion_id
          FROM articulos_asignados a
          JOIN articulo art ON art.id = a.articulo_id
          JOIN orden_servicio o ON o.id = a.orden_servicio_id
          WHERE a.orden_servicio_id = ? AND a.estado='ACTIVO' AND a.cantidad_asignada>a.cantidad_entregada
        `).all(id);

    const ubicaciones=db.prepare(`SELECT * FROM ubicacion`).all();

    console.log("El articulo de la orden ",id," es: ", articulos,"y las ubicaciones son: ",ubicaciones)
    res.status(200).json({articulos,ubicaciones});
  }catch(err){
    console.error("Error en /modal/cerrar_orden_servicio:",err.message)
    res.status(500).json({error:"Error al abrir el modal", details: err.message})
  }
})

router.post('/cerrar_orden_servicio/:id',(req,res)=>{  
  try {
    const { id } = req.params;
    const { articulos_sobrantes = [] } = req.body;

    const update_orden = db.prepare(`
      UPDATE orden_servicio 
      SET estado = ?
      WHERE id = ?
    `);
    const result_ord = update_orden.run('CULMINADO', id);

    if (result_ord.changes === 0) {
      return res.status(404).json({ error: "Orden de servicio no encontrada" });
    }

    const insertSobrante = db.prepare(`
      INSERT INTO sobrantes (cantidad, fecha, orden_id, articulo_id, ubicacion_id)
      VALUES (?, datetime('now'), ?, ?, ?)
    `);

    const marcarCulminado = db.prepare(`
      UPDATE articulos_asignados
      SET estado = 'CULMINADO'
      WHERE orden_servicio_id = ?
    `);

    const generarSobrantes = db.transaction(() => {
      for (const art of articulos_sobrantes) {
        if (art.cantidad > 0) {
          insertSobrante.run(art.cantidad, id, art.articulo_id, art.ubicacion_id || null);
        }
      }
      marcarCulminado.run(id);
    });

    generarSobrantes();

    res.status(200).json({ message: "Orden cerrada correctamente y sobrantes generados" });

  } catch (err) {
    console.error("Error en /cerrar_orden_servicio:", err.message);
    res.status(500).json({ error: "Error al actualizar la orden", details: err.message });
  }
});

router.post('/reabrir_orden_servicio/:id',(req,res)=>{  
  try{
  const {id}=req.params;

  const update_orden=db.prepare(`
    UPDATE orden_servicio 
    SET 
      estado=?
    WHERE id=?
    `);
  const result_ord= update_orden.run('ACTIVO',id);

  if(result_ord.changes===0){
    return res.status(404).json({error:"Orden de servicio no encontrada"});
  }
  res.status(200).json({message:"Orden reabierta correctamente"});

  }catch(err){
    console.error("Error en /reabrir_orden_servicio:",err.message)
    res.status(500).json({error:"Error al actualizar la orden", details: err.message})
  }
});


router.post('/orden_servicio/identificados/:asignadoId/entregar', (req, res) => {
  try {

    const asignadoId = parseInt(req.params.asignadoId, 10);
    if (!Number.isInteger(asignadoId) || asignadoId <= 0) {
      console.log("id invalido")
      return res.status(400).json({ error: 'asignadoId inválido' });
      
    }

    const nuevoEstado = (req.body?.estado || 'ENTREGADO').toUpperCase().trim();
    const ESTADOS_VALIDOS = new Set(['ASIGNADO', 'ENTREGADO']);
    if (!ESTADOS_VALIDOS.has(nuevoEstado)) {
      console.log("Estado invalido")
      return res.status(400).json({ error: 'Estado inválido para identificado' });
    }

    // 1) Traer la asignación
    const asignacion = db.prepare(`
      SELECT 
        ai_asig.id,
        ai_asig.articulo_identificado_id,
        ai_asig.orden_servicio_id,
        ai_asig.estado,
        os.estado AS estado_orden
      FROM articulos_identificados_asignados ai_asig
      JOIN orden_servicio os ON os.id = ai_asig.orden_servicio_id
      WHERE ai_asig.id = ?
    `).get(asignadoId);

    if (!asignacion) {
      return res.status(404).json({ error: 'Asignación no encontrada' });
    }

    // 2) Validaciones de negocio
    if (asignacion.estado === 'ENTREGADO') {
      return res.json({ 
        ok: true, 
        message: 'La asignación ya estaba culminada.',
        asignacion: { id: asignacion.id, estado: asignacion.estado }
      });
    }

    if (asignacion.estado_orden === 'CULMINADO') {
      return res.status(409).json({ error: 'No se puede modificar: la orden está culminada.' });
    }
    console.log("Estoy por hacer la transaccion")
    // 3) Transacción: actualizar estado (+ fecha de entrega)
    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE articulos_identificados_asignados
        SET estado = ?
        WHERE id = ?
      `).run(nuevoEstado, asignadoId);

    });

    tx();
    return res.json({
      ok: true,
      message: 'Artículo identificado entregado correctamente.',
      asignacion: {
        id: asignadoId,
        estado: nuevoEstado
      }
    });
  } catch (err) {
    console.log(err)
    console.error('Error en POST /orden_servicio/identificados/:asignadoId/entregar', err);
    return res.status(500).json({ error: 'Error interno' });
  }
});


module.exports = router;