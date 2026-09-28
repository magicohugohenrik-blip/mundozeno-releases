-- Cada conta de mesa deve estar vinculada exclusivamente à instituição da sua mesa.
ALTER TABLE public.profiles DISABLE TRIGGER USER;

UPDATE public.profiles p
SET organization_id = d.organization_id,
    municipality_id = NULL
FROM public.devices d
WHERE d.auth_user_id = p.id
  AND (p.organization_id IS DISTINCT FROM d.organization_id OR p.municipality_id IS NOT NULL);

ALTER TABLE public.profiles ENABLE TRIGGER USER;