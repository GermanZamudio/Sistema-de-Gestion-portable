// src/utils/exportOrdenCompraPdf.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Exporta una Orden de Compra a PDF (A4, portrait).
 *
 * @param {Object} opts
 * @param {Object} opts.orden - { id, codigo_ref, fecha, proveedor, articulos: [{ id, id_articulo, nombre, cantidad_pedida, cantidad_recibida }] }
 * @param {String} [opts.fileName] - Nombre del archivo
 * @param {String} [opts.logoDataUrl] - (opcional) DataURL PNG/JPG para logo en el header
 */
export function exportOrdenCompraToPDF({
  orden = {},
  fileName = `orden_compra_${orden?.id ?? "detalle"}.pdf`,
  logoDataUrl = null,
}) {
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 36;

  // Header con logo (opcional)
  let y = margin;
  if (logoDataUrl) {
    try {
      // ancho máximo 120, alto proporcional
      doc.addImage(logoDataUrl, "PNG", margin, y, 120, 40, undefined, "FAST");
      y += 52;
    } catch {
      // si falla, sigue sin logo
    }
  }

  // Título
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Orden de Compra", margin, y);
  y += 18;

  // Datos principales
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const prov = orden?.proveedor || {};
  doc.text(`ID: ${orden?.id ?? "-"}`, margin, y); y += 14;
  doc.text(`Código de referencia: ${orden?.codigo_ref ?? "-"}`, margin, y); y += 14;
  doc.text(`Fecha: ${orden?.fecha ?? "-"}`, margin, y); y += 14;
  doc.text(`Proveedor: ${prov?.razon_social ?? "-"}`, margin, y); y += 18;

  // Artículos
  const head = [
    "Nombre",
    "Cant. Pedida",
    "Cant. Recibida",
    "Pendiente",
  ];

  const body = (orden?.articulos ?? []).map(a => {
    const pedida = Number(a.cantidad_pedida ?? 0);
    const recibida = Number(a.cantidad_recibida ?? 0);
    const pendiente = Math.max(pedida - recibida, 0);
    return [
      a.nombre ?? "-",
      pedida,
      recibida,
      pendiente,
    ];
  });

  // Totales
  const totalPedida = body.reduce((acc, r) => acc + Number(r[1] || 0), 0);
  const totalRecibida = body.reduce((acc, r) => acc + Number(r[2] || 0), 0);
  const totalPendiente = body.reduce((acc, r) => acc + Number(r[3] || 0), 0);

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [head],
    body,
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [53, 126, 221], textColor: 255, halign: "center" },
    columnStyles: {
      0: { halign: "left" },
      1: { halign: "center" },
      2: { halign: "center" },
      3: { halign: "center" },
    },
    // Pie de página con número de página
    didDrawPage: () => {
      const pageNumber = doc.internal.getNumberOfPages();
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(
        `Página ${pageNumber}`,
        pageW - margin,
        pageH - 10,
        { align: "right" }
      );
    },
  });

  // Fila de totales (debajo de la tabla)
  const afterY = doc.lastAutoTable?.finalY ?? y;
  const totY = (afterY + 16 > pageH - margin) ? margin : afterY + 16;
  if (totY === margin) {
    doc.addPage();
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Totales", margin, (totY === margin ? margin : totY));
  const totBaseY = (totY === margin ? margin : totY) + 12;

  // Dibujo de totales en columnas simples
  doc.setFont("helvetica", "normal");
  doc.text(`Total Pedida: ${totalPedida}`, margin, totBaseY);
  doc.text(`Total Recibida: ${totalRecibida}`, margin + 160, totBaseY);
  doc.text(`Total Pendiente: ${totalPendiente}`, margin + 320, totBaseY);

  // Guardar
  doc.save(fileName);
}
