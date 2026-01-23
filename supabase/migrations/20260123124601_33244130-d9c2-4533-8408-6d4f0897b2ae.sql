-- Adicionar campo meeting_time para armazenar o horário definido pelo usuário
ALTER TABLE meeting_sessions 
ADD COLUMN meeting_time TIME DEFAULT '19:00';