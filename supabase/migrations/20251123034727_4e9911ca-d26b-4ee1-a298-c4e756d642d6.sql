-- Alterar tipo dos campos de hinos de integer para text
-- para permitir inserir números dos hinos (ex: "84" ou "328, 52, 248, 281, 61, 240")
ALTER TABLE meeting_sessions 
ALTER COLUMN hinos_cantados TYPE text USING CASE 
  WHEN hinos_cantados = 0 THEN ''
  ELSE hinos_cantados::text
END;

ALTER TABLE meeting_sessions 
ALTER COLUMN hinos_ensaiados TYPE text USING CASE 
  WHEN hinos_ensaiados = 0 THEN ''
  ELSE hinos_ensaiados::text
END;

-- Definir valores padrão para texto vazio
ALTER TABLE meeting_sessions 
ALTER COLUMN hinos_cantados SET DEFAULT '';

ALTER TABLE meeting_sessions 
ALTER COLUMN hinos_ensaiados SET DEFAULT '';