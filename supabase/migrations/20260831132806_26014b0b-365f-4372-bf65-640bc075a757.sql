CREATE TABLE public.zeno_chat_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  municipality_id uuid REFERENCES public.municipalities(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  prompt text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT zeno_chat_settings_scope_chk CHECK (
    (municipality_id IS NOT NULL AND organization_id IS NULL)
    OR (municipality_id IS NULL AND organization_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX zeno_chat_settings_municipality_key ON public.zeno_chat_settings (municipality_id) WHERE municipality_id IS NOT NULL;
CREATE UNIQUE INDEX zeno_chat_settings_organization_key ON public.zeno_chat_settings (organization_id) WHERE organization_id IS NOT NULL;

GRANT SELECT ON public.zeno_chat_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.zeno_chat_settings TO authenticated;
GRANT ALL ON public.zeno_chat_settings TO service_role;

ALTER TABLE public.zeno_chat_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "zeno chat settings public read"
  ON public.zeno_chat_settings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "zeno chat settings insert"
  ON public.zeno_chat_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    is_super()
    OR (municipality_id IS NOT NULL AND city_scope(municipality_id))
    OR (organization_id IS NOT NULL AND (city_owns_org(organization_id) OR (organization_id = current_org() AND has_role(auth.uid(), 'org_admin'::app_role))))
  );

CREATE POLICY "zeno chat settings update"
  ON public.zeno_chat_settings FOR UPDATE
  TO authenticated
  USING (
    is_super()
    OR (municipality_id IS NOT NULL AND city_scope(municipality_id))
    OR (organization_id IS NOT NULL AND (city_owns_org(organization_id) OR (organization_id = current_org() AND has_role(auth.uid(), 'org_admin'::app_role))))
  )
  WITH CHECK (
    is_super()
    OR (municipality_id IS NOT NULL AND city_scope(municipality_id))
    OR (organization_id IS NOT NULL AND (city_owns_org(organization_id) OR (organization_id = current_org() AND has_role(auth.uid(), 'org_admin'::app_role))))
  );

CREATE POLICY "zeno chat settings delete"
  ON public.zeno_chat_settings FOR DELETE
  TO authenticated
  USING (
    is_super()
    OR (municipality_id IS NOT NULL AND city_scope(municipality_id))
    OR (organization_id IS NOT NULL AND (city_owns_org(organization_id) OR (organization_id = current_org() AND has_role(auth.uid(), 'org_admin'::app_role))))
  );

CREATE TRIGGER zeno_chat_settings_updated_at
  BEFORE UPDATE ON public.zeno_chat_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();