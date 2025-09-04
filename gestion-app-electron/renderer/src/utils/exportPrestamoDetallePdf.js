// src/utils/exportPrestamoDetallePdf.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Genera un PDF A4 (vertical) con el detalle de un préstamo.
 * @param {Object} opts
 * @param {Object} opts.meta      - { id, nombre, fecha, autorizado, locacion, estado }
 * @param {Array}  opts.items     - [{ nombre, cantidad, cantidad_devuelta, tipo_bien }]
 * @param {String} [opts.fileName]
 */
export function exportPrestamoDetalleToPDF({
  meta = {},
  items = [],
  fileName = "detalle_prestamo.pdf",
}) {
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
  const margin = 36;
  let y = margin;

  // Título
  doc.setFont("helvetica", "bold").setFontSize(14);
  doc.text("Detalle de Préstamo", margin, y);
  y += 20;

  // Meta
  doc.setFont("helvetica", "normal").setFontSize(10);
  const filasMeta = [
    [`Código / ID:`, meta?.id ?? "-"],
    [`Razón:`, meta?.nombre ?? "-"],
    [`Fecha:`, meta?.fecha ?? "-"],
    [`Personal encargado:`, meta?.autorizado ?? "-"],
    [`Locación:`, meta?.locacion ?? "-"],
    [`Estado:`, meta?.estado ?? "-"],
  ];
  filasMeta.forEach(([k, v]) => {
    doc.text(`${k} ${v}`, margin, y);
    y += 14;
  });
  y += 6;

  // Tabla principal
  const head = ["Artículo", "Entregado", "Devuelto", "Restante", "Tipo"];
  const body = (items || []).map((it) => {
    const entregado = Number(it.cantidad ?? 0);
    const devuelto = Number(it.cantidad_devuelta ?? 0);
    const restante = Math.max(entregado - devuelto, 0);
    return [
      it.nombre ?? "-",
      entregado,
      devuelto,
      restante,
      it.tipo_bien ?? "-",
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [head],
    body,
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [53, 126, 221], textColor: 255, halign: "center" },
    columnStyles: {
      0: { halign: "left" },
      1: { halign: "center" },
      2: { halign: "center" },
      3: { halign: "center" },
      4: { halign: "center" },
    },
    didDrawPage: (data) => {
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      doc.setFontSize(9).setTextColor(100);
      doc.text(
        `Página ${doc.internal.getNumberOfPages()}`,
        pageW - margin,
        pageH - 14,
        { align: "right" }
      );
    },
  });

  // Totales (opcional)
  const totalEntregado = body.reduce((acc, r) => acc + Number(r[1] || 0), 0);
  const totalDevuelto  = body.reduce((acc, r) => acc + Number(r[2] || 0), 0);
  const totalRestante  = body.reduce((acc, r) => acc + Number(r[3] || 0), 0);

  let afterY = doc.lastAutoTable?.finalY || y;
  afterY += 16;
  doc.setFont("helvetica", "bold").setFontSize(10);
  doc.text("Totales", margin, afterY);
  afterY += 12;
  doc.setFont("helvetica", "normal");
  doc.text(`• Entregado: ${totalEntregado}`, margin, afterY);  afterY += 12;
  doc.text(`• Devuelto: ${totalDevuelto}`,  margin, afterY);  afterY += 12;
  doc.text(`• Restante: ${totalRestante}`,  margin, afterY);

  // Guardar
  doc.save(fileName);
}
