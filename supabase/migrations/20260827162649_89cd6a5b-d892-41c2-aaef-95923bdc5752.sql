
-- profiles: city admins can read profiles of their municipality
DROP POLICY IF EXISTS "own profile read" ON public.profiles;
CREATE POLICY "own profile read" ON public.profiles
FOR SELECT TO authenticated
USING (
  id = auth.uid()
  OR public.is_super()
  OR (organization_id IS NOT NULL AND organization_id = public.current_org())
  OR public.city_scope(municipality_id)
  OR public.city_owns_org(organization_id)
);

-- super/city admins can move a user into an organization/municipality
CREATE POLICY "admins update member profiles" ON public.profiles
FOR UPDATE TO authenticated
USING (public.is_super() OR public.city_owns_org(organization_id) OR public.city_scope(municipality_id))
WITH CHECK (public.is_super() OR public.city_owns_org(organization_id) OR public.city_scope(municipality_id));

-- user_roles management
CREATE POLICY "admins read roles" ON public.user_roles
FOR SELECT TO authenticated
USING (
  public.is_super()
  OR EXISTS (
    SELECT 1 FROM public.profiles p
     WHERE p.id = user_roles.user_id
       AND (public.city_owns_org(p.organization_id) OR public.city_scope(p.municipality_id))
  )
);

CREATE POLICY "admins grant roles" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (
  public.is_super()
  OR (
    role IN ('org_admin','professional')
    AND EXISTS (
      SELECT 1 FROM public.profiles p
       WHERE p.id = user_roles.user_id
         AND (public.city_owns_org(p.organization_id) OR public.city_scope(p.municipality_id))
    )
  )
);

CREATE POLICY "admins revoke roles" ON public.user_roles
FOR DELETE TO authenticated
USING (
  public.is_super()
  OR (
    role IN ('org_admin','professional')
    AND EXISTS (
      SELECT 1 FROM public.profiles p
       WHERE p.id = user_roles.user_id
         AND (public.city_owns_org(p.organization_id) OR public.city_scope(p.municipality_id))
    )
  )
);

GRANT INSERT, DELETE ON public.user_roles TO authenticated;

-- organizations: city admin can create orgs inside its municipality
DROP POLICY IF EXISTS "orgs insert" ON public.organizations;
CREATE POLICY "orgs insert" ON public.organizations
FOR INSERT TO authenticated
WITH CHECK (
  public.is_super()
  OR municipality_id IS NULL
  OR public.city_scope(municipality_id)
);
