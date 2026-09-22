ALTER TABLE public.devices
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS app_version text,
  ADD COLUMN IF NOT EXISTS activated_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

ALTER TABLE public.devices
  DROP CONSTRAINT IF EXISTS devices_status_check;
ALTER TABLE public.devices
  ADD CONSTRAINT devices_status_check CHECK (status IN ('pending','active','blocked'));

CREATE UNIQUE INDEX IF NOT EXISTS devices_code_key ON public.devices (code);

UPDATE public.devices SET status = 'active', activated_at = COALESCE(activated_at, created_at)
 WHERE last_sync_at IS NOT NULL AND status = 'pending';

ALTER TABLE public.game_sessions ADD COLUMN IF NOT EXISTS client_uuid uuid;
CREATE UNIQUE INDEX IF NOT EXISTS game_sessions_client_uuid_key ON public.game_sessions (client_uuid) WHERE client_uuid IS NOT NULL;

ALTER TABLE public.game_events ADD COLUMN IF NOT EXISTS client_uuid uuid;
CREATE UNIQUE INDEX IF NOT EXISTS game_events_client_uuid_key ON public.game_events (client_uuid) WHERE client_uuid IS NOT NULL;