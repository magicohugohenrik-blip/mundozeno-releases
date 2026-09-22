GRANT EXECUTE ON FUNCTION public.is_super() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_org() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;