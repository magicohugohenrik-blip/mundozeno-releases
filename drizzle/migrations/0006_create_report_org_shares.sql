-- Acesso unificado pelo celular: um QR Code para a mesa inteira (turmas, crianças, relatórios e gráficos).
CREATE TABLE public.report_org_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  organization_id UUID NOT NULL,
  created_by UUID,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.report_org_shares TO authenticated;
GRANT ALL ON public.report_org_shares TO service_role;

ALTER TABLE public.report_org_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Equipe da instituicao gerencia seus links"
ON public.report_org_shares
FOR ALL
TO authenticated
USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE INDEX report_org_shares_token_idx ON public.report_org_shares (token);
