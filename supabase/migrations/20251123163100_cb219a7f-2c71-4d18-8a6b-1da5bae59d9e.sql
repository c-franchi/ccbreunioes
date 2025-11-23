-- Permitir contagem de instrumentos sem músico específico
ALTER TABLE public.attendances 
ALTER COLUMN musician_id DROP NOT NULL;

-- Adicionar campo para armazenar o instrumento quando não há músico
ALTER TABLE public.attendances 
ADD COLUMN instrument text;

COMMENT ON COLUMN public.attendances.musician_id IS 'ID do músico (NULL quando for contagem sem nome)';
COMMENT ON COLUMN public.attendances.instrument IS 'Nome do instrumento (usado quando musician_id é NULL para contagem sem nome)';