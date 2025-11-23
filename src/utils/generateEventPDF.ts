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
  tipo_contagem?: string;
  
  // Campos de ministério presente
  ministerio_anciaes?: number;
  ministerio_diaconos?: number;
  ministerio_cooperadores?: number;
  ministerio_coop_jovens?: number;
  ministerio_enc_regionais?: number;
  ministerio_enc_locais?: number;
  ministerio_examinadoras?: number;
  ministerio_administracao?: number;
}

interface AttendanceData {
  musician: {
    name: string;
    instrument: string;
    cargo_ministerio?: string;
  };
}

// Grupos de instrumentos iguais ao modelo
const INSTRUMENT_GROUPS = {
  Cordas: ['Violino', 'Viola', 'Violoncelo'],
  Madeiras: [
    'Flauta',
    'Oboé',
    "Oboé D'Amore",
    'Corne Inglês',
    'Clarinete',
    'Clarinete Alto',
    'Clarinete Baixo',
    'Fagote',
    'Saxofone Soprano',
    'Saxofone Alto',
    'Saxofone Tenor',
    'Saxofone Baritono'
  ],
  Metais: [
    'Trompete / Cornet',
    'Flugelhom',
    'Trompa',
    'Trombone / Trombonito',
    'Baritono',
    'Eufônio',
    'Tuba',
    'Acordeon'
  ],
  Outros: ['Não Incluído no MOD']
};

