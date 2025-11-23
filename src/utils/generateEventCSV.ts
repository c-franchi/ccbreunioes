interface EventData {
  meeting_name: string;
  meeting_date: string;
  cidade?: string;
  tipo_contagem?: string;
}

interface AttendanceData {
  instrument?: string | null;
  musician?: {
    name: string;
    instrument: string;
    cargo_ministerio?: string;
    localidade?: string;
  } | null;
}

const INSTRUMENT_GROUPS: Record<string, string[]> = {
  Cordas: ['Violino', 'Viola', 'Violoncelo'],
  Madeiras: [
    'Flauta', 'Oboé', "Oboé D'Amore", 'Corne Inglês',
    'Clarinete', 'Clarinete Alto', 'Clarinete Baixo', 'Fagote',
    'Saxofone Soprano', 'Saxofone Alto', 'Saxofone Tenor', 'Saxofone Baritono'
  ],
  Metais: [
    'Trompete / Cornet', 'Flugelhom', 'Trompa',
    'Trombone / Trombonito', 'Baritono', 'Eufônio', 'Tuba', 'Acordeon'
  ],
  Outros: ['Não Incluído no MOD']
};

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();

const findInstrumentGroup = (instrument: string): string => {
  const normInstrument = normalize(instrument);
  for (const [group, instruments] of Object.entries(INSTRUMENT_GROUPS)) {
    const matchedInstrument = instruments.find((i) => {
      const normI = normalize(i);
      return (
        normInstrument === normI ||
        normInstrument.startsWith(normI + ' ') ||
        normI.startsWith(normInstrument + ' ')
      );
    });
    if (matchedInstrument) return group;
  }
  return 'Outros';
};

export const generateEventCSV = (eventData: EventData, attendances: AttendanceData[]) => {
  const tipoContagem = eventData.tipo_contagem || 'instrumento';
  
  let csvContent: string;
  
  if (tipoContagem === 'naipe') {
    // Group by naipe
    const grouped: Record<string, AttendanceData[]> = {};
    attendances.forEach(att => {
      const instrumentName = att.musician?.instrument || att.instrument || 'Desconhecido';
      const group = findInstrumentGroup(instrumentName);
      if (!grouped[group]) grouped[group] = [];
      grouped[group].push(att);
    });
    
    const headers = ['Naipe', 'Nome', 'Instrumento', 'Cargo/Ministério', 'Localidade'];
    const rows: string[][] = [];
    
    Object.entries(grouped).forEach(([naipe, members]) => {
      members.forEach(att => {
        rows.push([
          naipe,
          att.musician?.name || 'Contagem sem nome',
          att.musician?.instrument || att.instrument || '',
          att.musician?.cargo_ministerio || '',
          att.musician?.localidade || ''
        ]);
      });
    });
    
    csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
  } else {
    // Individual instrument counting
    const headers = ['Nome', 'Instrumento', 'Cargo/Ministério', 'Localidade'];
    
    const rows = attendances.map(att => [
      att.musician?.name || 'Contagem sem nome',
      att.musician?.instrument || att.instrument || '',
      att.musician?.cargo_ministerio || '',
      att.musician?.localidade || ''
    ]);
    
    csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
  }
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `Presencas_${eventData.meeting_name.replace(/[^a-z0-9]/gi, '_')}_${eventData.meeting_date}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
