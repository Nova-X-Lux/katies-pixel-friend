create table if not exists public.pet_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null,
  schema_version integer not null default 1 check (schema_version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pet_saves enable row level security;

revoke all on table public.pet_saves from anon, authenticated;
grant select, insert, update, delete on table public.pet_saves to authenticated;

create policy "Users can read their own pet save"
on public.pet_saves
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can create their own pet save"
on public.pet_saves
for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can update their own pet save"
on public.pet_saves
for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Users can delete their own pet save"
on public.pet_saves
for delete
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
