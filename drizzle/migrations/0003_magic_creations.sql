CREATE TABLE public.magic_creations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  kind text NOT NULL,
  title text NOT NULL DEFAULT '',
  input_text text,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  drawing_url text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.magic_creations TO authenticated;
GRANT ALL ON public.magic_creations TO service_role;
ALTER TABLE public.magic_creations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "magic read own org" ON public.magic_creations FOR SELECT TO authenticated
  USING (public.is_super() OR owner_id = auth.uid() OR (organization_id IS NOT NULL AND organization_id = public.current_org()));
CREATE POLICY "magic insert own" ON public.magic_creations FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND (organization_id IS NULL OR organization_id = public.current_org() OR public.is_super()));
CREATE POLICY "magic delete own" ON public.magic_creations FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR public.is_super());
CREATE INDEX magic_creations_org_idx ON public.magic_creations (organization_id, created_at DESC);