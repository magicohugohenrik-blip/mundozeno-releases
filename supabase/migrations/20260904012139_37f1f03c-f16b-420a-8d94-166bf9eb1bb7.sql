ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'table_manager';

ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS auth_user_id uuid;
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS login_username text;

CREATE TABLE IF NOT EXISTS public.device_managers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (device_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.device_managers TO authenticated;
GRANT ALL ON public.device_managers TO service_role;

ALTER TABLE public.device_managers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "device_managers read" ON public.device_managers
  FOR SELECT TO authenticated
  USING (
    public.is_super()
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.devices d
       WHERE d.id = device_id
         AND (d.organization_id = public.current_org() OR public.city_owns_org(d.organization_id))
    )
  );

CREATE POLICY "device_managers write" ON public.device_managers
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super()
    OR EXISTS (
      SELECT 1 FROM public.devices d
       WHERE d.id = device_id
         AND (public.city_owns_org(d.organization_id)
              OR (d.organization_id = public.current_org() AND public.has_role(auth.uid(), 'org_admin')))
    )
  );

CREATE POLICY "device_managers delete" ON public.device_managers
  FOR DELETE TO authenticated
  USING (
    public.is_super()
    OR EXISTS (
      SELECT 1 FROM public.devices d
       WHERE d.id = device_id
         AND (public.city_owns_org(d.organization_id)
              OR (d.organization_id = public.current_org() AND public.has_role(auth.uid(), 'org_admin')))
    )
  );
