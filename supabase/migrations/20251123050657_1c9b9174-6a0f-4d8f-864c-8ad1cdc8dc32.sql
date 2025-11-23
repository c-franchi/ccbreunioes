-- Adicionar colunas de ministério à tabela meeting_sessions
ALTER TABLE public.meeting_sessions 
ADD COLUMN IF NOT EXISTS ministerio_anciaes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ministerio_diaconos INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ministerio_cooperadores INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ministerio_coop_jovens INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ministerio_enc_regionais INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ministerio_enc_locais INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ministerio_examinadoras INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ministerio_administracao INTEGER DEFAULT 0;