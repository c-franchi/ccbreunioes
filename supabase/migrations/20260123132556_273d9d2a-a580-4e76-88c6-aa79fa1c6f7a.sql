-- Habilitar extensão unaccent para busca sem acentos
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Criar função imutável wrapper para unaccent (necessário para índices)
CREATE OR REPLACE FUNCTION public.immutable_unaccent(text)
RETURNS text AS $$
  SELECT public.unaccent('public.unaccent', $1)
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT;

-- Criar índice para busca com unaccent (ignorando acentos)
CREATE INDEX IF NOT EXISTS idx_musicians_name_unaccent ON public.musicians (LOWER(public.immutable_unaccent(name)));