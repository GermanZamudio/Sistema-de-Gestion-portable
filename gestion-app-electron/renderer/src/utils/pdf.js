// src/utils/pdf.js
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable"; // <-- IMPORTAR LA FUNCIÓN

export async function generatePDF({
  title,
  subtitle,
  head,
  rows,
  footer,
  filename = "reporte.pdf",
  orientation = "p",
}) {
  const marginX = 40;
  const startY = 110;

  const doc = new jsPDF({ unit: "pt", format: "a4", orientation });

  // Encabezado
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(String(title || "Reporte"), marginX, 50);

  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(String(subtitle), marginX, 70);
  }

  doc.setFontSize(10);
  doc.text(`Fecha: ${new Date().toLocaleDateString("es-AR")}`, marginX, 88);

  // Tabla (usar la función importada)
  autoTable(doc, {
    startY,
    head: Array.isArray(head?.[0]) ? head : [head],
    body: rows || [],
    margin: { left: marginX, right: marginX },
    styles: {
      font: "helvetica",
      fontSize: 10,
      cellPadding: 6,
      valign: "middle",
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [230, 230, 230],
      textColor: 20,
      fontStyle: "bold",
    },
    bodyStyles: {
      textColor: 30,
    },
    didDrawPage: () => {
      if (typeof footer === "function") {
        const page = doc.getNumberOfPages();
        const total = doc.getNumberOfPages();
        doc.setFontSize(9);
        doc.text(
          footer(page, total),
          doc.internal.pageSize.getWidth() - marginX,
          doc.internal.pageSize.getHeight() - 20,
          { align: "right" }
        );
      }
    },
  });

  doc.save(filename);
}
