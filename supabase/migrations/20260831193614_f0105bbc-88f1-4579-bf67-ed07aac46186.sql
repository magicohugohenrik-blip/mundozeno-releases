drop index if exists public.game_sessions_client_uuid_key;
drop index if exists public.game_events_client_uuid_key;
alter table public.game_sessions add constraint game_sessions_client_uuid_key unique (client_uuid);
alter table public.game_events add constraint game_events_client_uuid_key unique (client_uuid);