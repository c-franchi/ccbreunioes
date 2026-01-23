// Arquivo centralizado de instrumentos e grupos
// Mantenha este arquivo atualizado para garantir consistência em todo o sistema

export const INSTRUMENT_GROUPS: Record<string, string[]> = {
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
