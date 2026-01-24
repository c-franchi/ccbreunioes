-- Corrigir localidades com prefixo RET removendo o prefixo
UPDATE musicians 
SET localidade = TRIM(SUBSTRING(localidade FROM 5))
WHERE localidade LIKE 'RET %';