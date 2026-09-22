alter table public.organizations add column if not exists join_code text;

update public.organizations
set join_code = upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 8))
where join_code is null;

alter table public.organizations alter column join_code set not null;
alter table public.organizations alter column join_code set default upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 8));

create unique index if not exists organizations_join_code_key on public.organizations (join_code);