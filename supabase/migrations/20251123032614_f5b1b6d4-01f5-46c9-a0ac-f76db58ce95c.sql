-- Add new fields for hymns and organists to meeting_sessions table
ALTER TABLE public.meeting_sessions
ADD COLUMN hinos_cantados INTEGER DEFAULT 0,
ADD COLUMN hinos_ensaiados INTEGER DEFAULT 0,
ADD COLUMN quantidade_organistas INTEGER DEFAULT 0;