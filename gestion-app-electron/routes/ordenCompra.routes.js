const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { insertRecord,getRecordById,updateRecord } = require('../helpers/queries.js'); 

/******Orden de compra********/
//POST
router.post('/form_orden_compra/', async (req, res) => {
  try {
    const { orden_compra, articulos_comprados } = req.body;
    console.log("Orden de compra: ",orden_compra)
    console.log("Articulos comprados: ",articulos_comprados)
    
    const orden = await insertRecord("orden_compra", orden_compra);

    const insertArticulo = db.prepare(`
      INSERT INTO articulos_orden_compra (
        cantidad_pedida, cantidad_recibida, orden_id, articulo_id
      )
      VALUES (?, ?, ?, ?)
    `);

    const insertCantidad = db.prepare(`
      INSERT INTO existencia (cantidad, pendiente_a_entregar, ubicacion_id, articulo_asociado_id)
      VALUES (?, ?, ?, ?)
    `);

    const updateCantidad = db.prepare(`
      UPDATE existencia
      SET 
        cantidad = cantidad + ?,
        pendiente_a_entregar = pendiente_a_entregar + ?,
        ubicacion_id = ?
      WHERE articulo_asociado_id = ?
    `);

    const insertManyart = db.transaction((items) => {
      for (const item of items) {
        insertArticulo.run(
          item.cantidad_pedida,
          item.cantidad_recibida,
          orden.id,
          item.articulo_id
        );

        const pendiente = Math.max(0, item.cantidad_pedida - item.cantidad_recibida);
        
        const existe = db.prepare(`
          SELECT COUNT(*) as count FROM existencia WHERE articulo_asociado_id = ?
        `).get(item.articulo_id);

        if (existe.count === 0) {
          insertCantidad.run(
            item.cantidad_recibida,
            pendiente,
            item.ubicacion_id,
            item.articulo_id
          );
        } else {
          updateCantidad.run(
            item.cantidad_recibida,
            pendiente,
            item.ubicacion_id,
            item.articulo_id
          );
        }
  }

    });

    insertManyart(articulos_comprados);

    res.json({ message: 'Orden de compra registrada y artículos guardados correctamente', /*orden_id: orden.id*/ });

  } catch (error) {
    console.log("Error en /form_orden_compra-post:", error.message, error.data);
    res.status(500).json({ error: error.message });
  }
});

router.get("/listar_orden_compra", (req, res) => {
  try {
    // Obtener todas las órdenes de compra con proveedor, ordenadas por ID descendente
    const ordenes = db.prepare(`
      SELECT oc.id AS orden_id, oc.fecha, oc.codigo_ref,
             p.id AS proveedor_id, p.razon_social
      FROM orden_compra oc
      JOIN proveedor p ON oc.proveedor_id = p.id
      ORDER BY oc.id DESC
    `).all();

    // Obtener todos los artículos de todas las órdenes de compra
    const articulosOrden = db.prepare(`
      SELECT id, cantidad_pedida, cantidad_recibida, orden_id, articulo_id
      FROM articulos_orden_compra
    `).all();

    // Agrupar artículos por orden_id
    const articulosPorOrden = {};
    for (const articulo of articulosOrden) {
      if (!articulosPorOrden[articulo.orden_id]) {
        articulosPorOrden[articulo.orden_id] = [];
      }
      articulosPorOrden[articulo.orden_id].push({
        articulo_id: articulo.articulo_id,
        cantidad_pedida: articulo.cantidad_pedida,
        cantidad_recibida: articulo.cantidad_recibida,
      });
    }

    // Armar respuesta final, incluyendo codigo_ref
    const resultado = ordenes.map((orden) => ({
      id: orden.orden_id,
      fecha: orden.fecha,
      codigo_ref: orden.codigo_ref,         
      proveedor: {
        id: orden.proveedor_id,
        razon_social: orden.razon_social,
      },
      articulos: articulosPorOrden[orden.orden_id] || [],
    }));

    res.json({ data: resultado });
  } catch (error) {
    console.error("Error al obtener órdenes de compra:", error);
    res.status(500).json({ error: "Error al obtener órdenes de compra" });
  }
});

router.get('/orden_compra/:id', (req, res) => {
  const ordenId = req.params.id;

  try {
    const orden = db.prepare(`
      SELECT oc.id AS orden_id, oc.fecha, oc.codigo_ref,       -- <-- agregado codigo_ref
             p.id AS proveedor_id, p.razon_social
      FROM orden_compra oc
      JOIN proveedor p ON oc.proveedor_id = p.id
      WHERE oc.id = ?
    `).get(ordenId);

    if (!orden) {
      return res.status(404).json({ error: "Orden de compra no encontrada" });
    }

    const articulos = db.prepare(`
      SELECT ac.id, a.nombre, a.id AS id_articulo, ac.cantidad_pedida, ac.cantidad_recibida
      FROM articulos_orden_compra ac
      JOIN articulo a ON a.id = ac.articulo_id
      WHERE ac.orden_id = ?
    `).all(ordenId);

    const resultado = {
      id: orden.orden_id,
      fecha: orden.fecha,
      codigo_ref: orden.codigo_ref,          
      proveedor: {
        id: orden.proveedor_id,
        razon_social: orden.razon_social,
      },
      articulos,
    };

    res.json({ data: resultado });
  } catch (error) {
    console.error("Error al obtener la orden de compra:", error);
    res.status(500).json({ error: "Error al obtener la orden de compra" });
  }
});

