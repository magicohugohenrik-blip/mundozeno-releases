CREATE TABLE public.activities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  base_slug text not null,
  title text not null,
  description text,
  emoji text not null default '🎲',
  color text not null default 'bg-zeno-blue',
  level int not null default 1,
  config jsonb not null default '{}'::jsonb,
  visibility text not null default 'organization' check (visibility in ('private','organization')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO authenticated;
GRANT ALL ON public.activities TO service_role;

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activities tenant read" ON public.activities FOR SELECT TO authenticated
USING (is_super() OR (organization_id = current_org() AND (visibility = 'organization' OR owner_id = auth.uid())));

CREATE POLICY "activities insert" ON public.activities FOR INSERT TO authenticated
WITH CHECK (organization_id = current_org() AND owner_id = auth.uid());

CREATE POLICY "activities update own" ON public.activities FOR UPDATE TO authenticated
USING (is_super() OR (organization_id = current_org() AND owner_id = auth.uid()))
WITH CHECK (organization_id = current_org());

CREATE POLICY "activities delete own" ON public.activities FOR DELETE TO authenticated
USING (is_super() OR (organization_id = current_org() AND owner_id = auth.uid()));

CREATE INDEX activities_org_idx ON public.activities (organization_id, active);

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();