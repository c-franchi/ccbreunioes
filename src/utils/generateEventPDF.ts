import jsPDF from 'jspdf';

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

// Instrument groupings - ordem exata da imagem
const INSTRUMENT_GROUPS = {
  'Cordas': ['Violino', 'Violoncelo', 'Flauta', 'Oboé', "Oboé D'Amore", 'Corne Inglês', 'Clarinete', 'Clarinete Alto', 'Clarinete Baixo', 'Fagote'],
  'Madeiras': ['Saxofone Soprano', 'Saxofone Alto', 'Saxofone Tenor', 'Saxofone Baritono', 'Trompete / Cornet', 'Flugelhom'],
  'Metais': ['Trombone / Trombonito', 'Trompa', 'Eufônio', 'Tuba', 'Acordeon', 'Não Incluído no MOD']
};

export const generateEventPDF = (eventData: EventData, attendances: AttendanceData[]) => {
  // Count instruments
  const instrumentCounts: Record<string, Record<string, number>> = {};
  const ministryCounts: Record<string, number> = {};
  
  
  attendances.forEach((att) => {
    const instrument = att.musician.instrument;
    const ministry = att.musician.cargo_ministerio || 'Não especificado';
    
    for (const [group, instruments] of Object.entries(INSTRUMENT_GROUPS)) {
      const matchedInstrument = instruments.find(i => 
        instrument === i || 
        instrument.startsWith(i + ' ') ||
        i.startsWith(instrument + ' ')
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
  
  // Build ministry rows
  const ministryRows = Object.entries(ministryCounts)
    .sort(([a], [b]) => {
      const order = ['Anciães', 'Cooperadores', 'Coop. Jovens', 'Enc. Regionais', 'Enc. Locais', 'Examinadora', 'Administração'];
      const aIndex = order.findIndex(o => a.includes(o));
      const bIndex = order.findIndex(o => b.includes(o));
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  
  // Create HTML
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: Arial, sans-serif;
          font-size: 9px;
          line-height: 1.2;
          padding: 10px;
        }
        .container {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          font-weight: bold;
          font-size: 11px;
          margin-bottom: 5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 3px;
        }
        td, th {
          border: 1px solid #000;
          padding: 2px 4px;
          vertical-align: middle;
        }
        .top-table td {
          font-weight: bold;
          text-align: center;
          font-size: 9px;
        }
        .top-table td:first-child {
          width: 20%;
        }
        .top-table td:nth-child(2) {
          width: 60%;
          background-color: #FFF8DC;
        }
        .top-table td:last-child {
          width: 20%;
        }
        .attendance-table td:first-child {
          font-weight: bold;
          text-align: center;
          width: 15%;
        }
        .attendance-table td:nth-child(2) {
          width: 20%;
        }
        .attendance-table td:nth-child(3) {
          width: 65%;
        }
        .demais-table td:first-child {
          font-weight: bold;
          width: 25%;
        }
        .demais-table td:nth-child(2) {
          width: 50%;
          font-size: 8px;
        }
        .demais-table td:last-child {
          width: 25%;
          font-size: 8px;
        }
        .main-table th {
          background-color: #f0f0f0;
          font-weight: bold;
          text-align: center;
          font-size: 8px;
          padding: 3px 2px;
        }
        .main-table td {
          font-size: 8px;
        }
        .naipe-cell {
          font-weight: bold;
          text-align: center;
          vertical-align: middle;
        }
        .instrument-cell {
          padding-left: 8px;
        }
        .number-cell {
          text-align: center;
          font-weight: bold;
        }
        .ministry-cell {
          padding-left: 8px;
        }
        .total-row {
          background-color: #f0f0f0;
          font-weight: bold;
        }
        .bottom-table td {
          font-size: 9px;
        }
        .bottom-table td:first-child {
          font-weight: bold;
          width: 35%;
        }
        .bottom-table td:nth-child(2) {
          text-align: center;
          font-weight: bold;
          width: 15%;
        }
        .bottom-table td:last-child {
          width: 50%;
        }
        .hinos-section {
          background-color: #E6E6FA;
          padding: 5px;
          font-size: 8px;
        }
        .hinos-title {
          font-weight: bold;
          text-align: center;
          margin-bottom: 3px;
        }
        .observacao-cell {
          font-size: 8px;
          padding: 5px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">CONGREGAÇÃO CRISTÃ NO BRASIL</div>
        
        <table class="top-table">
          <tr>
            <td>${eventData.meeting_name || ''}</td>
            <td>${eventData.cidade || ''}</td>
            <td>Data:<br>${new Date(eventData.meeting_date).toLocaleDateString('pt-BR')}</td>
          </tr>
        </table>
        
        <table class="attendance-table">
          <tr>
            <td rowspan="4">Atendimento:</td>
            <td>Ancião:</td>
            <td>${eventData.anciao || ''}</td>
          </tr>
          <tr>
            <td>Regência Enc. Regional 1:</td>
            <td>${eventData.regencia_enc_regional_1 || ''}</td>
          </tr>
          <tr>
            <td>Regência Enc. Regional 2:</td>
            <td>${eventData.regencia_enc_regional_2 || ''}</td>
          </tr>
          <tr>
            <td>Examinadora:</td>
            <td>${eventData.examinadora || ''}</td>
          </tr>
          ${eventData.ancioes_presentes ? `
          <tr>
            <td></td>
            <td>Anciães:</td>
            <td>${eventData.ancioes_presentes}</td>
          </tr>
          ` : ''}
        </table>
        
        <table class="demais-table">
          <tr>
            <td>Demais Irmãos Presentes:</td>
            <td>${eventData.demais_irmaos || ''}</td>
            <td>Palavra:<br>${eventData.palavra || ''}</td>
          </tr>
        </table>
        
        <table class="main-table">
          <thead>
            <tr>
              <th style="width: 10%;">Naipes</th>
              <th style="width: 22%;">Instrumentos</th>
              <th style="width: 10%;">Qtde<br>Instrumentos</th>
              <th style="width: 10%;">Qtde<br>Naipes</th>
              <th style="width: 8%;">%</th>
              <th style="width: 25%;">Ministério<br>Presente</th>
              <th style="width: 10%;">Qtde</th>
            </tr>
          </thead>
          <tbody>
            ${generateInstrumentRows(INSTRUMENT_GROUPS, instrumentCounts, groupTotals, grandTotal, ministryRows)}
            <tr class="total-row">
              <td colspan="2" style="text-align: center;">Total Geral de Instrumentos</td>
              <td class="number-cell">${grandTotal}</td>
              <td></td>
              <td class="number-cell">100%</td>
              <td></td>
              <td></td>
            </tr>
            ${eventData.observacao ? `
            <tr>
              <td colspan="7" class="observacao-cell">
                <strong>Observação:</strong><br>${eventData.observacao}
              </td>
            </tr>
            ` : ''}
          </tbody>
        </table>
        
        <table class="bottom-table">
          <tr>
            <td>Total de Organistas</td>
            <td>${eventData.quantidade_organistas || 0}</td>
            <td rowspan="3">
              <div class="hinos-section">
                <div class="hinos-title">Hinos:</div>
                ${eventData.hinos_cantados ? `<div><strong>Cantado:</strong> ${eventData.hinos_cantados}</div>` : ''}
                ${eventData.hinos_ensaiados ? `<div><strong>Ensaiados:</strong> ${eventData.hinos_ensaiados}</div>` : ''}
                <div style="margin-top: 5px;"><strong>Total de Hinos: ${countTotalHinos(eventData.hinos_cantados, eventData.hinos_ensaiados)}</strong></div>
              </div>
            </td>
          </tr>
          <tr>
            <td>Total Geral do Ensaio</td>
            <td>${grandTotal + (eventData.quantidade_organistas || 0)}</td>
          </tr>
          <tr>
            <td></td>
            <td></td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `;
  
  // Convert HTML to PDF using jsPDF
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Use html method to convert HTML to PDF
  doc.html(html, {
    callback: function(doc) {
      const fileName = `Relatorio_${eventData.meeting_name?.replace(/[^a-z0-9]/gi, '_') || 'evento'}_${eventData.meeting_date}.pdf`;
      doc.save(fileName);
    },
    x: 10,
    y: 10,
    width: 190,
    windowWidth: 800
  });
};

function generateInstrumentRows(
  groups: Record<string, string[]>,
  instrumentCounts: Record<string, Record<string, number>>,
  groupTotals: Record<string, number>,
  grandTotal: number,
  ministryRows: [string, number][]
): string {
  let html = '';
  let rowIndex = 0;
  
  Object.entries(groups).forEach(([group, instruments]) => {
    const groupCount = groupTotals[group] || 0;
    const groupPercentage = grandTotal > 0 ? Math.round((groupCount / grandTotal) * 100) : 0;
    
    instruments.forEach((instrument, index) => {
      const count = instrumentCounts[group]?.[instrument] || 0;
      const isFirstInGroup = index === 0;
      
      html += '<tr>';
      
      if (isFirstInGroup) {
        html += `<td class="naipe-cell" rowspan="${instruments.length}">${group}</td>`;
      }
      
      html += `<td class="instrument-cell">${instrument}</td>`;
      html += `<td class="number-cell">${count}</td>`;
      
      if (isFirstInGroup) {
        html += `<td class="number-cell" rowspan="${instruments.length}">${groupCount}</td>`;
        html += `<td class="number-cell" rowspan="${instruments.length}">${groupPercentage}%</td>`;
      }
      
      // Ministry column
      if (rowIndex === 0) {
        html += `<td style="text-align: center; font-weight: bold;">Anciães</td>`;
        html += `<td class="number-cell">${ministryRows.find(([m]) => m.includes('Anciães'))?.[1] || 0}</td>`;
      } else if (rowIndex < ministryRows.length + 1) {
        const ministry = ministryRows[rowIndex - 1];
        if (ministry) {
          html += `<td class="ministry-cell">${ministry[0]}</td>`;
          html += `<td class="number-cell">${ministry[1]}</td>`;
        } else {
          html += `<td></td><td></td>`;
        }
      } else {
        html += `<td></td><td></td>`;
      }
      
      html += '</tr>';
      rowIndex++;
    });
  });
  
  return html;
}

function countTotalHinos(cantados?: string, ensaiados?: string): number {
  const allHinos = [cantados, ensaiados]
    .filter(h => h)
    .join(', ')
    .split(',')
    .map(h => h.trim())
    .filter(h => h && !isNaN(Number(h)));
  
  return new Set(allHinos).size;
}
