// src/utils/exportPdf.js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Exporta cualquier tabla a PDF, ajustando su ancho al tamaño de página A4.
 *
 * @param {Object}  opts
 * @param {String}  opts.title               Título del reporte
 * @param {Array}   opts.columns             Columnas [{ header, field, width?, align?, formatter? }]
 * @param {Array}   opts.rows                Array de objetos (tu data)
 * @param {String}  [opts.fileName]          Nombre del PDF
 * @param {Boolean} [opts.landscape=false]   true => A4 horizontal
 * @param {Object}  [opts.meta]              { left?: string[], right?: string[] }
 * @param {Object}  [opts.margins]           { left, right, top }
 * @param {Array}   [opts.widthPercents]     Distribución proporcional del ancho (debe sumar ~1)
 * @param {Number}  [opts.fontSize=9]        Tamaño de fuente del cuerpo
 */
// src/utils/exportPdf.js

export function exportTableToPDF({
  title,
  columns,
  rows,
  fileName = 'reporte.pdf',
  landscape = false,
  meta = {},
  margins = { left: 14, right: 14, top: 28 },
  widthPercents,        // [0.25, 0.35, 0.2, 0.1, 0.1] debe sumar 1
  fontSize = 9,
}) {
  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: landscape ? 'landscape' : 'portrait',
  });

  // Encabezado
  const fecha = new Date().toLocaleString();
  const pageWidth  = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFontSize(14);
  doc.text(title || 'Reporte', margins.left, 16);
  doc.setFontSize(10);
  doc.text(`Generado: ${fecha}`, margins.left, 22);

  // Línea separadora
  doc.line(margins.left, 24, pageWidth - margins.right, 24);

  // Cabecera y cuerpo de la tabla
  const head = [columns.map(c => c.header)];
  const body = rows.map(row =>
    columns.map(col => {
      const v = getValue(row, col.field);
      return col.formatter ? col.formatter(v, row) : (v ?? '—');
    })
  );

  // Calcular ancho total de la tabla
  const tableWidth = pageWidth - margins.left - margins.right;

  // Estilos por columna: repartir según widthPercents o automáticamente
  const columnStyles = {};
  if (Array.isArray(widthPercents) && widthPercents.length === columns.length) {
    columns.forEach((col, i) => {
      columnStyles[i] = {
        cellWidth: tableWidth * widthPercents[i],
        halign: col.align || 'left',
      };
    });
  } else {
    const autoWidth = tableWidth / columns.length;
    columns.forEach((col, i) => {
      columnStyles[i] = { cellWidth: autoWidth, halign: col.align || 'left' };
    });
  }
autoTable(doc, {
  startY: margins.top,
  head,
  body,
  columnStyles,
  styles: { fontSize, cellPadding: 2 },
  didParseCell: function (data) {
    // Solo afecta a la fila de encabezado
    if (data.section === 'head') {
      // Ejemplo: centra todas las celdas de la cabecera
      data.cell.styles.halign = 'center';
      // O centra solo la 2ª columna: if (data.column.index === 1) { … }
    }
  },
});
  doc.save(fileName);
}

// Función para acceder a campos anidados (por ejemplo "ubicacion_actual.nombre")
function getValue(obj, path) {
  const parts = Array.isArray(path) ? path : String(path).split('.');
  let current = obj;
  for (const part of parts) {
    if (current == null) return undefined;
    current = current[part];
  }
  return current;
}
