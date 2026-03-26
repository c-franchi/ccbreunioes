import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const generateAbsenceReportPDF = (event: any, justifications: any[]) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = 20;

  // Title
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("RELATÓRIO DE JUSTIFICATIVAS DE AUSÊNCIA", pageWidth / 2, y, { align: "center" });
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Reunião Bimestral de Encarregados - Microrregião Araraquara", pageWidth / 2, y, { align: "center" });
  y += 6;

  const meetingDate = format(new Date(event.meeting_date + "T12:00:00"), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  doc.text(`Data: ${meetingDate} às ${event.meeting_time?.slice(0, 5) || "15:00"}`, pageWidth / 2, y, { align: "center" });
  y += 6;

  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, pageWidth / 2, y, { align: "center" });
  y += 10;

  // Line separator
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Group by cargo
  const byMotivo: Record<string, any[]> = {};
  justifications.forEach((j) => {
    const motivo = j.motivo || "Outros";
    if (!byMotivo[motivo]) byMotivo[motivo] = [];
    byMotivo[motivo].push(j);
  });

  // Summary
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`Total de Justificativas: ${justifications.length}`, margin, y);
  y += 8;

  // Table header
  const colWidths = [8, 60, 40, 45, 27];
  const headers = ["Nº", "NOME", "CARGO", "LOCALIDADE", "MOTIVO"];

  doc.setFillColor(44, 62, 80);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.rect(margin, y, pageWidth - 2 * margin, 7, "F");

  let x = margin;
  headers.forEach((h, i) => {
    doc.text(h, x + 2, y + 5);
    x += colWidths[i];
  });
  y += 7;

  // Table rows
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);

  justifications.forEach((j, idx) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    const bgColor = idx % 2 === 0 ? 245 : 255;
    doc.setFillColor(bgColor, bgColor, bgColor);
    doc.rect(margin, y, pageWidth - 2 * margin, 6, "F");

    x = margin;
    const row = [
      String(idx + 1),
      j.musicians?.name || "—",
      j.cargo || "—",
      j.localidade || "—",
      j.motivo || "—",
    ];

    row.forEach((cell, i) => {
      const maxWidth = colWidths[i] - 3;
      const truncated = doc.getStringUnitWidth(cell) * 7 / doc.internal.scaleFactor > maxWidth
        ? cell.substring(0, Math.floor(maxWidth * doc.internal.scaleFactor / (7 * doc.getStringUnitWidth("A")))) + "..."
        : cell;
      doc.text(truncated, x + 2, y + 4);
      x += colWidths[i];
    });
    y += 6;
  });

  y += 10;

  // Summary by motivo
  if (y > 250) { doc.addPage(); y = 20; }
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Resumo por Motivo:", margin, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  Object.entries(byMotivo).forEach(([motivo, items]) => {
    doc.text(`${motivo}: ${items.length}`, margin + 5, y);
    y += 5;
  });

  doc.save(`justificativas_${format(new Date(event.meeting_date + "T12:00:00"), "yyyy-MM-dd")}.pdf`);
};
