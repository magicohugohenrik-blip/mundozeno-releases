CREATE TABLE public.magic_shares (
  token text PRIMARY KEY,
  creation_id uuid NOT NULL REFERENCES public.magic_creations(id) ON DELETE CASCADE,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.magic_shares TO authenticated;
GRANT ALL ON public.magic_shares TO service_role;
ALTER TABLE public.magic_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own shares readable" ON public.magic_shares FOR SELECT TO authenticated USING (created_by = auth.uid());