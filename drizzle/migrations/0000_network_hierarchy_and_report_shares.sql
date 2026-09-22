-- 1) Rede (grupo de unidades) como tipo de instituição + hierarquia
ALTER TYPE public.org_type ADD VALUE IF NOT EXISTS 'rede';

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS organizations_parent_id_idx ON public.organizations(parent_id);

-- 2) Compartilhamento de relatório da criança para o celular do profissional
CREATE TABLE IF NOT EXISTS public.report_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by uuid,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '12 hours'),
  revoked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.report_shares TO authenticated;
GRANT ALL ON public.report_shares TO service_role;

ALTER TABLE public.report_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "report_shares_select_own_org"
  ON public.report_shares FOR SELECT TO authenticated
  USING (public.is_super() OR organization_id = public.current_org());

CREATE POLICY "report_shares_insert_own_org"
  ON public.report_shares FOR INSERT TO authenticated
  WITH CHECK (public.is_super() OR organization_id = public.current_org());

CREATE POLICY "report_shares_update_own_org"
  ON public.report_shares FOR UPDATE TO authenticated
  USING (public.is_super() OR organization_id = public.current_org());

CREATE POLICY "report_shares_delete_own_org"
  ON public.report_shares FOR DELETE TO authenticated
  USING (public.is_super() OR organization_id = public.current_org());

CREATE INDEX IF NOT EXISTS report_shares_student_idx ON public.report_shares(student_id);