const express = require('express');
const router = express.Router();
const db = require('../db/db');

router.get('/existencias', (req, res) => {
  try {
    const resultados = db.prepare(`
      SELECT
        e.id AS existencia_id,
        e.cantidad,
        u.nombre AS ubicacion,
        a.id AS articulo_id,
        a.nombre AS articulo_nombre,
        a.descripcion,
        a.imagen
      FROM existencia e
      JOIN articulo a ON a.id = e.articulo_asociado_id
      JOIN ubicacion u ON u.id = e.ubicacion_id
      WHERE a.tipo_bien = 'STOCK'
      ORDER BY a.nombre
    `).all();

    const agrupado = [];

    const mapa = new Map();

    for (const fila of resultados) {
      const {
        articulo_id,
        articulo_nombre,
        descripcion,
        imagen,
        existencia_id,
        cantidad,
        ubicacion,
      } = fila;

      let imagenBase64 = null;
      if (imagen) {
        imagenBase64 = `data:image/jpeg;base64,${Buffer.from(imagen).toString('base64')}`;
      }

      if (!mapa.has(articulo_id)) {
        mapa.set(articulo_id, {
          articulo_id,
          nombre: articulo_nombre,
          descripcion,
          imagen: imagenBase64,
          existencias: []
        });
      }

      mapa.get(articulo_id).existencias.push({
        existencia_id,
        cantidad,
        ubicacion
      });
    }

    for (const articulo of mapa.values()) {
      agrupado.push(articulo);
    }

    res.json(agrupado);
  } catch (err) {
    console.error('Error al obtener existencias:', err.message);
    res.status(500).json({ error: 'Error al obtener existencias' });
  }
});

module.exports = router;
