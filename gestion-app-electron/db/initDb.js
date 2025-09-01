const db = require('./db');

function initDatabase() {
  /***************** ATRIBUTOS *******************/
  db.prepare(`
    CREATE TABLE IF NOT EXISTS unidad_medida (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      abreviatura TEXT UNIQUE
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS categoria (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS marca (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS licitacion(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      año TEXT
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS articulo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      codigo TEXT,
      precio REAL,
      numero_serie TEXT,
      identificable BOOLEAN,
      tipo_bien TEXT NOT NULL CHECK (tipo_bien IN ('STOCK', 'USO', 'CONSUMO','HERRAMIENTA')),
      licitacion_id INTEGER,
      unidad_medida_id INTEGER,
      categoria_id INTEGER,
      marca_id INTEGER,
      imagen BLOB,
      FOREIGN KEY (licitacion_id) REFERENCES licitacion(id) ON DELETE CASCADE,
      FOREIGN KEY (marca_id) REFERENCES marca(id) ON DELETE CASCADE,
      FOREIGN KEY (unidad_medida_id) REFERENCES unidad_medida(id) ON DELETE CASCADE,
      FOREIGN KEY (categoria_id) REFERENCES categoria(id) ON DELETE CASCADE
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS articulo_identificado (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT NOT NULL,
      estado TEXT CHECK (estado IN ('ALTA','OBSERVACION','BAJA')) DEFAULT 'ALTA',
      causa TEXT,
      fecha_baja TEXT,
      id_articulo INTEGER,
      FOREIGN KEY (id_articulo) REFERENCES articulo(id) ON DELETE CASCADE,
      CHECK (estado != 'BAJA' OR (causa IS NOT NULL AND TRIM(causa) != '')),
      CHECK (estado != 'BAJA' OR (fecha_baja IS NOT NULL AND TRIM(fecha_baja) != ''))
      )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS ubicacion(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS existencia (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cantidad INTEGER DEFAULT 0,
      pendiente_a_entregar INTEGER DEFAULT 0,
      articulo_asociado_id INTEGER NOT NULL,
      ubicacion_id INTEGER,
      FOREIGN KEY (articulo_asociado_id) REFERENCES articulo(id) ON DELETE CASCADE,
      FOREIGN KEY (ubicacion_id) REFERENCES ubicacion(id) ON DELETE CASCADE
    )
  `).run();

  /***************** EDIFICIOS *******************/
  db.prepare(`
    CREATE TABLE IF NOT EXISTS edificio (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT,
      direccion TEXT,
      imagen BLOB,
      descripcion TEXT,
      encargado TEXT,
      telefono TEXT
      
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS departamento (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero TEXT,
      piso TEXT,
      imagen BLOB,
      estado TEXT CHECK (estado IN ('ACTIVO', 'REPARANDO')) NOT NULL DEFAULT 'ACTIVO',
      telefono TEXT,
      nombre_inquilino TEXT,
      apellido_inquilino TEXT,
      jerarquia TEXT,
      edificio_id INTEGER,
      FOREIGN KEY (edificio_id) REFERENCES edificio(id) ON DELETE CASCADE
    )
  `).run();

  /************** ORDENES SERVICIO ****************/
  db.prepare(`
    CREATE TABLE IF NOT EXISTS orden_servicio (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      fecha TEXT,
      responsable TEXT,
      imagen BLOB,
      estado TEXT CHECK (estado IN ('ACTIVO','CULMINADO')) NOT NULL DEFAULT 'ACTIVO',
      departamento_id INTEGER,
      ubicacion_id INTEGER,
      FOREIGN KEY (ubicacion_id) REFERENCES ubicacion(id) ON DELETE CASCADE,
      FOREIGN KEY (departamento_id) REFERENCES departamento(id) ON DELETE CASCADE
    )
  `).run();
  
  db.prepare(`
    CREATE TABLE IF NOT EXISTS articulos_identificados_asignados (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      estado TEXT CHECK (estado IN ('ASIGNADO','ENTREGADO')) DEFAULT 'ASIGNADO',
      articulo_identificado_id INTEGER,
      orden_servicio_id INTEGER,
      FOREIGN KEY (articulo_identificado_id) REFERENCES articulo_identificado(id) ON DELETE CASCADE,
      FOREIGN KEY (orden_servicio_id) REFERENCES orden_servicio(id) ON DELETE CASCADE
      )`
  ).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS articulos_asignados (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cantidad_asignada INTEGER,
      cantidad_entregada INTEGER,
      orden_servicio_id INTEGER,
      estado TEXT CHECK (estado IN ('ACTIVO','CULMINADO')) DEFAULT 'ACTIVO',
      articulo_id INTEGER,
      FOREIGN KEY (orden_servicio_id) REFERENCES orden_servicio(id) ON DELETE CASCADE,
      FOREIGN KEY (articulo_id) REFERENCES articulo(id) ON DELETE CASCADE
    )`).run();


  /************** PRESTAMO *****************/
  db.prepare(`
    CREATE TABLE IF NOT EXISTS prestamo(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    fecha TEXT,
    autorizado TEXT,
    estado TEXT CHECK (estado IN ('ACTIVO','CULMINADO')) DEFAULT 'ACTIVO',
    locacion TEXT
    )`).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS articulos_prestados(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    estado TEXT CHECK(estado IN('PRESTADO','DEVUELTO')) DEFAULT 'PRESTADO',
    cantidad INTEGER DEFAULT 0,
    cantidad_devuelta INTEGER DEFAULT 0,
    articulo_id INTEGER,
    prestamo_id INTEGER,
    FOREIGN KEY(prestamo_id) REFERENCES prestamo(id) ON DELETE CASCADE,
    FOREIGN KEY(articulo_id) REFERENCES articulo(id) ON DELETE SET NULL
    )`).run();

  /************** SOBRANTES ****************/
  db.prepare(`
    CREATE TABLE IF NOT EXISTS sobrantes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cantidad INTEGER,
      fecha TEXT,
      orden_id INTEGER,
      articulo_id INTEGER,
      ubicacion_id INTEGER,
      FOREIGN KEY (orden_id) REFERENCES orden_servicio(id) ON DELETE CASCADE,
      FOREIGN KEY (articulo_id) REFERENCES articulo(id) ON DELETE CASCADE,    
      FOREIGN KEY (ubicacion_id) REFERENCES ubicacion(id) ON DELETE CASCADE

      )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS sobrante_utilizado (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cantidad INTEGER,
      fecha TEXT,
      orden_id INTEGER,
      sobrante_id INTEGER,
      FOREIGN KEY (orden_id) REFERENCES orden_servicio(id) ON DELETE CASCADE,
      FOREIGN KEY (sobrante_id) REFERENCES sobrantes(id) ON DELETE CASCADE
    )
  `).run();



  /************** ORDENES COMPRA ****************/
  db.prepare(`
    CREATE TABLE IF NOT EXISTS proveedor (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      razon_social TEXT NOT NULL,
      direccion TEXT,
      email TEXT,
      telefono TEXT,
      estado INTEGER DEFAULT 1,
      ruc TEXT,
      notas TEXT,
      categorizacion TEXT
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS orden_compra (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT,
      codigo_ref TEXT,
      proveedor_id INTEGER,
      estado TEXT CHECK (estado IN ('ACTIVO','CULMINADO')) DEFAULT 'ACTIVO',
      FOREIGN KEY (proveedor_id) REFERENCES proveedor(id) ON DELETE CASCADE
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS articulos_orden_compra (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cantidad_pedida INTEGER,
      cantidad_recibida INTEGER,
      orden_id INTEGER,
      articulo_id INTEGER,
      FOREIGN KEY (orden_id) REFERENCES orden_compra(id) ON DELETE CASCADE,
      FOREIGN KEY (articulo_id) REFERENCES articulo(id) ON DELETE CASCADE
    )
  `).run();


  //Tabla de movimientos generales: 
  db.prepare(`
    CREATE TABLE IF NOT EXISTS movimientos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    articulo_id INTEGER NOT NULL,
    tipo_movimiento TEXT CHECK (tipo_movimiento IN ('ENTRADA', 'UPDATE','SALIDA')) NOT NULL,
    cantidad INTEGER NOT NULL,
    fecha TEXT DEFAULT CURRENT_TIMESTAMP,
    fuente TEXT,         -- 'orden_compra', 'orden_servicio', 'Herramienta' etc.
    fuente_id INTEGER,   -- ID de la orden relacionada
    observaciones TEXT
  );`).run();

 db.exec(`

  -- TRIGGER para INSERT en articulos_orden_compra (entrada stock)
CREATE TRIGGER IF NOT EXISTS trigger_articulos_orden_compra_insert
AFTER INSERT ON articulos_orden_compra
FOR EACH ROW
BEGIN
INSERT INTO movimientos (
articulo_id, tipo_movimiento, cantidad, fecha,
fuente, fuente_id, observaciones
)
VALUES (
NEW.articulo_id, 'ENTRADA', NEW.cantidad_recibida, CURRENT_TIMESTAMP,
'orden_compra', NEW.orden_id, 'Ingreso por orden de compra'
);
END;

-- TRIGGER para UPDATE en articulos_orden_compra (entrada parcial)
CREATE TRIGGER IF NOT EXISTS trigger_articulos_orden_compra_update
AFTER UPDATE OF cantidad_recibida ON articulos_orden_compra
FOR EACH ROW
WHEN NEW.cantidad_recibida > OLD.cantidad_recibida
BEGIN
INSERT INTO movimientos (
articulo_id, tipo_movimiento, cantidad, fecha,
fuente, fuente_id, observaciones
)
VALUES (
NEW.articulo_id, 'ENTRADA',
NEW.cantidad_recibida - OLD.cantidad_recibida, CURRENT_TIMESTAMP,
'orden_compra', NEW.orden_id, 'Entrega parcial registrada'
);
END;

-- TRIGGER para DELETE en articulos_orden_compra
CREATE TRIGGER IF NOT EXISTS trigger_articulos_orden_compra_delete
AFTER DELETE ON articulos_orden_compra
FOR EACH ROW
BEGIN
INSERT INTO movimientos (
articulo_id, tipo_movimiento, cantidad, fecha,
fuente, fuente_id, observaciones
)
VALUES (
OLD.articulo_id, 'SALIDA', OLD.cantidad_recibida, CURRENT_TIMESTAMP,
'orden_compra', OLD.orden_id, 'Eliminación de artículo en orden de compra, stock reducido'
);
END;

-- TRIGGER para INSERT en articulos_asignados (salida stock)
CREATE TRIGGER IF NOT EXISTS trigger_articulos_asignados_insert
AFTER INSERT ON articulos_asignados
FOR EACH ROW
BEGIN
INSERT INTO movimientos (
articulo_id, tipo_movimiento, cantidad, fecha,
fuente, fuente_id, observaciones
)
VALUES (
NEW.articulo_id, 'SALIDA', NEW.cantidad_asignada, CURRENT_TIMESTAMP,
'orden_servicio', NEW.orden_servicio_id, 'Asignación a orden de servicio'
);
END;

-- TRIGGER para UPDATE en articulos_asignados (cambio de cantidad)
CREATE TRIGGER IF NOT EXISTS trigger_articulos_asignados_update
AFTER UPDATE OF cantidad_asignada ON articulos_asignados
FOR EACH ROW
WHEN NEW.cantidad_asignada != OLD.cantidad_asignada
BEGIN
INSERT INTO movimientos (
articulo_id, tipo_movimiento, cantidad, fecha,
fuente, fuente_id, observaciones
)
VALUES (
NEW.articulo_id,
CASE WHEN NEW.cantidad_asignada > OLD.cantidad_asignada THEN 'SALIDA' ELSE 'ENTRADA' END,
ABS(NEW.cantidad_asignada - OLD.cantidad_asignada), CURRENT_TIMESTAMP,
'orden_servicio', NEW.orden_servicio_id, 'Actualización de cantidad asignada'
);
END;

-- TRIGGER para DELETE en articulos_asignados
CREATE TRIGGER IF NOT EXISTS trigger_articulos_asignados_delete
AFTER DELETE ON articulos_asignados
FOR EACH ROW
BEGIN
INSERT INTO movimientos (
articulo_id, tipo_movimiento, cantidad, fecha,
fuente, fuente_id, observaciones
)
VALUES (
OLD.articulo_id, 'ENTRADA', OLD.cantidad_asignada, CURRENT_TIMESTAMP,
'orden_servicio', OLD.orden_servicio_id, 'Eliminación de asignación, devolución de stock'
);
END;

-- TRIGGER para UPDATE en articulos_asignados (cambio de estado a UTILIZADO)
CREATE TRIGGER IF NOT EXISTS trigger_articulos_asignados_estado_utilizado
AFTER UPDATE OF estado ON articulos_asignados
FOR EACH ROW
WHEN NEW.estado = 'UTILIZADO' AND OLD.estado != 'UTILIZADO'
BEGIN
INSERT INTO movimientos (
articulo_id, tipo_movimiento, cantidad, fecha,
fuente, fuente_id, observaciones
)
VALUES (
NEW.articulo_id, 'SALIDA', NEW.cantidad_asignada, CURRENT_TIMESTAMP,
'orden_servicio', NEW.orden_servicio_id, 'Confirmación de uso del artículo (estado UTILIZADO)'
);
END;

-- TRIGGER para INSERT en repuestos_asignados
CREATE TRIGGER IF NOT EXISTS trigger_repuestos_asignados_insert
AFTER INSERT ON repuestos_asignados
FOR EACH ROW
BEGIN
INSERT INTO movimientos (
articulo_id, tipo_movimiento, cantidad, fecha,
fuente, fuente_id, observaciones
)
VALUES (
NEW.articulo_id, 'SALIDA', NEW.cantidad, CURRENT_TIMESTAMP,
'orden_reparacion', NEW.orden_reparacion_id, 'Repuesto asignado a reparación'
);
END;

-- TRIGGER para UPDATE en repuestos_asignados
CREATE TRIGGER IF NOT EXISTS trigger_repuestos_asignados_update
AFTER UPDATE OF cantidad ON repuestos_asignados
FOR EACH ROW
WHEN NEW.cantidad != OLD.cantidad
BEGIN
INSERT INTO movimientos (
articulo_id, tipo_movimiento, cantidad, fecha,
fuente, fuente_id, observaciones
)
VALUES (
NEW.articulo_id,
CASE WHEN NEW.cantidad > OLD.cantidad THEN 'SALIDA' ELSE 'ENTRADA' END,
ABS(NEW.cantidad - OLD.cantidad), CURRENT_TIMESTAMP,
'orden_reparacion', NEW.orden_reparacion_id, 'Actualización de cantidad repuesto asignado'
);
END;

-- TRIGGER para DELETE en repuestos_asignados
CREATE TRIGGER IF NOT EXISTS trigger_repuestos_asignados_delete
AFTER DELETE ON repuestos_asignados
FOR EACH ROW
BEGIN
INSERT INTO movimientos (
articulo_id, tipo_movimiento, cantidad, fecha,
fuente, fuente_id, observaciones
)
VALUES (
OLD.articulo_id, 'ENTRADA', OLD.cantidad, CURRENT_TIMESTAMP,
'orden_reparacion', OLD.orden_reparacion_id, 'Eliminación de repuesto asignado, devolución de stock'
);
END;

-- TRIGGER para reversión de BAJA
CREATE TRIGGER IF NOT EXISTS trigger_articulo_identificado_revertir_baja
AFTER UPDATE OF estado ON articulo_identificado
FOR EACH ROW
WHEN OLD.estado = 'BAJA' AND NEW.estado != 'BAJA'
BEGIN
INSERT INTO movimientos (
articulo_id,
tipo_movimiento,
cantidad,
fecha,
fuente,
fuente_id,
observaciones
)
VALUES (
NEW.id_articulo,
'ENTRADA',
1,
CURRENT_TIMESTAMP,
'articulo_identificado',
NEW.id,
'Reversión de baja, artículo identificado rehabilitado'
);
END;

-- TRIGGER para cambio de estado a BAJA en articulo_identificado
CREATE TRIGGER IF NOT EXISTS trigger_articulo_identificado_baja
AFTER UPDATE OF estado ON articulo_identificado
FOR EACH ROW
WHEN NEW.estado = 'BAJA' AND OLD.estado != 'BAJA'
BEGIN
  INSERT INTO movimientos (
    articulo_id,
    tipo_movimiento,
    cantidad,
    fecha,
    fuente,
    fuente_id,
    observaciones
  )
  VALUES (
    NEW.id_articulo,
    'SALIDA',
    1,
    CURRENT_TIMESTAMP,
    'articulo_identificado',
    NEW.id,
    'Artículo identificado dado de baja'
  );
END;
-- TRIGGER para INSERT en articulos_prestados (SALIDA)
CREATE TRIGGER IF NOT EXISTS trigger_articulos_prestados_insert
AFTER INSERT ON articulos_prestados
FOR EACH ROW
BEGIN
  INSERT INTO movimientos (
    articulo_id,
    tipo_movimiento,
    cantidad,
    fecha,
    fuente,
    fuente_id,
    observaciones
  )
  VALUES (
    NEW.articulo_id,
    'SALIDA',
    NEW.cantidad,
    CURRENT_TIMESTAMP,
    'prestamo',
    NEW.prestamo_id,
    'Artículo prestado'
  );
END;

-- TRIGGER para UPDATE de estado en articulos_prestados (ENTRADA si se devuelve)
CREATE TRIGGER IF NOT EXISTS trigger_articulos_prestados_estado_devuelto
AFTER UPDATE OF estado ON articulos_prestados
FOR EACH ROW
WHEN OLD.estado != 'DEVUELTO' AND NEW.estado = 'DEVUELTO'
BEGIN
  INSERT INTO movimientos (
    articulo_id,
    tipo_movimiento,
    cantidad,
    fecha,
    fuente,
    fuente_id,
    observaciones
  )
  VALUES (
    NEW.articulo_id,
    'ENTRADA',
    NEW.cantidad,
    CURRENT_TIMESTAMP,
    'prestamo',
    NEW.prestamo_id,
    'Devolución de artículo prestado'
  );
END;

-- TRIGGER para DELETE de articulos_prestados (se asume que se devuelve)
CREATE TRIGGER IF NOT EXISTS trigger_articulos_prestados_delete
AFTER DELETE ON articulos_prestados
FOR EACH ROW
BEGIN
  INSERT INTO movimientos (
    articulo_id,
    tipo_movimiento,
    cantidad,
    fecha,
    fuente,
    fuente_id,
    observaciones
  )
  VALUES (
    OLD.articulo_id,
    'ENTRADA',
    OLD.cantidad,
    CURRENT_TIMESTAMP,
    'prestamo',
    OLD.prestamo_id,
    'Eliminación de artículo prestado, se devuelve al stock'
  );
END;
  `);

  console.log("Todas las tablas fueron creadas (si no existían).");
}

module.exports = initDatabase;