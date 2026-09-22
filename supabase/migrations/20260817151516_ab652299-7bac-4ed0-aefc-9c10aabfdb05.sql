-- ENUMS
CREATE TYPE public.app_role AS ENUM ('super_admin','org_admin','professional');
CREATE TYPE public.org_type AS ENUM ('escola','clinica','outro');

-- ORGANIZATIONS
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type public.org_type NOT NULL DEFAULT 'escola',
  city text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.current_org()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.is_super()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'super_admin')
$$;

-- profile auto-create
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'org_admin') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- CLASSES
CREATE TABLE public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  age_range text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classes TO authenticated;
GRANT ALL ON public.classes TO service_role;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- STUDENTS
CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  nickname text,
  birth_date date,
  internal_code text,
  avatar jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- GAMES catalog
CREATE TABLE public.games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  main_skill text NOT NULL,
  character_id text,
  available boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.games TO authenticated, anon;
GRANT ALL ON public.games TO service_role;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "games are readable by everyone" ON public.games FOR SELECT TO anon, authenticated USING (true);

-- GAME SESSIONS
CREATE TABLE public.game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  game_slug text NOT NULL,
  skill text,
  level int NOT NULL DEFAULT 1,
  score int NOT NULL DEFAULT 0,
  hits int NOT NULL DEFAULT 0,
  misses int NOT NULL DEFAULT 0,
  duration_seconds int NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT true,
  device_code text,
  played_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_sessions TO authenticated;
GRANT ALL ON public.game_sessions TO service_role;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

-- DEVICES
CREATE TABLE public.devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  code text NOT NULL UNIQUE,
  label text,
  last_sync_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.devices TO authenticated;
GRANT ALL ON public.devices TO service_role;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_super() OR organization_id = public.current_org());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "roles readable by owner or super" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_super());

CREATE POLICY "orgs visible" ON public.organizations FOR SELECT TO authenticated
  USING (public.is_super() OR id = public.current_org());
CREATE POLICY "orgs insert" ON public.organizations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "orgs update" ON public.organizations FOR UPDATE TO authenticated
  USING (public.is_super() OR id = public.current_org())
  WITH CHECK (public.is_super() OR id = public.current_org());

CREATE POLICY "classes tenant" ON public.classes FOR ALL TO authenticated
  USING (public.is_super() OR organization_id = public.current_org())
  WITH CHECK (public.is_super() OR organization_id = public.current_org());

CREATE POLICY "students tenant" ON public.students FOR ALL TO authenticated
  USING (public.is_super() OR organization_id = public.current_org())
  WITH CHECK (public.is_super() OR organization_id = public.current_org());

CREATE POLICY "sessions tenant" ON public.game_sessions FOR ALL TO authenticated
  USING (public.is_super() OR organization_id = public.current_org())
  WITH CHECK (public.is_super() OR organization_id = public.current_org());

CREATE POLICY "devices tenant" ON public.devices FOR ALL TO authenticated
  USING (public.is_super() OR organization_id = public.current_org())
  WITH CHECK (public.is_super() OR organization_id = public.current_org());

-- SEED GAMES (15 do PRD, 3 disponíveis)
INSERT INTO public.games (slug, title, description, main_skill, character_id, available, sort_order) VALUES
('memoria-turma','Memória da Turma','Encontre os pares dos amigos do Zeno.','memória','rafael',true,1),
('cores-em-acao','Cores em Ação','Toque na cor certa antes do tempo acabar.','atenção','beni',true,2),
('formas-e-encaixes','Formas e Encaixes','Leve cada forma até o lugar certo.','coordenação','jessica',true,3),
('organize-a-historia','Organize a História','Coloque as cenas na ordem certa.','sequência','brenda',false,4),
('complete-o-desenho','Complete o Desenho','Descubra a parte que falta.','percepção','brenda',false,5),
('sons-e-ritmos','Sons e Ritmos','Repita a sequência de sons.','atenção','beni',false,6),
('caca-as-diferencas','Caça às Diferenças','Encontre o que mudou na cena.','observação','rafael',false,7),
('quebra-cabeca','Quebra-Cabeça do Zeno','Monte a imagem peça por peça.','raciocínio','rafael',false,8),
('siga-o-caminho','Siga o Caminho','Guie o Zeno até o objetivo.','planejamento','zeno',false,9),
('emocoes-da-turma','Emoções da Turma','Reconheça como os amigos estão se sentindo.','emoções','jessica',false,10),
('conte-e-construa','Conte e Construa','Contagem e quantidades com blocos.','matemática','bernardo',false,11),
('palavras-e-sons','Palavras e Sons','Associe letras, sons e imagens.','linguagem','brenda',false,12),
('classifique','Classifique','Agrupe os objetos por categoria.','classificação','bernardo',false,13),
('desafio-do-zeno','Desafio do Zeno','Um desafio com várias habilidades.','geral','zeno',false,14),
('aventura-final','Aventura Final','A grande aventura da turma.','geral','zeno',false,15);