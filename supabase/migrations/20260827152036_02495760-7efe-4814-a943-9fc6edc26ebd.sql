-- funções de escopo municipal
CREATE OR REPLACE FUNCTION public.current_municipality()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT p.municipality_id FROM public.profiles p WHERE p.id = auth.uid()),
    (SELECT o.municipality_id FROM public.profiles p
       JOIN public.organizations o ON o.id = p.organization_id
      WHERE p.id = auth.uid())
  )
$$;

CREATE OR REPLACE FUNCTION public.is_city_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'city_admin')
$$;

-- true quando o usuário administra o município informado
CREATE OR REPLACE FUNCTION public.city_scope(_municipality_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _municipality_id IS NOT NULL
     AND public.is_city_admin()
     AND _municipality_id = public.current_municipality()
$$;

-- true quando a organização informada pertence ao município que o usuário administra
CREATE OR REPLACE FUNCTION public.city_owns_org(_organization_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organizations o
     WHERE o.id = _organization_id
       AND public.city_scope(o.municipality_id)
  )
$$;

REVOKE EXECUTE ON FUNCTION public.current_municipality() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_city_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.city_scope(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.city_owns_org(uuid) FROM anon;

-- políticas de municípios
CREATE POLICY "municipalities read" ON public.municipalities
FOR SELECT TO authenticated
USING (is_super() OR id = public.current_municipality());

CREATE POLICY "municipalities insert" ON public.municipalities
FOR INSERT TO authenticated WITH CHECK (is_super());

CREATE POLICY "municipalities update" ON public.municipalities
FOR UPDATE TO authenticated
USING (is_super() OR public.city_scope(id))
WITH CHECK (is_super() OR public.city_scope(id));

CREATE POLICY "municipalities delete" ON public.municipalities
FOR DELETE TO authenticated USING (is_super());

-- ampliar escopo das tabelas existentes para o administrador municipal
DROP POLICY IF EXISTS "orgs visible" ON public.organizations;
CREATE POLICY "orgs visible" ON public.organizations
FOR SELECT TO authenticated
USING (is_super() OR id = current_org() OR public.city_scope(municipality_id));

DROP POLICY IF EXISTS "orgs update" ON public.organizations;
CREATE POLICY "orgs update" ON public.organizations
FOR UPDATE TO authenticated
USING (is_super() OR id = current_org() OR public.city_scope(municipality_id))
WITH CHECK (is_super() OR id = current_org() OR public.city_scope(municipality_id));

DROP POLICY IF EXISTS "students tenant" ON public.students;
CREATE POLICY "students tenant" ON public.students
FOR ALL TO authenticated
USING (is_super() OR organization_id = current_org() OR public.city_owns_org(organization_id))
WITH CHECK (is_super() OR organization_id = current_org() OR public.city_owns_org(organization_id));

DROP POLICY IF EXISTS "classes tenant" ON public.classes;
CREATE POLICY "classes tenant" ON public.classes
FOR ALL TO authenticated
USING (is_super() OR organization_id = current_org() OR public.city_owns_org(organization_id))
WITH CHECK (is_super() OR organization_id = current_org() OR public.city_owns_org(organization_id));

DROP POLICY IF EXISTS "sessions tenant" ON public.game_sessions;
CREATE POLICY "sessions tenant" ON public.game_sessions
FOR ALL TO authenticated
USING (is_super() OR organization_id = current_org() OR public.city_owns_org(organization_id))
WITH CHECK (is_super() OR organization_id = current_org() OR public.city_owns_org(organization_id));

DROP POLICY IF EXISTS "game events tenant" ON public.game_events;
CREATE POLICY "game events tenant" ON public.game_events
FOR ALL TO authenticated
USING (is_super() OR organization_id = current_org() OR public.city_owns_org(organization_id))
WITH CHECK (is_super() OR organization_id = current_org() OR public.city_owns_org(organization_id));

DROP POLICY IF EXISTS "assessments tenant" ON public.assessments;
CREATE POLICY "assessments tenant" ON public.assessments
FOR ALL TO authenticated
USING (is_super() OR organization_id = current_org() OR public.city_owns_org(organization_id))
WITH CHECK (is_super() OR organization_id = current_org() OR public.city_owns_org(organization_id));

DROP POLICY IF EXISTS "devices tenant" ON public.devices;
CREATE POLICY "devices tenant" ON public.devices
FOR ALL TO authenticated
USING (is_super() OR organization_id = current_org() OR public.city_owns_org(organization_id))
WITH CHECK (is_super() OR organization_id = current_org() OR public.city_owns_org(organization_id));

DROP POLICY IF EXISTS "activities tenant read" ON public.activities;
CREATE POLICY "activities tenant read" ON public.activities
FOR SELECT TO authenticated
USING (
  is_super()
  OR ((organization_id = current_org()) AND ((visibility = 'organization') OR (owner_id = auth.uid())))
  OR (public.city_owns_org(organization_id) AND visibility = 'organization')
);
