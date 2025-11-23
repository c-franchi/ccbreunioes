-- Add additional fields for event report information
ALTER TABLE public.meeting_sessions
ADD COLUMN IF NOT EXISTS anciao TEXT,
ADD COLUMN IF NOT EXISTS regencia_enc_regional_1 TEXT,
ADD COLUMN IF NOT EXISTS regencia_enc_regional_2 TEXT,
ADD COLUMN IF NOT EXISTS examinadora TEXT,
ADD COLUMN IF NOT EXISTS ancioes_presentes TEXT,
ADD COLUMN IF NOT EXISTS palavra TEXT,
ADD COLUMN IF NOT EXISTS demais_irmaos TEXT,
ADD COLUMN IF NOT EXISTS observacao TEXT;