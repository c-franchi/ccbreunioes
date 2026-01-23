// Arquivo centralizado de instrumentos e grupos
// Mantenha este arquivo atualizado para garantir consistência em todo o sistema

export const INSTRUMENT_GROUPS: Record<string, string[]> = {
  Cordas: ['Violino', 'Viola', 'Violoncelo', 'Violino Contralto'],
  Madeiras: [
    'Flauta',
    'Oboé',
    'Corne Inglês',
    'Clarinete',
    'Clarinete Alto',
    'Clarinete Baixo',
    'Fagote',
    'Saxofone Soprano',
    'Saxofone Alto',
    'Saxofone Tenor',
    'Saxofone Barítono'
  ],
  Metais: [
    'Acordeon',
    'Cornet',
    'Trompete',
    'Flugelhorn',
    'Trompa',
    'Trombonito',
    'Barítono de Pisto',
    'Trombone',
    'Euphonium',
    'Tuba'
  ],
  Órgão: ['Órgão'],
  Outros: ['Não Incluído no MOD']
};

export const ALL_INSTRUMENTS = Object.values(INSTRUMENT_GROUPS).flat();

// Função auxiliar para normalizar nomes de instrumentos (remove acentos, maiúsculo)
export const normalizeInstrument = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();

// Mapeamento de instrumentos do PDF para nomes padronizados
export const INSTRUMENT_MAPPING: Record<string, string> = {
  'VIOLINO': 'Violino',
  'VIOLINO CONTRALTO': 'Violino Contralto',
  'VIOLA': 'Viola',
  'VIOLONCELO': 'Violoncelo',
  'FLAUTA': 'Flauta',
  'OBOÉ': 'Oboé',
  'OBOE': 'Oboé',
  'CORNE INGLÊS': 'Corne Inglês',
  'CLARINETE': 'Clarinete',
  'CLARINETE ALTO': 'Clarinete Alto',
  'CLARINETE BAIXO': 'Clarinete Baixo',
  'FAGOTE': 'Fagote',
  'SAXOFONE SOPRANO RET': 'Saxofone Soprano',
  'SAXOFONE SOPRANO': 'Saxofone Soprano',
  'SAXOFONE ALTO': 'Saxofone Alto',
  'SAXOFONE TENOR': 'Saxofone Tenor',
  'SAXOFONE BARÍTONO': 'Saxofone Barítono',
  'SAXOFONE BARITONO': 'Saxofone Barítono',
  'ACORDEON': 'Acordeon',
  'CORNET': 'Cornet',
  'TROMPETE': 'Trompete',
  'FLUGELHORN': 'Flugelhorn',
  'TROMPA': 'Trompa',
  'TROMBONITO': 'Trombonito',
  'BARÍTONO DE PISTO': 'Barítono de Pisto',
  'BARITONO DE PISTO': 'Barítono de Pisto',
  'TROMBONE': 'Trombone',
  'EUPHONIUM': 'Euphonium',
  'TUBA': 'Tuba',
  'ÓRGÃO': 'Órgão',
  'ORGAO': 'Órgão'
};

// Função para mapear instrumento do PDF para nome padronizado
export const mapInstrument = (pdfInstrument: string): string => {
  const normalized = pdfInstrument.toUpperCase().trim();
  return INSTRUMENT_MAPPING[normalized] || pdfInstrument;
};

// Função para encontrar o grupo de um instrumento
export const findInstrumentGroup = (instrument: string): string => {
  const normInstrument = normalizeInstrument(instrument);
  for (const [group, instruments] of Object.entries(INSTRUMENT_GROUPS)) {
    const matchedInstrument = instruments.find((i) => {
      const normI = normalizeInstrument(i);
      return (
        normInstrument === normI ||
        normInstrument.startsWith(normI + ' ') ||
        normI.startsWith(normInstrument + ' ') ||
        normInstrument.includes(normI) ||
        normI.includes(normInstrument)
      );
    });
    if (matchedInstrument) return group;
  }
  return 'Outros';
};
