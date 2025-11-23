-- Add status column to meeting_sessions table
ALTER TABLE meeting_sessions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'aberto' CHECK (status IN ('aberto', 'encerrado'));