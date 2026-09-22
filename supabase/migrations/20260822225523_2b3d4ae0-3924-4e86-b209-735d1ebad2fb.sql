ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS anamnesis jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS cid_codes text[] NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS public.assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  author_id uuid,
  period_days integer NOT NULL DEFAULT 30,
  summary text NOT NULL DEFAULT '',
  strengths text NOT NULL DEFAULT '',
  attention_points text NOT NULL DEFAULT '',
  recommendations text NOT NULL DEFAULT '',
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.assessments TO authenticated;
GRANT ALL ON public.assessments TO service_role;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assessments tenant" ON public.assessments FOR ALL TO authenticated
  USING (is_super() OR organization_id = current_org())
  WITH CHECK (is_super() OR organization_id = current_org());

CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON public.assessments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.game_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  game_slug text NOT NULL,
  event_type text NOT NULL,
  response_time_ms integer,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_events TO authenticated;
GRANT ALL ON public.game_events TO service_role;
ALTER TABLE public.game_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "game events tenant" ON public.game_events FOR ALL TO authenticated
  USING (is_super() OR organization_id = current_org())
  WITH CHECK (is_super() OR organization_id = current_org());

CREATE INDEX IF NOT EXISTS game_events_student_idx ON public.game_events (student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS assessments_student_idx ON public.assessments (student_id, created_at DESC);