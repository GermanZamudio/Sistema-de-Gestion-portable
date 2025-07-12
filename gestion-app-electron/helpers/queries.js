//Features
const db=require('../db/db');
const formato_tablas = require('./format_table');
const sharp = require('sharp');
const fs = require('fs');


const getFormTable = (table)=>{
    const formato=formato_tablas[table];
    if (!formato) throw new Error(`La tabla '${table}' no está definida en formato_tablas.`);
    // Si no hay 'tablas', usamos un array vacío para evitar errores
    const tablasAsociadas = (formato.tablas || []).map(({ tabla, label }) => {
      let rows = [];
      try {
        rows = db.prepare(`SELECT id, ${label} FROM ${tabla}`).all();
      } catch (err) {
        console.error(`Error al consultar la tabla asociada ${tabla}:`, err.message);
      }


      return {nombre:tabla,
              labelField: label,
              datos:rows};
    });

    return{
      campos:formato.campos,
      obligatorios:formato.obligatorios,
      relaciones:tablasAsociadas
    }
}

function construirJoins(tabla, aliasBase, tablasRelacionadas, nivel = 0) {
  let joins = [];
  let campos = [];

  if (!tablasRelacionadas) return { joins, campos };

  tablasRelacionadas.forEach((relacion, i) => {
    const alias = `${aliasBase}j${nivel}_${i}`;
    // Join entre aliasBase y tabla relacionada
    joins.push(`LEFT JOIN ${relacion.tabla} ${alias} ON ${alias}.id = ${aliasBase}.${relacion.tabla}_id`);

    // Campos a seleccionar de esta tabla relacionada
    if (Array.isArray(relacion.labels)) {
      relacion.labels.forEach(label => {
        campos.push(`${alias}.${label} AS ${relacion.tabla}_${label}`);
      });
    } else if (relacion.label) {
      campos.push(`${alias}.${relacion.label} AS ${relacion.tabla}_${relacion.label}`);
    }

    // Recursivamente procesa sub-tablas relacionadas
    if (relacion.tablas_relacionadas) {
      const sub = construirJoins(alias, alias, relacion.tablas_relacionadas, nivel + 1);
      joins = joins.concat(sub.joins);
      campos = campos.concat(sub.campos);
    }
  });

  return { joins, campos };
}

const getAllFromTable = (table) => {
  const formato = formato_tablas[table];
  if (!formato) throw new Error(`Formato no definido para la tabla: ${table}`);

  const camposBase = formato.campos.map(campo => `t.${campo}`);
  const { joins, campos } = construirJoins('t', 't', formato.tablas_relacionadas);
  const todosLosCampos = [...camposBase, ...campos].join(', ');

  const query = `
    SELECT ${todosLosCampos}
    FROM ${table} t
    ${joins.join('\n')}
  `;

  const data = db.prepare(query).all();

  // Convertir imagen buffer a base64 con prefijo para cada registro
  for (const registro of data) {
    if (registro.imagen) {
      registro.imagen = `data:image/jpeg;base64,${registro.imagen.toString('base64')}`;
    }
  }

  return { data };
};



const getRecordById = (table, id) => {
  const record = db.prepare(`SELECT * FROM ${table} WHERE id=?`).get(id);
  if (!record) {
    throw new Error(`No record found with id=${id} in table ${table}`);
  }
  
  if (record.imagen) {
    // Convertir Buffer a base64 y agregar prefijo MIME para JPEG
    record.imagen = `data:image/jpeg;base64,${record.imagen.toString('base64')}`;
  }
  
  console.log('Registro obtenido:', record);  // Aquí ves qué trae

  return record;
};


const insertRecord = async (table, data) => {
  const formato = formato_tablas[table];
  if (!formato) throw new Error(`Los datos no corresponden a ningun formato de tabla válida: ${table}`);

  for (const campo of formato.obligatorios) {
    if (!(campo in data)) {
      throw new Error(`Faltan campos obligatorios: ${campo}`);
    }
  }

  const camposForaneos = ['licitacion_id', 'marca_id', 'categoria_id', 'unidad_medida_id'];

  const campos = [];
  const placeholders = [];
  const valores = [];

  for (const campo of formato.campos) {
    if (campo in data) {
      let valor = data[campo];

      if (camposForaneos.includes(campo) && valor === '') {
        valor = null;
      }

      if (campo === 'imagen' && valor) {
        if (Buffer.isBuffer(valor)) {
          // Si ya es buffer, procesar con sharp directamente
          try {
            const imagenProcesada = await sharp(valor)
              .resize({ width: 500 })
              .jpeg({ quality: 70 })
              .toBuffer();

            campos.push(campo);
            placeholders.push('?');
            valores.push(imagenProcesada);
          } catch (error) {
            throw new Error('No se pudo procesar la imagen: ' + error.message);
          }
        } else if (typeof valor === 'string') {
          // Procesar base64 (si viene así)
          let base64String = valor;
          if (!valor.startsWith('data:image')) {
            base64String = `data:image/jpeg;base64,${valor}`;
          }
          try {
            const base64Data = base64String.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');

            const imagenProcesada = await sharp(buffer)
              .resize({ width: 500 })
              .jpeg({ quality: 70 })
              .toBuffer();

            campos.push(campo);
            placeholders.push('?');
            valores.push(imagenProcesada);
          } catch (error) {
            throw new Error('No se pudo procesar la imagen: ' + error.message);
          }
        } else {
          throw new Error('Formato de imagen no válido');
        }
      } else {
        campos.push(campo);
        placeholders.push('?');
        valores.push(valor);
      }
    }
  }

  if (campos.length === 0) {
    throw new Error('No ingresaste datos para insertar en la BBDD');
  }

  const sql = `INSERT INTO ${table} (${campos.join(',')}) VALUES (${placeholders.join(',')})`;
  const sentencia = db.prepare(sql);
  const result = sentencia.run(...valores);

  const respuesta = { id: result.lastInsertRowid };
  for (const campo of campos) {
    respuesta[campo] = data[campo];
  }

  return respuesta;
};


const updateRecord=(table,dataToUpdate,whereClause)=>{
        //Extraemos los campos y los datos a cambiar
        const campos = Object.keys(dataToUpdate);
        const valores = Object.values(dataToUpdate);
        //Extraemos las condiciones
        const condicion=Object.keys(whereClause);
        const condicionValor=Object.values(whereClause);

        if (campos.length===0 || condicion.length===0){
          throw new Error("No ingreso los valores o las condiciones");
        }

        const setPart = campos.map(campo => `${campo}=?`).join(', ');
        const wherePart=condicion.map(campo=>`${campo}=?`).join(' AND ');

        const sql=`UPDATE ${table} SET ${setPart} WHERE ${wherePart}`;
        const sentencia=db.prepare(sql);
        const result=sentencia.run(...valores,...condicionValor);
        if (result.changes === 0) {
          throw new Error(`No se modificó ningún registro en la tabla '${table}'`);
        }

        return {
          message: `Se actualizaron ${result.changes} registro(s) en la tabla '${table}'`,
          result
        };
      }



  
module.exports = {getAllFromTable, getRecordById, insertRecord, updateRecord,getFormTable };