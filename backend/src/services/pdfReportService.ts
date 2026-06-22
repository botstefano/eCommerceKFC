import PDFDocument from "pdfkit";
import { Response } from "express";

const KFC_RED = "#C8102E";
const KFC_GOLD = "#FFC72C";
const KFC_BLACK = "#1A1A1A";

interface MlReport {
  assumptions: { assumedMonthlyVisits: number; note: string };
  baseline: { ctr: number; conversion: number; aov: number; avgSearchTimeSeconds: number; monthlyRevenue: number };
  withMl: { ctr: number; conversion: number; aov: number; avgSearchTimeSeconds: number; monthlyRevenue: number };
  uplift: { ctrPercent: number; conversionPercent: number; aovPercent: number; revenuePercent: number; searchTimeReductionPercent: number };
}

function pct(n: number) {
  return `${(n * 100).toFixed(2)}%`;
}

export function streamMlVsNoMlPdf(report: MlReport, res: Response) {
  const doc = new PDFDocument({ margin: 50, size: "A4" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=reporte-ml-vs-sin-ml.pdf");

  doc.pipe(res);

  // Header
  doc.rect(0, 0, doc.page.width, 90).fill(KFC_RED);
  doc.fillColor("#FFFFFF").fontSize(22).font("Helvetica-Bold").text("KFC E-commerce", 50, 28);
  doc.fontSize(13).font("Helvetica").text("Reporte de simulación: Motor de Recomendaciones (ML) vs. Catálogo sin personalizar", 50, 56);

  doc.moveDown(4);
  doc.fillColor(KFC_BLACK).fontSize(10).font("Helvetica").text(`Generado: ${new Date().toLocaleString("es-PE")}`, 50, 110);
  doc.fontSize(9).fillColor("#555555").text(report.assumptions.note, 50, 128, { width: 495 });

  let y = 175;

  const drawRow = (label: string, baseline: string, withMl: string, highlight = false) => {
    if (highlight) {
      doc.rect(50, y - 4, 495, 22).fill("#FFF7E0");
    }
    doc.fillColor(KFC_BLACK).font("Helvetica-Bold").fontSize(10).text(label, 55, y, { width: 220 });
    doc.font("Helvetica").text(baseline, 280, y, { width: 110 });
    doc.fillColor(KFC_RED).font("Helvetica-Bold").text(withMl, 400, y, { width: 130 });
    doc.fillColor(KFC_BLACK);
    y += 24;
  };

  doc.font("Helvetica-Bold").fontSize(11);
  doc.text("Métrica", 55, y, { width: 220 });
  doc.text("Sin ML", 280, y, { width: 110 });
  doc.text("Con ML", 400, y, { width: 130 });
  y += 22;
  doc.moveTo(50, y - 4).lineTo(545, y - 4).strokeColor("#CCCCCC").stroke();

  drawRow("CTR (click-through rate)", pct(report.baseline.ctr), pct(report.withMl.ctr));
  drawRow("Tasa de conversión", pct(report.baseline.conversion), pct(report.withMl.conversion));
  drawRow("Ticket promedio (AOV)", `S/ ${report.baseline.aov.toFixed(2)}`, `S/ ${report.withMl.aov.toFixed(2)}`);
  drawRow("Tiempo de búsqueda promedio", `${report.baseline.avgSearchTimeSeconds}s`, `${report.withMl.avgSearchTimeSeconds}s`);
  drawRow(
    "Ingreso mensual estimado",
    `S/ ${report.baseline.monthlyRevenue.toLocaleString("es-PE")}`,
    `S/ ${report.withMl.monthlyRevenue.toLocaleString("es-PE")}`,
    true
  );

  y += 20;
  doc.font("Helvetica-Bold").fontSize(13).fillColor(KFC_RED).text("Resumen de mejora (% uplift)", 50, y);
  y += 22;

  const bars: [string, number][] = [
    ["CTR", report.uplift.ctrPercent],
    ["Conversión", report.uplift.conversionPercent],
    ["AOV", report.uplift.aovPercent],
    ["Ingreso", report.uplift.revenuePercent],
  ];
  const maxBar = Math.max(...bars.map((b) => b[1]), 1);

  bars.forEach(([label, value]) => {
    doc.fillColor(KFC_BLACK).font("Helvetica").fontSize(10).text(label, 50, y, { width: 90 });
    const barWidth = Math.max(4, (value / maxBar) * 300);
    doc.rect(150, y, barWidth, 14).fill(KFC_GOLD);
    doc.fillColor(KFC_BLACK).fontSize(10).text(`+${value.toFixed(1)}%`, 150 + barWidth + 8, y);
    y += 24;
  });

  y += 10;
  doc
    .fillColor("#555555")
    .fontSize(9)
    .text(
      "Nota: el ticket promedio (AOV) se calcula a partir de pedidos reales registrados en la base de datos. " +
        "El CTR, la conversión y los tiempos de búsqueda usan supuestos conservadores documentados en la metodología " +
        "del motor de recomendaciones (filtrado colaborativo, contenido, categoría, boost de selección y de búsqueda).",
      50,
      y,
      { width: 495 }
    );

  doc.end();
}
