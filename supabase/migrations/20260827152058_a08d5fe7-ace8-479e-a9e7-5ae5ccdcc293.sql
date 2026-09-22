REVOKE ALL ON FUNCTION public.current_municipality() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_city_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.city_scope(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.city_owns_org(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_org() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_super() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.current_municipality() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_city_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.city_scope(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.city_owns_org(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_org() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
