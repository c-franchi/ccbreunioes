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
  hinos_cantados?: string;
  hinos_ensaiados?: string;
  quantidade_organistas?: number;
  cidade?: string;
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
    'Flauta', 'Oboé', "Oboé D'Amore", 'Corne Inglês', 'Clarinete', 
    'Clarinete Alto', 'Clarinete Baixo', 'Fagote', 'Saxofone Soprano', 
    'Saxofone Alto', 'Saxofone Tenor', 'Saxofone Baritono'
  ],
  'Metais': [
    'Trompete', 'Cornet', 'Flugelhom', 'Trompa', 'Trombone', 
    'Trombonito', 'Barítono', 'Eufônio', 'Tuba'
  ]
};

export const generateEventPDF = (eventData: EventData, attendances: AttendanceData[]) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header - CONGREGAÇÃO CRISTÃ NO BRASIL
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('CONGREGAÇÃO CRISTÃ NO BRASIL', pageWidth / 2, 10, { align: 'center' });
  
  // Top section table with meeting type, city and date (only meeting info, not date)
  const meetingType = eventData.meeting_name || '';
  const city = eventData.cidade || '';
  const displayLocation = `${meetingType}${meetingType && city ? ' - ' : ''}${city}`;
  
  autoTable(doc, {
    startY: 14,
    head: [],
    body: [[
      { content: displayLocation, styles: { halign: 'center', fontStyle: 'bold' as const } },
      { content: `Data:\n${new Date(eventData.meeting_date).toLocaleDateString('pt-BR')}`, styles: { halign: 'center', fontStyle: 'bold' as const } }
    ]],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 1, lineWidth: 0.3 },
    columnStyles: {
      0: { cellWidth: 150 },
      1: { cellWidth: 30 }
    },
    tableWidth: 180
  });
  
  // Attendance section
  let currentY = (doc as any).lastAutoTable.finalY;
  
  const buildAttendanceSection = () => {
    const rows: any[][] = [];
    
    // Row 1: Ancião
    rows.push([
      { content: 'Atendimento:', rowSpan: 4, styles: { valign: 'middle' as const, fontStyle: 'bold' as const, halign: 'center' as const } },
      { content: 'Ancião:' },
      { content: eventData.anciao || '', colSpan: 2 },
      { content: '', rowSpan: 4, styles: { valign: 'middle' as const, halign: 'center' as const, fillColor: [255, 255, 255], lineWidth: 0 } }
    ]);
    
    // Row 2: Regência Enc. Regional 1
    rows.push([
      { content: 'Regência Enc. Regional 1:' },
      { content: eventData.regencia_enc_regional_1 || '', colSpan: 2 }
    ]);
    
    // Row 3: Regência Enc. Regional 2
    rows.push([
      { content: 'Regência Enc. Regional 2:' },
      { content: eventData.regencia_enc_regional_2 || '', colSpan: 2 }
    ]);
    
    // Row 4: Examinadora
    rows.push([
      { content: 'Examinadora:' },
      { content: eventData.examinadora || '', colSpan: 2 }
    ]);
    
    // Row 5: Anciães
    if (eventData.ancioes_presentes) {
      rows.push([
        { content: '', styles: { fillColor: [255, 255, 255], lineWidth: 0 } },
        { content: 'Anciães:' },
        { content: eventData.ancioes_presentes, colSpan: 2 },
        { content: '', styles: { fillColor: [255, 255, 255], lineWidth: 0 } }
      ]);
    }
    
    return rows;
  };
  
  autoTable(doc, {
    startY: currentY,
    body: buildAttendanceSection(),
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1, lineWidth: 0.3 },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 45 },
      2: { cellWidth: 70 },
      3: { cellWidth: 5 },
      4: { cellWidth: 30 }
    },
    tableWidth: 180
  });
  
  currentY = (doc as any).lastAutoTable.finalY;
  
  // Demais Irmãos Presentes section
  if (eventData.demais_irmaos) {
    const demaisIrmaosLines = doc.splitTextToSize(eventData.demais_irmaos, 140);
    const demaisContent = [
      [
        { content: 'Demais Irmãos Presentes:', styles: { fontStyle: 'bold' as const } },
        { content: demaisIrmaosLines.join('\n') },
        { content: eventData.palavra ? `Palavra:\n${eventData.palavra}` : '' }
      ]
    ];
    
    autoTable(doc, {
      startY: currentY,
      body: demaisContent,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 1, lineWidth: 0.3 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 85 },
        2: { cellWidth: 55 }
      },
      tableWidth: 180
    });
    
    currentY = (doc as any).lastAutoTable.finalY;
  }
  
  // Count instruments by groups
  const instrumentCounts: Record<string, Record<string, number>> = {};
  const ministryCounts: Record<string, number> = {};
  
  attendances.forEach((att) => {
    const instrument = att.musician.instrument;
    const ministry = att.musician.cargo_ministerio || 'Não especificado';
    
    for (const [group, instruments] of Object.entries(INSTRUMENT_GROUPS)) {
      // More precise matching - check if the instrument matches exactly or starts with the instrument name
      const matchedInstrument = instruments.find(i => 
        instrument === i || 
        instrument.startsWith(i) || 
        i.startsWith(instrument)
      );
      
      if (matchedInstrument) {
        if (!instrumentCounts[group]) {
          instrumentCounts[group] = {};
        }
        instrumentCounts[group][instrument] = (instrumentCounts[group][instrument] || 0) + 1;
        break;
      }
    }
    
    ministryCounts[ministry] = (ministryCounts[ministry] || 0) + 1;
  });
  
  // Calculate totals
  const groupTotals: Record<string, number> = {};
  const grandTotal = attendances.length;
  
  Object.entries(instrumentCounts).forEach(([group, instruments]) => {
    groupTotals[group] = Object.values(instruments).reduce((sum, count) => sum + count, 0);
  });
  
  // Main instruments table - with individual counts
  const instrumentRows: any[][] = [];
  
  Object.entries(INSTRUMENT_GROUPS).forEach(([group, instruments]) => {
    const groupCount = groupTotals[group] || 0;
    const groupPercentage = grandTotal > 0 ? Math.round((groupCount / grandTotal) * 100) : 0;
    
    // Get all instruments with their counts
    const allInstruments = instruments.map(instrument => {
      const count = instrumentCounts[group]?.[instrument] || 0;
      return { name: instrument, count };
    });
    
    allInstruments.forEach(({ name: instrument, count }, index) => {
      if (index === 0) {
        // First row of the group with rowSpan
        instrumentRows.push([
          { content: group, rowSpan: allInstruments.length, styles: { valign: 'middle' as const, fontStyle: 'bold' as const, halign: 'center' as const } },
          { content: instrument, styles: { halign: 'left' as const } },
          { content: count, styles: { halign: 'center' as const, fontStyle: 'bold' as const } },
          { content: groupCount, rowSpan: allInstruments.length, styles: { valign: 'middle' as const, fontStyle: 'bold' as const, halign: 'center' as const } },
          { content: `${groupPercentage}%`, rowSpan: allInstruments.length, styles: { valign: 'middle' as const, fontStyle: 'bold' as const, halign: 'center' as const } }
        ]);
      } else {
        // Subsequent rows without group, total, and percentage columns
        instrumentRows.push([
          '',
          { content: instrument, styles: { halign: 'left' as const } },
          { content: count, styles: { halign: 'center' as const, fontStyle: 'bold' as const } },
          '',
          ''
        ]);
      }
    });
  });
  
  // Build ministry column
  const ministryRows = Object.entries(ministryCounts)
    .sort(([a], [b]) => {
      const order = ['Anciães', 'Cooperadores', 'Coop. Jovens', 'Enc. Regionais', 'Enc. Locais', 'Examinadora', 'Administração'];
      const aIndex = order.findIndex(o => a.includes(o));
      const bIndex = order.findIndex(o => b.includes(o));
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    })
    .map(([ministry, count]) => [ministry, count]);
  
  // Combined table with instruments and ministry
  const maxRows = Math.max(instrumentRows.length, ministryRows.length);
  const combinedRows: any[][] = [];
  
  for (let i = 0; i < maxRows; i++) {
    const row: any[] = [];
    
    if (i < instrumentRows.length) {
      row.push(...instrumentRows[i]);
    } else {
      row.push('', '', '', '', '');
    }
    
    if (i === 0) {
      row.push({ content: 'Ministério\nPresente', styles: { halign: 'center' as const, fontStyle: 'bold' as const } });
      row.push({ content: 'Qtde', styles: { halign: 'center' as const, fontStyle: 'bold' as const } });
    } else if (i <= ministryRows.length) {
      const ministryRow = ministryRows[i - 1];
      row.push(ministryRow[0]);
      row.push(ministryRow[1]);
    } else {
      row.push('', '');
    }
    
    combinedRows.push(row);
  }
  
  // Add Total Geral row
  combinedRows.push([
    { content: '', styles: { fillColor: [255, 255, 255], lineWidth: { top: 0, right: 0, bottom: 0, left: 0 } } },
    { content: '', styles: { fillColor: [255, 255, 255], lineWidth: { top: 0, right: 0, bottom: 0, left: 0 } } },
    { content: '', styles: { fillColor: [255, 255, 255], lineWidth: { top: 0, right: 0, bottom: 0, left: 0 } } },
    { content: '', styles: { fillColor: [255, 255, 255], lineWidth: { top: 0, right: 0, bottom: 0, left: 0 } } },
    { content: '', styles: { fillColor: [255, 255, 255], lineWidth: { top: 0, right: 0, bottom: 0, left: 0 } } },
    { content: 'Total Geral', styles: { fontStyle: 'bold' as const, halign: 'right' as const } },
    { content: grandTotal, styles: { fontStyle: 'bold' as const, halign: 'center' as const } }
  ]);
  
  // Add Observação row if needed
  if (eventData.observacao) {
    combinedRows.push([
      { content: '', styles: { fillColor: [255, 255, 255], lineWidth: { top: 0, right: 0, bottom: 0, left: 0 } } },
      { content: '', styles: { fillColor: [255, 255, 255], lineWidth: { top: 0, right: 0, bottom: 0, left: 0 } } },
      { content: '', styles: { fillColor: [255, 255, 255], lineWidth: { top: 0, right: 0, bottom: 0, left: 0 } } },
      { content: '', styles: { fillColor: [255, 255, 255], lineWidth: { top: 0, right: 0, bottom: 0, left: 0 } } },
      { content: '', styles: { fillColor: [255, 255, 255], lineWidth: { top: 0, right: 0, bottom: 0, left: 0 } } },
      { content: `Observação:\n${eventData.observacao}`, colSpan: 2 }
    ]);
  }
  
  autoTable(doc, {
    startY: currentY + 2,
    head: [['Naipes', 'Instrumentos', 'Qtde\nInstrumentos', 'Qtde\nNaipes', '%', 'Ministério\nPresente', 'Qtde']],
    body: combinedRows,
    theme: 'grid',
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' as const, lineWidth: 0.3, halign: 'center' as const, fontSize: 6 },
    styles: { fontSize: 6, cellPadding: 0.5, lineWidth: 0.3 },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' as const },
      1: { cellWidth: 35 },
      2: { cellWidth: 15, halign: 'center' as const },
      3: { cellWidth: 15, halign: 'center' as const },
      4: { cellWidth: 10, halign: 'center' as const },
      5: { cellWidth: 50 },
      6: { cellWidth: 15, halign: 'center' as const }
    },
    tableWidth: 180
  });
  
  currentY = (doc as any).lastAutoTable.finalY + 2;
  
  // Bottom section with totals and hymns
  const bottomRows: any[][] = [];
  
  // Row 1: Total Geral de Instrumentos / Hinos section
  const hinosCantados = eventData.hinos_cantados || '';
  const hinosEnsaiados = eventData.hinos_ensaiados || '';
  
  // Count hymns for proper singular/plural
  const countHinos = (hinosStr: string) => {
    if (!hinosStr) return 0;
    return hinosStr.split(',').map(h => h.trim()).filter(h => h).length;
  };
  
  const cantadosCount = countHinos(hinosCantados);
  const ensaiadosCount = countHinos(hinosEnsaiados);
  
  const cantadosLabel = cantadosCount === 1 ? 'Cantado' : 'Cantados';
  const ensaiadosLabel = ensaiadosCount === 1 ? 'Ensaiado' : 'Ensaiados';
  
  bottomRows.push([
    { content: 'Total Geral de Instrumentos', styles: { fontStyle: 'bold' as const } },
    { content: grandTotal, styles: { fontStyle: 'bold' as const, halign: 'center' as const } },
    { content: '', styles: { fillColor: [255, 255, 255], lineWidth: 0 } },
    { content: 'Hinos:', rowSpan: 3, styles: { valign: 'middle' as const, fontStyle: 'bold' as const } }
  ]);
  
  // Row 2: Total de Organistas / Cantado
  bottomRows.push([
    { content: 'Total de Organistas', styles: { fontStyle: 'bold' as const } },
    { content: eventData.quantidade_organistas || 0, styles: { fontStyle: 'bold' as const, halign: 'center' as const } },
    { content: '', styles: { fillColor: [255, 255, 255], lineWidth: 0 } },
    { content: hinosCantados ? `${cantadosLabel}: ${hinosCantados}` : '' }
  ]);
  
  // Row 3: Total Geral do Ensaio / Ensaiados
  bottomRows.push([
    { content: 'Total Geral do Ensaio', styles: { fontStyle: 'bold' as const } },
    { content: grandTotal + (eventData.quantidade_organistas || 0), styles: { fontStyle: 'bold' as const, halign: 'center' as const } },
    { content: '', styles: { fillColor: [255, 255, 255], lineWidth: 0 } },
    { content: hinosEnsaiados ? `${ensaiadosLabel}: ${hinosEnsaiados}` : '' }
  ]);
  
  // Calculate total hymns
  const totalHinos = [hinosCantados, hinosEnsaiados]
    .filter(h => h)
    .join(', ')
    .split(',')
    .map(h => h.trim())
    .filter(h => h && !isNaN(Number(h)))
    .length;
  
  // Row 4: Empty / Total de Hinos
  bottomRows.push([
    { content: '', styles: { fillColor: [255, 255, 255], lineWidth: 0 } },
    { content: '', styles: { fillColor: [255, 255, 255], lineWidth: 0 } },
    { content: '', styles: { fillColor: [255, 255, 255], lineWidth: 0 } },
    { content: `Total de Hinos: ${totalHinos}`, styles: { fontStyle: 'bold' as const } }
  ]);
  
  autoTable(doc, {
    startY: currentY,
    body: bottomRows,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 1.5, lineWidth: 0.3 },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 20, halign: 'center' as const },
      2: { cellWidth: 20 },
      3: { cellWidth: 90 }
    },
    tableWidth: 180
  });
  
  // Save PDF
  const fileName = `Relatorio_${eventData.meeting_name.replace(/[^a-z0-9]/gi, '_')}_${eventData.meeting_date}.pdf`;
  doc.save(fileName);
};
