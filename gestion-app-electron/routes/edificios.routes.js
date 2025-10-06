const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { getRecordById } = require('../helpers/queries.js'); 
const TABLE_AI = "articulo_identificado"; // o "articulos_identificados"


router.get("/", (req, res) => {
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
      WHERE e.nombre != 'VEHICULO'
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
        imagenBase64 = `data:image/jpeg;base64,${Buffer.from(imagen).toString("base64")}`;
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

router.get("/:id/articulos-identificados", (req, res) => {
  try {
    const raw = req.params.id;
    const isNumeric = /^\d+$/.test(raw);
    const maybeName = isNumeric ? null : decodeURIComponent(raw);

    // Buscar edificio por id o por nombre (case-insensitive) excluyendo VEHICULO
    let edificio = null;
    if (isNumeric) {
      edificio = db
        .prepare(
          `SELECT id, nombre
           FROM edificio
           WHERE id = ? AND nombre != 'VEHICULO'`
        )
        .get(Number(raw));
    } else {
      edificio = db
        .prepare(
          `SELECT id, nombre
           FROM edificio
           WHERE TRIM(UPPER(nombre)) = TRIM(UPPER(?)) AND nombre != 'VEHICULO'`
        )
        .get(maybeName);
    }

    if (!edificio) {
      return res.status(404).json({ error: "Edificio no encontrado" });
    }

    // Filtro de estado de la ASIGNACIÓN (tabla articulos_identificados_asignados)
    // Por defecto: ASIGNADO y ENTREGADO
    const estadoParam = (req.query.estado || "ASIGNADO,ENTREGADO")
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    // Sanitizar a valores válidos
    const estadosValidos = new Set(["ASIGNADO", "ENTREGADO"]);
    const estados = estadoParam.filter((e) => estadosValidos.has(e));
    const placeholdersEstados = estados.map(() => "?").join(",");

    // CTE: última asignación por cada articulo_identificado (en toda la BD)
    // Luego filtramos solo aquellas cuya última OS pertenece al edificio consultado.
    const sql = `
      WITH ultima_asignacion AS (
        SELECT
          articulo_identificado_id,
          MAX(id) AS last_aia_id
        FROM articulos_identificados_asignados
        GROUP BY articulo_identificado_id
      )
      SELECT
        ai.id                    AS ai_id,
        ai.codigo                AS ai_codigo,
        ai.estado                AS ai_estado,
        a.nombre                 AS articulo_nombre,
        a.codigo                 AS articulo_codigo,
        d.id                     AS dep_id,
        d.numero                 AS dep_numero,
        d.piso                   AS dep_piso,
        os.id                    AS orden_id,
        os.nombre                AS orden_nombre,
        os.fecha                 AS orden_fecha,
        aia.estado               AS asignacion_estado
      FROM ultima_asignacion ua
      JOIN articulos_identificados_asignados aia
        ON aia.id = ua.last_aia_id
      JOIN articulo_identificado ai
        ON ai.id = ua.articulo_identificado_id
      LEFT JOIN articulo a
        ON a.id = ai.id_articulo
      JOIN orden_servicio os
        ON os.id = aia.orden_servicio_id
      JOIN departamento d
        ON d.id = os.departamento_id
      WHERE
        d.edificio_id = ?
        AND ai.estado != 'BAJA'
        AND aia.estado IN (${placeholdersEstados})
      ORDER BY d.piso, d.numero, a.nombre, ai.codigo
    `;

    const params = [edificio.id, ...estados];
    const rows = db.prepare(sql).all(...params);

    const articulos = rows.map((r) => ({
      id: r.ai_id,
      codigo: r.ai_codigo,
      nombre: r.articulo_nombre ?? "(sin nombre)",
      departamento: {
        id: r.dep_id,
        codigo: String(r.dep_numero ?? ""),
        nombre: `Piso ${r.dep_piso ?? "-"} • Depto ${r.dep_numero ?? "-"}`,
        piso: r.dep_piso,
      },
      orden: {
        id: r.orden_id,
        nombre: r.orden_nombre,
        fecha: r.orden_fecha,
        estado_asignacion: r.asignacion_estado,
      },
    }));

    res.json({
      edificio: { id: edificio.id, nombre: edificio.nombre },
      articulos,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "No se pudo obtener artículos identificados asignados" });
  }
});

router.get('/departamento/:id',(req,res)=>{
  try {
  const {id}=req.params;
  const departamento = db.prepare(`
  SELECT d.*, e.nombre AS edificio_nombre
  FROM departamento d
  JOIN edificio e ON d.edificio_id = e.id
  WHERE d.id = ?
`).get(id);
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
    ai.estado,
    a.nombre AS nombre_articulo,
    a.descripcion,
    a.id AS articulo_id,
    os.nombre AS nombre_orden,
    os.fecha
  FROM articulos_identificados_asignados aias
  JOIN articulo_identificado ai ON aias.articulo_identificado_id = ai.id
  JOIN articulo a ON ai.id_articulo = a.id
  JOIN orden_servicio os ON aias.orden_servicio_id = os.id
  WHERE os.departamento_id = ?
  ORDER BY os.fecha DESC
`).all(id);
    
  console.log(departamento)

  res.json({ordenes,departamento,bienesAsignados});
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error al obtener el departamento' });
  }
})


router.get('/vehiculos', (req, res) => {
  try {
    const datos = db.prepare(`
      SELECT
        e.nombre AS edificio_nombre,
        e.imagen,
        e.direccion,
        d.id   AS departamento_id,
        d.numero AS departamento_numero,
        d.piso  AS departamento_piso
      FROM edificio e
      INNER JOIN departamento d ON d.edificio_id = e.id
      WHERE e.nombre = ? COLLATE NOCASE
      ORDER BY d.piso COLLATE NOCASE, d.numero COLLATE NOCASE
    `).all('VEHICULO');

    // Helper para detectar mime simple por "magic numbers"
    const detectMime = (buf) => {
      if (!Buffer.isBuffer(buf) || buf.length < 4) return 'image/jpeg';
      // PNG
      if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return 'image/png';
      // JPEG
      if (buf[0] === 0xFF && buf[1] === 0xD8) return 'image/jpeg';
      // GIF
      if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'image/gif';
      return 'image/jpeg';
    };

    // Si no hay filas, devolvemos estructura vacía compatible con el front
    if (datos.length === 0) {
      return res.json({
        VEHICULO: {
          nombre: 'VEHICULO',
          direccion: '-',
          imagen: null,
          pisos: {}
        }
      });
    }

    const first = datos[0];

    // Solo convertir si es Buffer y no es un marcador tipo "-"
    let imagenBase64 = null;
    if (first.imagen && Buffer.isBuffer(first.imagen) && first.imagen.length > 0) {
      const mime = detectMime(first.imagen);
      imagenBase64 = `data:${mime};base64,${first.imagen.toString('base64')}`;
    }

    const agrupado = {
      nombre: first.edificio_nombre,
      direccion: first.direccion ?? '-',
      imagen: imagenBase64,
      pisos: {}
    };

    for (const fila of datos) {
      const { departamento_id, departamento_numero, departamento_piso } = fila;

      if (!agrupado.pisos[departamento_piso]) {
        agrupado.pisos[departamento_piso] = [];
      }

      agrupado.pisos[departamento_piso].push({
        id: departamento_id,
        numero: departamento_numero, // (marca)
        piso: departamento_piso      // (patente)
      });
    }

    // IMPORTANTE: devolvemos con clave VEHICULO como espera el front
    res.json({ VEHICULO: agrupado });

  } catch (err) {
    console.error("Error al obtener departamentos del edificio VEHICULO:", err.message);
    res.status(500).json({ error: err.message });
  }
});


router.post('/new_vehiculo/', (req, res) => {
  try {
    const {
      numero,
      piso,
      telefono = "-",
      nombre_inquilino = "-",
      apellido_inquilino = "-",
      jerarquia = "-"
    } = req.body;

    // 1. Buscar edificio "VEHICULO"
    let edificio = db.prepare(`SELECT * FROM edificio WHERE nombre = ?`).get("VEHICULO");

    // 2. Si no existe, crearlo
    if (!edificio) {
      const insertEdificio = db.prepare(`
        INSERT INTO edificio (nombre, direccion, imagen, descripcion, encargado, telefono)
        VALUES (@nombre, @direccion, @imagen, @descripcion, @encargado, @telefono)
      `);
      
      const info = insertEdificio.run({
        nombre: "VEHICULO",
        direccion: "-",
        imagen: "-",
        descripcion: "-",
        encargado: "Oficial Montiel",
        telefono: "-"
      });

      // Recuperar el id del nuevo edificio
      edificio = {
        id: info.lastInsertRowid,
        nombre: "VEHICULO"
      };
    }

    // 3. Insertar el nuevo vehículo en departamento
    const insertVehiculo = db.prepare(`
      INSERT INTO departamento 
        (numero, piso, telefono, nombre_inquilino, apellido_inquilino, jerarquia, edificio_id) 
      VALUES 
        (@numero, @piso, @telefono, @nombre_inquilino, @apellido_inquilino, @jerarquia, @edificio_id)
    `);

    const vehiculoInfo = insertVehiculo.run({
      numero,
      piso,
      telefono,
      nombre_inquilino,
      apellido_inquilino,
      jerarquia,
      edificio_id: edificio.id
    });

    // 4. Obtener el registro recién creado para devolverlo
    const vehiculo = db.prepare(`SELECT * FROM departamento WHERE id = ?`).get(vehiculoInfo.lastInsertRowid);

    res.json(vehiculo);

  } catch (err) {
    console.error("Error en /api/edificio/new_vehiculo/:", err);
    res.status(500).json({ error: "Error al crear vehículo" });
  }
});

module.exports = router;