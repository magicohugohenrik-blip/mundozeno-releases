-- Fase 14: reforço de segurança

-- 1) Atividades: impedir troca de dono
DROP POLICY IF EXISTS "activities update own" ON public.activities;
CREATE POLICY "activities update own" ON public.activities
FOR UPDATE TO authenticated
USING (is_super() OR (organization_id = current_org() AND owner_id = auth.uid()))
WITH CHECK (is_super() OR (organization_id = current_org() AND owner_id = auth.uid()));

-- 2) Perfis: usuário não pode se mudar de município/escola nem de si mesmo escalar tenant
CREATE OR REPLACE FUNCTION public.guard_profile_tenant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_super() THEN RETURN NEW; END IF;
  IF NEW.organization_id IS DISTINCT FROM OLD.organization_id
     OR NEW.municipality_id IS DISTINCT FROM OLD.municipality_id THEN
    IF NOT (public.is_city_admin()
            OR public.has_role(auth.uid(), 'org_admin')) THEN
      RAISE EXCEPTION 'Alteração de vínculo não permitida';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_profile_tenant ON public.profiles;
CREATE TRIGGER guard_profile_tenant
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profile_tenant();

-- 3) Instituições: apenas administradores podem editar
DROP POLICY IF EXISTS "orgs update" ON public.organizations;
CREATE POLICY "orgs update" ON public.organizations
FOR UPDATE TO authenticated
USING (is_super() OR city_scope(municipality_id) OR (id = current_org() AND has_role(auth.uid(), 'org_admin')))
WITH CHECK (is_super() OR city_scope(municipality_id) OR (id = current_org() AND has_role(auth.uid(), 'org_admin')));