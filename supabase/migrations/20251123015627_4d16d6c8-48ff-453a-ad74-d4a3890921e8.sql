-- Create musicians table
CREATE TABLE IF NOT EXISTS public.musicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  instrument TEXT NOT NULL,
  localidade TEXT,
  cargo_ministerio TEXT,
  nivel TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create meeting_sessions table to track different meetings
CREATE TABLE IF NOT EXISTS public.meeting_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_date DATE NOT NULL DEFAULT CURRENT_DATE,
  meeting_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create attendances table
CREATE TABLE IF NOT EXISTS public.attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  musician_id UUID NOT NULL REFERENCES public.musicians(id) ON DELETE CASCADE,
  meeting_session_id UUID NOT NULL REFERENCES public.meeting_sessions(id) ON DELETE CASCADE,
  present BOOLEAN NOT NULL DEFAULT true,
  checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(musician_id, meeting_session_id)
);

-- Enable Row Level Security
ALTER TABLE public.musicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;

-- RLS Policies for musicians (public read, no auth required for this use case)
CREATE POLICY "Anyone can view musicians"
ON public.musicians FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert musicians"
ON public.musicians FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update musicians"
ON public.musicians FOR UPDATE
USING (true);

-- RLS Policies for meeting_sessions
CREATE POLICY "Anyone can view meeting sessions"
ON public.meeting_sessions FOR SELECT
USING (true);

CREATE POLICY "Anyone can create meeting sessions"
ON public.meeting_sessions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update meeting sessions"
ON public.meeting_sessions FOR UPDATE
USING (true);

-- RLS Policies for attendances
CREATE POLICY "Anyone can view attendances"
ON public.attendances FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert attendances"
ON public.attendances FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update attendances"
ON public.attendances FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete attendances"
ON public.attendances FOR DELETE
USING (true);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.musicians;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendances;

-- Create indexes for better performance
CREATE INDEX idx_musicians_name ON public.musicians(name);
CREATE INDEX idx_musicians_instrument ON public.musicians(instrument);
CREATE INDEX idx_attendances_musician ON public.attendances(musician_id);
CREATE INDEX idx_attendances_session ON public.attendances(meeting_session_id);