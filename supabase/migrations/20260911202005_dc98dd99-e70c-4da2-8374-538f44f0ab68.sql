CREATE TABLE public.device_app_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  app_id text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (device_id, app_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.device_app_access TO authenticated;
GRANT ALL ON public.device_app_access TO service_role;

ALTER TABLE public.device_app_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "device app access read" ON public.device_app_access
FOR SELECT TO authenticated
USING (
  public.is_super()
  OR public.manages_device(device_id)
  OR EXISTS (
    SELECT 1 FROM public.devices d
     WHERE d.id = device_app_access.device_id
       AND (d.organization_id = public.current_org()
            OR public.city_owns_org(d.organization_id)
            OR d.auth_user_id = auth.uid())
  )
);

CREATE POLICY "device app access super write" ON public.device_app_access
FOR ALL TO authenticated
USING (public.is_super())
WITH CHECK (public.is_super());

CREATE TRIGGER device_app_access_updated_at
BEFORE UPDATE ON public.device_app_access
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.seed_device_app_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.device_app_access (device_id, app_id, enabled, expires_at)
  SELECT NEW.id, a, true, now() + interval '1 year'
    FROM unnest(ARRAY['games','literacy','fonoplay','settings']) AS a
  ON CONFLICT (device_id, app_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER seed_device_app_access
AFTER INSERT ON public.devices
FOR EACH ROW EXECUTE FUNCTION public.seed_device_app_access();

INSERT INTO public.device_app_access (device_id, app_id, enabled, expires_at)
SELECT d.id, a, true, now() + interval '1 year'
  FROM public.devices d
  CROSS JOIN unnest(ARRAY['games','literacy','fonoplay','settings']) AS a
ON CONFLICT (device_id, app_id) DO NOTHING;