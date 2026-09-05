create table if not exists public.username_pet_saves (
  username text primary key
    check (username = lower(username))
    check (username ~ '^[a-z0-9_-]{1,24}$'),
  state jsonb not null,
  schema_version integer not null default 1 check (schema_version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.username_pet_saves enable row level security;

revoke all on table public.username_pet_saves from anon, authenticated;
grant select, insert, update, delete on table public.username_pet_saves to anon, authenticated;

drop policy if exists "Anyone can read a username save" on public.username_pet_saves;
create policy "Anyone can read a username save"
on public.username_pet_saves
for select
to anon, authenticated
using (true);

drop policy if exists "Anyone can create a username save" on public.username_pet_saves;
create policy "Anyone can create a username save"
on public.username_pet_saves
for insert
to anon, authenticated
with check (true);

drop policy if exists "Anyone can update a username save" on public.username_pet_saves;
create policy "Anyone can update a username save"
on public.username_pet_saves
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Anyone can delete a username save" on public.username_pet_saves;
create policy "Anyone can delete a username save"
on public.username_pet_saves
for delete
to anon, authenticated
using (true);

-- Preserve existing username/password saves while moving to username-only access.
-- The original authenticated table is intentionally left untouched as a backup.
insert into public.username_pet_saves (
  username,
  state,
  schema_version,
  created_at,
  updated_at
)
select
  lower(split_part(users.email, '@', 1)),
  saves.state,
  saves.schema_version,
  saves.created_at,
  saves.updated_at
from public.pet_saves as saves
join auth.users as users on users.id = saves.user_id
where lower(split_part(users.email, '@', 2)) = 'pixel-friend.example'
  and lower(split_part(users.email, '@', 1)) ~ '^[a-z0-9_-]{1,24}$'
on conflict (username) do update
set
  state = excluded.state,
  schema_version = excluded.schema_version,
  updated_at = excluded.updated_at;

-- Katie should meet and name her companion herself on her first username-only visit.
-- Her original authenticated save remains untouched in public.pet_saves as a backup.
delete from public.username_pet_saves
where username = 'katie';