export const generateEventPDF = (eventData: EventData, attendances: AttendanceData[]) => {
  const tipoContagem = eventData.tipo_contagem || 'instrumento';
  
  // Count instruments
  const instrumentCounts: Record<string, Record<string, number>> = {};
  
  // função para normalizar (remove acentos, deixa maiúsculo e tira espaços extras)
  const normalize = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/\s+/g, ' ')
      .trim();

  attendances.forEach((att) => {
    const rawInstrument = att.musician.instrument || '';
    const normInstrument = normalize(rawInstrument);

    for (const [group, instruments] of Object.entries(INSTRUMENT_GROUPS)) {
      const matchedInstrument = instruments.find((i) => {
        const normI = normalize(i);
        return (
          normInstrument === normI ||
          normInstrument.startsWith(normI + ' ') ||
          normI.startsWith(normInstrument + ' ')
        );
      });

      if (matchedInstrument) {
        if (!instrumentCounts[group]) {
          instrumentCounts[group] = {};
        }

        // usa SEMPRE o nome do grupo (matchedInstrument) como chave,
        // que é o mesmo nome usado na tabela
        instrumentCounts[group][matchedInstrument] =
          (instrumentCounts[group][matchedInstrument] || 0) + 1;
        break;
      }
    }
  });
  
  // Calculate totals
  const groupTotals: Record<string, number> = {};
  const grandTotal = attendances.length;
  
  Object.entries(instrumentCounts).forEach(([group, instruments]) => {
    groupTotals[group] = Object.values(instruments).reduce((sum, count) => sum + count, 0);
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
      padding: 15px 20px;
    }
    .header {
      text-align: center;
      font-weight: bold;
      font-size: 12px;
      margin-bottom: 5px;
    }
    .subheader {
      text-align: center;
      font-weight: bold;
      margin-bottom: 5px;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: 4px;
    }
    td, th {
      border: 1px solid #000;
      padding: 2px 4px;
      vertical-align: middle;
    }
    .top-table td {
      border: none;
      font-size: 9px;
    }
    .top-table td.label {
      width: 28%;
      font-weight: bold;
    }
    .top-table td.value {
      width: 72%;
    }
    .linha-cab {
      width: 100%;
      margin-bottom: 4px;
      font-size: 9px;
    }
    .linha-cab td {
      border: none;
      padding: 1px 2px;
    }
    .linha-cab td:first-child {
      width: 60%;
      font-weight: bold;
    }
    .linha-cab td:last-child {
      text-align: right;
    }

    .main-row {
      width: 100%;
    }
    .col-esq {
      width: 70%;
      vertical-align: top;
      padding-right: 6px;
    }
    .col-dir {
      width: 30%;
      vertical-align: top;
      padding-left: 6px;
    }

    .main-table {
      border-collapse: collapse;
    }

    .main-table th,
    .main-table td {
      border: 1px solid #000;
      font-size: 8px;
    }

    .main-table th {
      background-color: #f0f0f0;
      font-weight: bold;
      text-align: center;
      padding: 3px 2px;
    }

    .naipe-cell {
      font-weight: bold;
      text-align: center;
      vertical-align: middle;
    }

    .instrument-cell {
      padding-left: 6px;
    }

    .number-cell {
      text-align: center;
      font-weight: bold;
    }

    .ministerio-table th {
      background-color: #f0f0f0;
      font-size: 8px;
      text-align: center;
    }
    .ministerio-table td {
      font-size: 8px;
      padding: 2px 4px;
    }
    .ministerio-table th {
      background-color: #f0f0f0;
      text-align: center;
      font-weight: bold;
    }
    .ministerio-table td:first-child {
      width: 70%;
    }
    .ministerio-table td:last-child {
      width: 30%;
      text-align: center;
      font-weight: bold;
    }

    .total-row {
      background-color: #f0f0f0;
      font-weight: bold;
    }

    .bottom-totals td {
      font-size: 9px;
      padding: 2px 4px;
    }
    .bottom-totals td.label {
      font-weight: bold;
      width: 60%;
    }
    .bottom-totals td.value {
      width: 40%;
      text-align: right;
    }

    .hinos-box {
      margin-top: 4px;
      border: 1px solid #000;
      padding: 3px 4px;
      font-size: 8px;
    }
    .hinos-box-title {
      font-weight: bold;
      margin-bottom: 2px;
    }

    .observacao-cell {
      font-size: 8px;
      padding: 4px;
    }
  </style>
</head>
<body>
  <div class="header">CONGREGAÇÃO CRISTÃ NO BRASIL</div>
  <table class="linha-cab">
    <tr>
      <td>ENSAIO ${eventData.meeting_name || ''} – ${eventData.cidade || ''}</td>
      <td>Data: ${new Date(eventData.meeting_date).toLocaleDateString('pt-BR')}</td>
    </tr>
  </table>

  <table class="top-table">
    <tr><td class="label">Ancião:</td><td class="value">${eventData.anciao || ''}</td></tr>
    <tr><td class="label">Regência Enc. Regional 1:</td><td class="value">${eventData.regencia_enc_regional_1 || ''}</td></tr>
    <tr><td class="label">Regência Enc. Regional 2:</td><td class="value">${eventData.regencia_enc_regional_2 || ''}</td></tr>
    <tr><td class="label">Examinadora:</td><td class="value">${eventData.examinadora || ''}</td></tr>
    <tr><td class="label">Demais Irmãos Presentes:</td><td class="value">${eventData.demais_irmaos || ''}</td></tr>
    <tr><td class="label">Palavra:</td><td class="value">${eventData.palavra || ''}</td></tr>
  </table>

  <table class="main-row">
    <tr>
      <td class="col-esq">
        <table class="main-table">
          <thead>
            <tr>
              <th style="width:12%;">Naipes</th>
              <th style="width:44%;">Instrumentos</th>
              <th style="width:15%;">Qtde Instrumentos</th>
              <th style="width:15%;">Qtde Naipes</th>
              <th style="width:14%;">%</th>
            </tr>
          </thead>
          <tbody>
            ${tipoContagem === 'naipe' 
              ? generateNaipeRows(instrumentCounts, groupTotals, grandTotal)
              : generateInstrumentRows(INSTRUMENT_GROUPS, instrumentCounts, groupTotals, grandTotal)
            }
            <tr class="total-row">
              <td colspan="2" style="text-align:center;">Total Geral de Instrumentos</td>
              <td class="number-cell">${grandTotal}</td>
              <td></td>
              <td class="number-cell">${grandTotal > 0 ? '100%' : '0%'}</td>
            </tr>
            ${eventData.observacao ? `
            <tr>
              <td colspan="5" class="observacao-cell">
                <strong>Observação:</strong> ${eventData.observacao}
              </td>
            </tr>` : ''}
          </tbody>
        </table>

        <table class="bottom-totals">
          <tr>
            <td class="label">Total de Organistas</td>
            <td class="value">${eventData.quantidade_organistas || 0}</td>
          </tr>
          <tr>
            <td class="label">Total Geral do Ensaio</td>
            <td class="value">${grandTotal + (eventData.quantidade_organistas || 0)}</td>
          </tr>
        </table>
      </td>

      <td class="col-dir">
        <table class="ministerio-table">
          <tr><th>Ministério Presente</th><th>Qtde</th></tr>
          <tr><td>Anciães</td><td>${eventData.ministerio_anciaes || 0}</td></tr>
          <tr><td>Diáconos</td><td>${eventData.ministerio_diaconos || 0}</td></tr>
          <tr><td>Cooperadores</td><td>${eventData.ministerio_cooperadores || 0}</td></tr>
          <tr><td>Coop. Jovens</td><td>${eventData.ministerio_coop_jovens || 0}</td></tr>
          <tr><td>Enc. Regionais</td><td>${eventData.ministerio_enc_regionais || 0}</td></tr>
          <tr><td>Enc. Locais</td><td>${eventData.ministerio_enc_locais || 0}</td></tr>
          <tr><td>Examinadoras</td><td>${eventData.ministerio_examinadoras || 0}</td></tr>
          <tr><td>Administração</td><td>${eventData.ministerio_administracao || 0}</td></tr>
        </table>

        <div class="hinos-box">
          <div class="hinos-box-title">Hinos:</div>
          ${eventData.hinos_cantados ? `<div><strong>Cantado:</strong> ${eventData.hinos_cantados}</div>` : ''}
          ${eventData.hinos_ensaiados ? `<div><strong>Ensaiados:</strong> ${eventData.hinos_ensaiados}</div>` : ''}
          <div style="margin-top:3px;">
            <strong>Total de Hinos: ${countTotalHinos(eventData.hinos_cantados, eventData.hinos_ensaiados)}</strong>
          </div>
        </div>
      </td>
    </tr>
  </table>
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
  grandTotal: number
): string {
  let html = '';

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

      html += '</tr>';
    });
  });

  return html;
}

function generateNaipeRows(
  instrumentCounts: Record<string, Record<string, number>>,
  groupTotals: Record<string, number>,
  grandTotal: number
): string {
  let html = '';

  Object.entries(groupTotals).forEach(([group, total]) => {
    const percentage = grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0;
    
    html += '<tr>';
    html += `<td class="naipe-cell" colspan="2">${group}</td>`;
    html += `<td class="number-cell">${total}</td>`;
    html += `<td class="number-cell">${total}</td>`;
    html += `<td class="number-cell">${percentage}%</td>`;
    html += '</tr>';
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
