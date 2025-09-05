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



  /************** MOVIMIENTOS ****************/
  db.prepare(`
    CREATE TABLE IF NOT EXISTS movimientos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      articulo_id INTEGER NOT NULL,
      tipo_movimiento TEXT CHECK (tipo_movimiento IN ('ENTRADA', 'UPDATE','SALIDA')) NOT NULL,
      cantidad INTEGER NOT NULL,
      fecha TEXT DEFAULT CURRENT_TIMESTAMP,
      fuente TEXT,         -- 'orden_compra', 'orden_servicio', 'prestamo', 'articulo_identificado', 'sobrante', 'sobrante_utilizado'
      fuente_id INTEGER,   -- ID de la entidad relacionada
      observaciones TEXT
    )
  `).run();

  // Índices útiles (lecturas rápidas)
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos (fecha DESC);
    CREATE INDEX IF NOT EXISTS idx_movimientos_articulo ON movimientos (articulo_id);
    CREATE INDEX IF NOT EXISTS idx_movimientos_fuente ON movimientos (fuente, fuente_id);
  `);

  /***************** TRIGGERS ******************/
  db.exec(`
    ------------------------------------------------------------------
    -- ORDEN DE COMPRA: entradas de stock por recepción
    ------------------------------------------------------------------

    -- Insert inicial: registra lo recibido (si hubiera cantidad_recibida)
    CREATE TRIGGER IF NOT EXISTS trg_oc_insert
    AFTER INSERT ON articulos_orden_compra
    FOR EACH ROW
    WHEN NEW.cantidad_recibida IS NOT NULL AND NEW.cantidad_recibida > 0
    BEGIN
      INSERT INTO movimientos (articulo_id, tipo_movimiento, cantidad, fecha, fuente, fuente_id, observaciones)
      VALUES (NEW.articulo_id, 'ENTRADA', NEW.cantidad_recibida, CURRENT_TIMESTAMP, 'orden_compra', NEW.orden_id, 'Ingreso por orden de compra (insert)');
    END;

    -- Recepción parcial / adicional (aumenta cantidad_recibida)
    CREATE TRIGGER IF NOT EXISTS trg_oc_update_recibida
    AFTER UPDATE OF cantidad_recibida ON articulos_orden_compra
    FOR EACH ROW
    WHEN NEW.cantidad_recibida > OLD.cantidad_recibida
    BEGIN
      INSERT INTO movimientos (articulo_id, tipo_movimiento, cantidad, fecha, fuente, fuente_id, observaciones)
      VALUES (NEW.articulo_id, 'ENTRADA', NEW.cantidad_recibida - OLD.cantidad_recibida, CURRENT_TIMESTAMP, 'orden_compra', NEW.orden_id, 'Entrega parcial registrada');
    END;

    -- Eliminación de la línea: descuenta lo recibido de stock (rollback)
    CREATE TRIGGER IF NOT EXISTS trg_oc_delete
    AFTER DELETE ON articulos_orden_compra
    FOR EACH ROW
    WHEN OLD.cantidad_recibida IS NOT NULL AND OLD.cantidad_recibida > 0
    BEGIN
      INSERT INTO movimientos (articulo_id, tipo_movimiento, cantidad, fecha, fuente, fuente_id, observaciones)
      VALUES (OLD.articulo_id, 'SALIDA', OLD.cantidad_recibida, CURRENT_TIMESTAMP, 'orden_compra', OLD.orden_id, 'Eliminación de artículo en orden de compra');
    END;

    ------------------------------------------------------------------
    -- ORDEN DE SERVICIO (artículos genéricos): salida al ENTREGAR
    -- 🔁 CAMBIO CLAVE: movemos stock cuando cambia cantidad_entregada,
    --     NO al asignar. Si se reduce lo entregado, registramos ENTRADA.
    ------------------------------------------------------------------

    CREATE TRIGGER IF NOT EXISTS trg_os_update_entregada
    AFTER UPDATE OF cantidad_entregada ON articulos_asignados
    FOR EACH ROW
    WHEN NEW.cantidad_entregada != OLD.cantidad_entregada
    BEGIN
      INSERT INTO movimientos (articulo_id, tipo_movimiento, cantidad, fecha, fuente, fuente_id, observaciones)
      VALUES (
        NEW.articulo_id,
        CASE WHEN NEW.cantidad_entregada > OLD.cantidad_entregada THEN 'SALIDA' ELSE 'ENTRADA' END,
        ABS(NEW.cantidad_entregada - OLD.cantidad_entregada),
        CURRENT_TIMESTAMP,
        'orden_servicio',
        NEW.orden_servicio_id,
        'Cambio en cantidad entregada'
      );
    END;

    -- Si se elimina la línea: si tenía algo entregado, retorna ese stock.
    CREATE TRIGGER IF NOT EXISTS trg_os_delete
    AFTER DELETE ON articulos_asignados
    FOR EACH ROW
    WHEN OLD.cantidad_entregada IS NOT NULL AND OLD.cantidad_entregada > 0
    BEGIN
      INSERT INTO movimientos (articulo_id, tipo_movimiento, cantidad, fecha, fuente, fuente_id, observaciones)
      VALUES (OLD.articulo_id, 'ENTRADA', OLD.cantidad_entregada, CURRENT_TIMESTAMP, 'orden_servicio', OLD.orden_servicio_id, 'Eliminación de asignación: devuelve lo entregado');
    END;

    ------------------------------------------------------------------
    -- ORDEN DE SERVICIO (identificados): salida al CULMINAR
    --   y entrada si se revierte a ASIGNADO.
    ------------------------------------------------------------------

    -- Al pasar a CULMINADO, SALIDA de 1 unidad del artículo base
    CREATE TRIGGER IF NOT EXISTS trg_os_ident_culminado
    AFTER UPDATE OF estado ON articulos_identificados_asignados
    FOR EACH ROW
    WHEN NEW.estado = 'CULMINADO' AND OLD.estado != 'CULMINADO'
    BEGIN
      INSERT INTO movimientos (articulo_id, tipo_movimiento, cantidad, fecha, fuente, fuente_id, observaciones)
      SELECT
        ai.id_articulo,
        'SALIDA',
        1,
        CURRENT_TIMESTAMP,
        'articulo_identificado',
        NEW.id,
        'Identificado culminado (entregado en OS)'
      FROM articulo_identificado ai
      WHERE ai.id = NEW.articulo_identificado_id;
    END;

    -- Si se revierte de CULMINADO a ASIGNADO, ENTRADA de 1 unidad
    CREATE TRIGGER IF NOT EXISTS trg_os_ident_revert
    AFTER UPDATE OF estado ON articulos_identificados_asignados
    FOR EACH ROW
    WHEN OLD.estado = 'CULMINADO' AND NEW.estado = 'ASIGNADO'
    BEGIN
      INSERT INTO movimientos (articulo_id, tipo_movimiento, cantidad, fecha, fuente, fuente_id, observaciones)
      SELECT
        ai.id_articulo,
        'ENTRADA',
        1,
        CURRENT_TIMESTAMP,
        'articulo_identificado',
        NEW.id,
        'Reversión de entrega de identificado en OS'
      FROM articulo_identificado ai
      WHERE ai.id = NEW.articulo_identificado_id;
    END;

    ------------------------------------------------------------------
    -- ARTÍCULO IDENTIFICADO: BAJA y reversión de BAJA
    ------------------------------------------------------------------

    CREATE TRIGGER IF NOT EXISTS trg_ident_baja
    AFTER UPDATE OF estado ON articulo_identificado
    FOR EACH ROW
    WHEN NEW.estado = 'BAJA' AND OLD.estado != 'BAJA'
    BEGIN
      INSERT INTO movimientos (articulo_id, tipo_movimiento, cantidad, fecha, fuente, fuente_id, observaciones)
      VALUES (NEW.id_articulo, 'SALIDA', 1, CURRENT_TIMESTAMP, 'articulo_identificado', NEW.id, 'Artículo identificado dado de baja');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_ident_revert_baja
    AFTER UPDATE OF estado ON articulo_identificado
    FOR EACH ROW
    WHEN OLD.estado = 'BAJA' AND NEW.estado != 'BAJA'
    BEGIN
      INSERT INTO movimientos (articulo_id, tipo_movimiento, cantidad, fecha, fuente, fuente_id, observaciones)
      VALUES (NEW.id_articulo, 'ENTRADA', 1, CURRENT_TIMESTAMP, 'articulo_identificado', NEW.id, 'Reversión de baja (rehabilitado)');
    END;

    ------------------------------------------------------------------
    -- PRÉSTAMOS: salida al prestar, entrada por devoluciones parciales
    ------------------------------------------------------------------

    -- Al crear el préstamo de un artículo: SALIDA de la cantidad prestada
    CREATE TRIGGER IF NOT EXISTS trg_prestamo_insert
    AFTER INSERT ON articulos_prestados
    FOR EACH ROW
    WHEN NEW.cantidad IS NOT NULL AND NEW.cantidad > 0
    BEGIN
      INSERT INTO movimientos (articulo_id, tipo_movimiento, cantidad, fecha, fuente, fuente_id, observaciones)
      VALUES (NEW.articulo_id, 'SALIDA', NEW.cantidad, CURRENT_TIMESTAMP, 'prestamo', NEW.prestamo_id, 'Artículo prestado');
    END;

    -- Devolución parcial: al aumentar cantidad_devuelta, ENTRADA del delta
    CREATE TRIGGER IF NOT EXISTS trg_prestamo_update_devuelta
    AFTER UPDATE OF cantidad_devuelta ON articulos_prestados
    FOR EACH ROW
    WHEN NEW.cantidad_devuelta > OLD.cantidad_devuelta
    BEGIN
      INSERT INTO movimientos (articulo_id, tipo_movimiento, cantidad, fecha, fuente, fuente_id, observaciones)
      VALUES (NEW.articulo_id, 'ENTRADA', NEW.cantidad_devuelta - OLD.cantidad_devuelta, CURRENT_TIMESTAMP, 'prestamo', NEW.prestamo_id, 'Devolución parcial de préstamo');
    END;

    -- Si se borra la línea y había cantidad no devuelta: ENTRADA de lo pendiente
    CREATE TRIGGER IF NOT EXISTS trg_prestamo_delete
    AFTER DELETE ON articulos_prestados
    FOR EACH ROW
    WHEN (OLD.cantidad - COALESCE(OLD.cantidad_devuelta,0)) > 0
    BEGIN
      INSERT INTO movimientos (articulo_id, tipo_movimiento, cantidad, fecha, fuente, fuente_id, observaciones)
      VALUES (OLD.articulo_id, 'ENTRADA', OLD.cantidad - COALESCE(OLD.cantidad_devuelta,0), CURRENT_TIMESTAMP, 'prestamo', OLD.prestamo_id, 'Eliminación de línea: devuelve pendiente');
    END;

    ------------------------------------------------------------------
    -- SOBRANTES: entrada cuando se registra, salida cuando se utiliza
    ------------------------------------------------------------------

    -- Registrar sobrante: ENTRADA
    CREATE TRIGGER IF NOT EXISTS trg_sobrante_insert
    AFTER INSERT ON sobrantes
    FOR EACH ROW
    WHEN NEW.cantidad IS NOT NULL AND NEW.cantidad > 0
    BEGIN
      INSERT INTO movimientos (articulo_id, tipo_movimiento, cantidad, fecha, fuente, fuente_id, observaciones)
      VALUES (NEW.articulo_id, 'ENTRADA', NEW.cantidad, CURRENT_TIMESTAMP, 'sobrante', NEW.orden_id, 'Registro de sobrante');
    END;

    -- Usar sobrante: SALIDA (toma articulo_id desde la tabla sobrantes)
    CREATE TRIGGER IF NOT EXISTS trg_sobrante_utilizado_insert
    AFTER INSERT ON sobrante_utilizado
    FOR EACH ROW
    WHEN NEW.cantidad IS NOT NULL AND NEW.cantidad > 0
    BEGIN
      INSERT INTO movimientos (articulo_id, tipo_movimiento, cantidad, fecha, fuente, fuente_id, observaciones)
      SELECT s.articulo_id, 'SALIDA', NEW.cantidad, CURRENT_TIMESTAMP, 'sobrante_utilizado', NEW.orden_id, 'Uso de sobrante'
      FROM sobrantes s
      WHERE s.id = NEW.sobrante_id;
    END;

    -- Si se elimina el uso del sobrante: ENTRADA
    CREATE TRIGGER IF NOT EXISTS trg_sobrante_utilizado_delete
    AFTER DELETE ON sobrante_utilizado
    FOR EACH ROW
    WHEN OLD.cantidad IS NOT NULL AND OLD.cantidad > 0
    BEGIN
      INSERT INTO movimientos (articulo_id, tipo_movimiento, cantidad, fecha, fuente, fuente_id, observaciones)
      SELECT s.articulo_id, 'ENTRADA', OLD.cantidad, CURRENT_TIMESTAMP, 'sobrante_utilizado', OLD.orden_id, 'Reversión de uso de sobrante'
      FROM sobrantes s
      WHERE s.id = OLD.sobrante_id;
    END;
  `);
  console.log("Todas las tablas fueron creadas (si no existían).");
}

module.exports = initDatabase;