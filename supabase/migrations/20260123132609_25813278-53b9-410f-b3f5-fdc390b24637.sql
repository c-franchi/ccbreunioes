-- Criar função RPC para busca de músicos ignorando acentos
CREATE OR REPLACE FUNCTION public.search_musicians_by_name(search_term text)
RETURNS SETOF musicians AS $$
  SELECT *
  FROM musicians
  WHERE LOWER(public.immutable_unaccent(name)) LIKE '%' || LOWER(public.immutable_unaccent(search_term)) || '%'
  ORDER BY name
  LIMIT 10;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;