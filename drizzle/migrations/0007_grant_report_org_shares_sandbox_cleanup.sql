-- Remove o link de teste criado durante a validação e mantém as permissões da tabela.
UPDATE public.report_org_shares SET revoked = true WHERE token = 'testeorgtoken123456';
