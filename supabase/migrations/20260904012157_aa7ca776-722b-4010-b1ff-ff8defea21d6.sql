CREATE OR REPLACE FUNCTION public.manages_device(_device_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.device_managers dm
     WHERE dm.device_id = _device_id AND dm.user_id = auth.uid()
  )
$$;

REVOKE EXECUTE ON FUNCTION public.manages_device(uuid) FROM anon;

DROP POLICY IF EXISTS "devices tenant" ON public.devices;

CREATE POLICY "devices tenant" ON public.devices
  FOR ALL TO authenticated
  USING (
    public.is_super()
    OR organization_id = public.current_org()
    OR public.city_owns_org(organization_id)
    OR public.manages_device(id)
  )
  WITH CHECK (
    public.is_super()
    OR organization_id = public.current_org()
    OR public.city_owns_org(organization_id)
    OR public.manages_device(id)
  );
