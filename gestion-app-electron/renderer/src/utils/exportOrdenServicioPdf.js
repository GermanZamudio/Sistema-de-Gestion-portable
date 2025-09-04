// src/utils/exportOrdenServicioPdf.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Exporta a PDF una Orden de Servicio (A4, vertical).
 *
 * @param {Object} opts
 * @param {Object} opts.orden       - { id, nombre, fecha, descripcion, responsable, estado }
 * @param {Object} opts.edificio    - { nombre_edificio, numero, piso }
 * @param {Array}  opts.articulos   - [{ tipo_bien, nombre, cantidad_asignada, cantidad_entregada, estado }, ...]
 * @param {Array}  opts.identificados - [{ nombre_articulo, codigo, estado }, ...]
 * @param {Array}  opts.sobrantes   - [{ nombre, cantidad }, ...]
 * @param {String} [opts.fileName]  - nombre del archivo
 */
export function exportOrdenServicioToPDF({
  orden = {},
  edificio = {},
  articulos = [],
  identificados = [],
  sobrantes = [],
  fileName = "orden_servicio.pdf",
}) {
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 36; // 0.5 inch
  let y = margin;

  // ====== Encabezado ======
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Orden de Servicio", margin, y);
  y += 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const linea1 = `Nombre: ${orden?.nombre ?? "-"}`;
  const linea2 = `Fecha: ${orden?.fecha ?? "-"}   |   Estado: ${orden?.estado ?? "-"}`;
  const linea3 = `Responsable: ${orden?.responsable ?? "-"}`;

  doc.text(linea1, margin, y); y += 14;
  doc.text(linea2, margin, y); y += 14;
  doc.text(linea3, margin, y); y += 6;

  // Descripción (multilínea)
  if (orden?.descripcion) {
    const desc = doc.splitTextToSize(`Descripción: ${orden.descripcion}`, pageWidth - margin * 2);
    doc.text(desc, margin, y);
    y += desc.length * 12;
  }
  y += 8;

  // ====== Datos de Departamento / Edificio ======
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Departamento", margin, y); y += 12;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const dep1 = `Edificio: ${edificio?.nombre_edificio ?? "-"}`;
  const dep2 = `Piso: ${edificio?.piso ?? "-"}   |   Número: ${edificio?.numero ?? "-"}`;
  doc.text(dep1, margin, y); y += 14;
  doc.text(dep2, margin, y); y += 10;

  // Utilidad para sección-tabla
  const renderTable = (titulo, head, bodyRows) => {
    if (!bodyRows || bodyRows.length === 0) return;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(titulo, margin, y); 
    y += 8;

    autoTable(doc, {
      startY: y,
      head: [head],
      body: bodyRows,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 9,
        cellPadding: 6,
        overflow: "linebreak",
        valign: "middle",
      },
      headStyles: {
        fillColor: [53, 126, 221],
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
      },
      columnStyles: head.reduce((acc, col, i) => {
        acc[i] = { halign: "center" };
        return acc;
      }, {}),
      didDrawPage: (data) => {
        // Footer paginado
        const str = `Página ${doc.internal.getNumberOfPages()}`;
        doc.setFontSize(9);
        doc.setTextColor(120);
        doc.text(str, pageWidth - margin, doc.internal.pageSize.getHeight() - 10, { align: "right" });
      },
    });
    y = doc.lastAutoTable.finalY + 16;
  };

  // ====== Tablas: Stock / Uso / Consumo ======
  const byTipo = (tipo) => articulos.filter(a => a.tipo_bien === tipo);
  const mapArt = (arr) =>
    arr.map(a => [
      a.nombre ?? "-",
      String(a.cantidad_asignada ?? 0),
      String(a.cantidad_entregada ?? 0),
      a.estado ?? "-",
    ]);

  renderTable("Artículos de Stock", ["Artículo", "Asignado", "Entregado", "Estado"], mapArt(byTipo("STOCK")));
  renderTable("Bienes de Uso", ["Artículo", "Asignado", "Entregado", "Estado"], mapArt(byTipo("USO")));
  renderTable("Bienes de Consumo", ["Artículo", "Asignado", "Entregado", "Estado"], mapArt(byTipo("CONSUMO")));

  // ====== Identificados ======
  const identRows = (identificados || []).map(i => [
    i.nombre_articulo ?? "-",
    i.codigo ?? "-",
    i.estado ?? "-",
  ]);
  renderTable("Artículos Identificados", ["Artículo", "Código", "Estado"], identRows);

  // ====== Sobrantes ======
  const sobrRows = (sobrantes || []).map(s => [s.nombre ?? "-", String(s.cantidad ?? 0)]);
  renderTable("Sobrantes Utilizados", ["Nombre", "Cantidad"], sobrRows);

  // ====== Guardar ======
  doc.save(fileName);
}
