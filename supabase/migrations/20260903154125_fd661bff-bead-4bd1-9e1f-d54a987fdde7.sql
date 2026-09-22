CREATE TABLE IF NOT EXISTS public.login_aliases (
  username text PRIMARY KEY,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.login_aliases TO service_role;

ALTER TABLE public.login_aliases ENABLE ROW LEVEL SECURITY;

INSERT INTO public.login_aliases (username, email)
VALUES ('mundozeno*', 'mundozeno@mundozeno.app')
ON CONFLICT (username) DO UPDATE SET email = EXCLUDED.email;

INSERT INTO public.user_roles (user_id, role)
VALUES ('4d108bc5-7e13-4135-bce8-df82c78df80c', 'super_admin')
ON CONFLICT DO NOTHING;