//GET
router.get('/form_orden_compra',(req,res)=>{
  try{
    const articulos=db.prepare(` SELECT id,nombre FROM articulo WHERE tipo_bien=='STOCK'`).all();
    const ubicacion=db.prepare(`SELECT id,nombre FROM ubicacion`).all()
    const proveedor=db.prepare('SELECT id,razon_social FROM proveedor WHERE estado==1').all();
    res.json({
        articulos,
        proveedor,
        ubicacion
      });

  } catch (err) {
    console.error("Error en /form_orden_compra:",err.message);
    res.status(500).json({ error: "Error al obtener datos del formulario" });
  }

});

// Actualizar entrega parcial
router.post('/parcial_pendiente_compra', (req, res) => {
  try {
    const { entrega_parcial: deliveryData } = req.body;

    if (
      !deliveryData ||
      deliveryData.entregado == null ||
      !deliveryData.id_articulo_en_orden ||
      !deliveryData.id_articulo
    ) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    if (typeof deliveryData.entregado !== 'number' || deliveryData.entregado <= 0) {
      return res.status(400).json({ error: 'Cantidad entregada inválida' });
    }

    // Obtener registro en articulos_orden_compra
    const purchaseItem = db.prepare(`
      SELECT * FROM articulos_orden_compra WHERE id = ?
    `).get(deliveryData.id_articulo_en_orden);

    if (!purchaseItem) {
      return res.status(404).json({ error: 'Artículo de orden de compra no encontrado' });
    }

    // Obtener stock para artículo asociado
    const stockItem = db.prepare(`
      SELECT * FROM existencia WHERE articulo_asociado_id = ?
    `).get(deliveryData.id_articulo);

    if (!stockItem) {
      return res.status(404).json({ error: 'Stock no encontrado para el artículo asociado' });
    }

    const cantidadFaltante = purchaseItem.cantidad_pedida - purchaseItem.cantidad_recibida;

    if (deliveryData.entregado > cantidadFaltante) {
      return res.status(400).json({ error: 'Estás entregando más cantidad de la pedida' });
    }

    if (cantidadFaltante === 0) {
      return res.status(400).json({ error: 'Este artículo no tiene faltante' });
    }

    // Actualizar cantidad_recibida
    const compraUpdate = db.prepare(`
      UPDATE articulos_orden_compra
      SET cantidad_recibida = cantidad_recibida + ?
      WHERE id = ?
    `).run(deliveryData.entregado, deliveryData.id_articulo_en_orden);

    // Actualizar stock
    const stockUpdate = db.prepare(`
      UPDATE existencia
      SET cantidad = cantidad + ?,
          pendiente_a_entregar=pendiente_a_entregar - ?
      WHERE articulo_asociado_id = ?
    `).run(deliveryData.entregado,deliveryData.entregado, deliveryData.id_articulo);

    if (compraUpdate.changes === 0 || stockUpdate.changes === 0) {
      return res.status(400).json({ error: 'No se actualizó ninguna fila' });
    }

    const updatedPurchaseItem = db.prepare(`
      SELECT * FROM articulos_orden_compra WHERE id = ?
    `).get(deliveryData.id_articulo_en_orden);

    res.json({
      message: 'Cantidad y pendiente actualizado correctamente.',
      updatedPurchaseItem,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


router.post('/boton_pendiente_compra', (req, res) => {
  try {
    const { entrega } = req.body;

    if (!entrega || !entrega.id_articulo_orden) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    const stmtGetAndUpdate = db.transaction((id_articulo_orden) => {
      // 1. Obtener artículo de orden de compra
      const item = db.prepare(`
        SELECT * FROM articulos_orden_compra WHERE id = ?
      `).get(id_articulo_orden);

      if (!item) {
        throw new Error('Artículo no encontrado');
      }

      const cantidadPendiente = item.cantidad_pedida - item.cantidad_recibida;

      if (cantidadPendiente === 0) {
        throw new Error('Este artículo no tiene faltante');
      }

      // 2. Actualizar existencia
      const updateExistencia = db.prepare(`
        UPDATE existencia
        SET cantidad = cantidad + ?, pendiente_a_entregar = pendiente_a_entregar-?
        WHERE articulo_asociado_id = ?
      `).run(cantidadPendiente,cantidadPendiente, item.articulo_id);

      // 3. Actualizar orden de compra como recibido completamente
      const updateArticuloOrden = db.prepare(`
        UPDATE articulos_orden_compra
        SET cantidad_recibida = cantidad_pedida
        WHERE id = ?
      `).run(id_articulo_orden);

      // Verificamos que al menos una fila fue afectada
      if (updateExistencia.changes === 0 || updateArticuloOrden.changes === 0) {
        throw new Error("No se actualizó ninguna fila");
      }

      return {
        actualizado: true,
        articulo_id: item.articulo_id,
        cantidad_actualizada: cantidadPendiente
      };
    });

    const resultado = stmtGetAndUpdate(entrega.id_articulo_orden);
    res.json({ message: 'Cantidad actualizada correctamente', resultado });

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: error.message });
  }
});



module.exports = router;