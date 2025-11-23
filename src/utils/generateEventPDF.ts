import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface EventData {
  meeting_name: string;
  meeting_date: string;
  anciao?: string;
  regencia_enc_regional_1?: string;
  regencia_enc_regional_2?: string;
  examinadora?: string;
  ancioes_presentes?: string;
  palavra?: string;
  demais_irmaos?: string;
  observacao?: string;
}

interface AttendanceData {
  musician: {
    name: string;
    instrument: string;
    cargo_ministerio?: string;
  };
}

// Instrument groupings
const INSTRUMENT_GROUPS = {
  'Cordas': ['Violino', 'Viola', 'Violoncelo'],
  'Madeiras': [
    'Flauta', 'Oboé', "Oboé D'Amore", 'Corne Inglês', 
    'Clarinete', 'Clarinete Alto', 'Clarinete Baixo', 'Fagote',
    'Saxofone Soprano', 'Saxofone Alto', 'Saxofone Tenor', 'Saxofone Baritono'
  ],
  'Metais': [
    'Trompete', 'Cornet', 'Flugelhom', 'Trompa',
    'Trombone', 'Trombonito', 'Barítono', 'Eufônio', 'Tuba'
  ]
};

export const generateEventPDF = (eventData: EventData, attendances: AttendanceData[]) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('CONGREGAÇÃO CRISTÃ NO BRASIL', 105, 20, { align: 'center' });
  
  doc.setFontSize(14);
  doc.text('ENSAIO REGIONAL', 105, 30, { align: 'center' });
  
  // Event info
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  let yPos = 45;
  
  if (eventData.meeting_name) {
    doc.text(`Evento: ${eventData.meeting_name}`, 20, yPos);
    yPos += 7;
  }
  
  doc.text(`Data: ${new Date(eventData.meeting_date).toLocaleDateString('pt-BR')}`, 20, yPos);
  yPos += 7;
  
  if (eventData.anciao) {
    doc.text(`Ancião: ${eventData.anciao}`, 20, yPos);
    yPos += 7;
  }
  
  if (eventData.regencia_enc_regional_1) {
    doc.text(`Regência Enc. Regional 1: ${eventData.regencia_enc_regional_1}`, 20, yPos);
    yPos += 7;
  }
  
  if (eventData.regencia_enc_regional_2) {
    doc.text(`Regência Enc. Regional 2: ${eventData.regencia_enc_regional_2}`, 20, yPos);
    yPos += 7;
  }
  
  if (eventData.examinadora) {
    doc.text(`Examinadora: ${eventData.examinadora}`, 20, yPos);
    yPos += 7;
  }
  
  if (eventData.ancioes_presentes) {
    doc.text(`Anciães: ${eventData.ancioes_presentes}`, 20, yPos);
    yPos += 7;
  }
  
  if (eventData.palavra) {
    doc.text(`Palavra: ${eventData.palavra}`, 20, yPos);
    yPos += 7;
  }
  
  if (eventData.demais_irmaos) {
    doc.setFontSize(9);
    const splitText = doc.splitTextToSize(`Demais Irmãos: ${eventData.demais_irmaos}`, 170);
    doc.text(splitText, 20, yPos);
    yPos += 7 * splitText.length;
    doc.setFontSize(11);
  }
  
  yPos += 5;
  
  // Count instruments by groups
  const instrumentCounts: Record<string, Record<string, number>> = {};
  const ministryCounts: Record<string, number> = {};
  
  attendances.forEach((att) => {
    const instrument = att.musician.instrument;
    const ministry = att.musician.cargo_ministerio || 'Não especificado';
    
    // Count by instrument groups
    for (const [group, instruments] of Object.entries(INSTRUMENT_GROUPS)) {
      if (instruments.some(i => instrument.includes(i) || i.includes(instrument))) {
        if (!instrumentCounts[group]) {
          instrumentCounts[group] = {};
        }
        instrumentCounts[group][instrument] = (instrumentCounts[group][instrument] || 0) + 1;
        break;
      }
    }
    
    // Count by ministry
    ministryCounts[ministry] = (ministryCounts[ministry] || 0) + 1;
  });
  
  // Calculate totals and percentages
  const groupTotals: Record<string, number> = {};
  const grandTotal = attendances.length;
  
  Object.entries(instrumentCounts).forEach(([group, instruments]) => {
    groupTotals[group] = Object.values(instruments).reduce((sum, count) => sum + count, 0);
  });
  
  // Create instruments table
  const tableData: any[] = [];
  
  Object.entries(INSTRUMENT_GROUPS).forEach(([group, instruments]) => {
    const groupCount = groupTotals[group] || 0;
    const groupPercentage = grandTotal > 0 ? Math.round((groupCount / grandTotal) * 100) : 0;
    
    instruments.forEach((instrument, idx) => {
      const count = instrumentCounts[group]?.[instrument] || 0;
      
      if (idx === 0) {
        tableData.push([
          group,
          instrument,
          count,
          groupCount,
          `${groupPercentage}%`
        ]);
      } else {
        tableData.push([
          '',
          instrument,
          count,
          '',
          ''
        ]);
      }
    });
  });
  
  // Instruments table
  autoTable(doc, {
    startY: yPos,
    head: [['Naipes', 'Instrumentos', 'Qtde', 'Total', '%']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 70 },
      2: { cellWidth: 20 },
      3: { cellWidth: 20 },
      4: { cellWidth: 20 }
    }
  });
  
  // Ministry table
  const ministryData = Object.entries(ministryCounts).map(([ministry, count]) => [ministry, count]);
  
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 10,
    head: [['Ministério', 'Qtde']],
    body: ministryData,
    theme: 'grid',
    headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 30 }
    }
  });
  
  // Total musicians
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Geral de Músicos: ${grandTotal}`, 20, finalY);
  
  // Observation
  if (eventData.observacao) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const obsText = doc.splitTextToSize(`Observação: ${eventData.observacao}`, 170);
    doc.text(obsText, 20, finalY + 10);
  }
  
  // Save PDF
  const fileName = `Relatorio_${eventData.meeting_name.replace(/[^a-z0-9]/gi, '_')}_${eventData.meeting_date}.pdf`;
  doc.save(fileName);
};
