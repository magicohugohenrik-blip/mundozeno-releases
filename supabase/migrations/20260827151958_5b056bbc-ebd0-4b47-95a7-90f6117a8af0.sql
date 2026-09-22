-- ============ FASE 1: MULTI-MUNICÍPIO ============

CREATE TABLE public.municipalities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  state text,
  code text NOT NULL DEFAULT upper(substr(encode(extensions.gen_random_bytes(4),'hex'),1,8)),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX municipalities_code_key ON public.municipalities (code);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.municipalities TO authenticated;
GRANT ALL ON public.municipalities TO service_role;
ALTER TABLE public.municipalities ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_municipalities_updated_at
BEFORE UPDATE ON public.municipalities
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- novo papel
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'city_admin';

-- vínculos
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS municipality_id uuid REFERENCES public.municipalities(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS municipality_id uuid REFERENCES public.municipalities(id) ON DELETE SET NULL;

-- município de migração para instituições já existentes
DO $$
DECLARE mig uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM public.organizations WHERE municipality_id IS NULL) THEN
    INSERT INTO public.municipalities (name, state, code)
    VALUES ('Migração', NULL, 'MIGRACAO')
    ON CONFLICT (code) DO NOTHING;
    SELECT id INTO mig FROM public.municipalities WHERE code = 'MIGRACAO';
    UPDATE public.organizations SET municipality_id = mig WHERE municipality_id IS NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS organizations_municipality_idx ON public.organizations (municipality_id);
