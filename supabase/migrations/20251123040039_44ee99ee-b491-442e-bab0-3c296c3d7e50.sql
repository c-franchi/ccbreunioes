-- Adicionar campo cidade para armazenar a localização do evento
ALTER TABLE meeting_sessions 
ADD COLUMN cidade text;

COMMENT ON COLUMN meeting_sessions.cidade IS 'Cidade onde o evento ocorreu';