
const formato_tablas= 
{
  "unidad_medida": {
    "campos": ["nombre", "abreviatura"],
    "obligatorios": ["nombre"]
  },
  "categoria": {
    "campos": ["nombre"],
    "obligatorios": ["nombre"]
  },
  "marca": {
    "campos": ["nombre"],
    "obligatorios": ["nombre"]
  },
  "licitacion": {
    "campos": ["nombre", "año"],
    "obligatorios": ["nombre"]
  },  
  "proveedor": {
    "campos": ["razon_social", "direccion", "email"
      , "telefono", "estado", "ruc", "notas", "categorizacion"
    ],
    "obligatorios": ["razon_social"]
  },
  "articulo": {
    "campos": [
      "nombre", "descripcion", "codigo", "precio","imagen",
      "numero_serie", "identificable", "tipo_bien",
      "licitacion_id", "unidad_medida_id", "categoria_id", "marca_id"
    ],
    "obligatorios": ["nombre", "codigo", "precio", "tipo_bien"],
    "tablas": [
      { "tabla": "categoria", "label": "nombre" },
      { "tabla": "licitacion", "label": "nombre" },
      { "tabla": "unidad_medida", "label": "abreviatura" },
      { "tabla": "marca", "label": "nombre" }
    ]
  },
  "articulo_identificado": {
    "campos": ["codigo", "id_articulo"],
    "obligatorios": ["id_articulo"],
    "tablas": [
      { "tabla": "articulo", "label": "nombre" }
    ]
  },
  "ubicacion": {
    "campos": ["nombre"],
    "obligatorios": []
  },
  "edificio": {
    "campos": ["nombre", "direccion","imagen", "descripcion", "encargado", "telefono"],
    "obligatorios": []
  },
  "departamento": {
    "campos": [
      "numero", "piso", "estado", "telefono",
      "nombre_inquilino", "apellido_inquilino", "jerarquia", "edificio_id"
    ],
    "obligatorios": ["estado", "edificio_id"],
    "tablas": [
      { "tabla": "edificio", "label": "nombre" }
    ]
  },
  "vehiculos": {
    "campos": ["marca", "patente", "codigo"],
    "obligatorios": []
  },
  "atributos_vehiculos": {
    "campos": ["atributo", "descripcion", "vehiculo_id"],
    "obligatorios": ["vehiculo_id"],
    "tablas": [
      { "tabla": "vehiculos", "label": "patente" }
    ]
  },

  /***********************Ordenes********************/

orden_servicio: {
  campos: [
    "id",
    "nombre",
    "descripcion",
    "fecha",
    "responsable",
    "imagen",
    "estado",
    "departamento_id",
    "ubicacion_id"
  ],
  obligatorios: ["nombre"],
  tablas_relacionadas: [
    { 
      tabla: "departamento", 
      labels: ["numero", "piso"],
      tablas_relacionadas: [ 
        {
          tabla: "edificio",
          labels: ["nombre"]
        }
      ]
    },
    {
      tabla: "ubicacion",
      labels: ["nombre"],
    }
  ]
},
  "articulos_asignados": {
    "campos": ["cantidad_asignada", "cantidad_entregada", "orden_servicio_id", "articulo_id"],
    "tablas": [
      { "tabla": "ordenes_servicio", "label": "nombre" },
      { "tabla": "articulo", "label": "nombre" }
    ]
  },
  "articulos_identificados_asignados": {
    "campos": ["articulo_identificado_id", "orden_servicio_id"],
    "tablas": [
      { "tabla": "articulo_identificado", "label": "codigo" },
      { "tabla": "ordenes_servicio", "label": "nombre" }
    ]
  },
  "orden_compra": {
    "campos": ["fecha", "codigo_ref","proveedor_id",],
    "obligatorios": ["proveedor_id"],
    "tablas": [
      { "tabla": "proveedor", "label": "razon_social" }
    ]
  },
  "articulos_orden_compra": {
    "campos": ["cantidad_pedida", "cantidad_recibida", "orden_id", "articulo_id"],
    "tablas": [
      { "tabla": "ordenes_compra", "label": "fecha" },
      { "tabla": "articulo", "label": "nombre" }
    ]
  },

  /***********************Prestamo********************/

prestamo: {
  campos: [
    "id",
    "nombre",
    "fecha",
    "autorizado",
    "estado",
    "locacion"
  ],
  obligatorios: ["nombre"],
},
  "articulos_prestados": {
    "campos": ["estado","cantidad", "prestamo_id", "articulo_id"],
    "tablas": [
      { "tabla": "prestamo_id", "label": "nombre" },
      { "tabla": "articulo", "label": "nombre" }
    ]
  },
}


module.exports = formato_tablas;