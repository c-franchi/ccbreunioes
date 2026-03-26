
-- Profiles table for user data
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- User roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Justification events table
CREATE TABLE public.justification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'Justificativas Ausência - Reunião Bimestral de Encarregados',
  meeting_date date NOT NULL,
  meeting_time time DEFAULT '15:00',
  opens_at timestamptz NOT NULL,
  closes_at timestamptz NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  status text DEFAULT 'aberto'
);
ALTER TABLE public.justification_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view open justification events" ON public.justification_events
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert justification events" ON public.justification_events
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update justification events" ON public.justification_events
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete justification events" ON public.justification_events
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Absence justifications table
CREATE TABLE public.absence_justifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.justification_events(id) ON DELETE CASCADE NOT NULL,
  musician_id uuid REFERENCES public.musicians(id) ON DELETE CASCADE NOT NULL,
  cargo text NOT NULL,
  localidade text NOT NULL,
  motivo text NOT NULL CHECK (motivo IN ('Enfermidade', 'Viagens', 'Trabalho', 'Particular')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (event_id, musician_id)
);
ALTER TABLE public.absence_justifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view justifications" ON public.absence_justifications
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert justifications" ON public.absence_justifications
  FOR INSERT WITH CHECK (true);

-- Enable realtime for justifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.absence_justifications;
