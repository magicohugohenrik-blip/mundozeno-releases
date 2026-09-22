REVOKE ALL ON FUNCTION public.manages_device(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.manages_device(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.manages_device(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.manages_device(uuid) TO service_role;
