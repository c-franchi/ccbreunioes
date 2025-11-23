-- Adicionar campos para configuração de contagem e tipo de presença
ALTER TABLE public.meeting_sessions 
ADD COLUMN tipo_contagem text DEFAULT 'instrumento',
ADD COLUMN tipo_presenca text DEFAULT 'individual';

COMMENT ON COLUMN public.meeting_sessions.tipo_contagem IS 'Define como agrupar no relatório: instrumento (individual) ou naipe (agrupado)';
COMMENT ON COLUMN public.meeting_sessions.tipo_presenca IS 'Define método de marcação: individual (um por vez) ou em_grupo (múltiplos simultaneamente)';