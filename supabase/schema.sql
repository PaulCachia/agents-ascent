-- The Agent's Ascent — progress store.
-- Run this once in Supabase: SQL Editor → New query → paste → Run.
-- One table holds every record (module status, check-in, study session) as JSON,
-- keyed by the signed-in user, the record kind and the record's own key.

create table if not exists public.progress (
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  kind       text        not null check (kind in ('module', 'checkin', 'session')),
  key        text        not null,
  data       jsonb       not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, kind, key)
);

comment on table public.progress is 'Agent''s Ascent course progress. kind=module → key is the module id (m00..m23); kind=checkin/session → key is the record id.';

-- Keep updated_at honest.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists progress_set_updated_at on public.progress;
create trigger progress_set_updated_at
  before update on public.progress
  for each row execute function public.set_updated_at();

-- Row-Level Security: ON for every table, always.
alter table public.progress enable row level security;

-- The signed-in owner can do anything with their own rows, and nothing with anyone else's.
drop policy if exists "owner full access" on public.progress;
create policy "owner full access" on public.progress
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Read-only access with the public (anon) key, so Claude can read progress
-- without holding a secret. This exposes module statuses, notes, check-ins and
-- session notes to anyone who has the project URL and anon key. If you'd rather
-- keep them private, drop this policy and give Claude the service_role key instead.
drop policy if exists "public read" on public.progress;
create policy "public read" on public.progress
  for select to anon
  using (true);

-- A compact view Claude can read in one call.
create or replace view public.progress_overview as
select
  kind,
  count(*)                                                    as records,
  count(*) filter (where kind = 'module' and data->>'status' = 'done') as modules_passed,
  count(*) filter (where kind = 'module' and data->>'status' = 'skip') as modules_skipped,
  coalesce(sum((data->>'mins')::numeric) filter (where kind = 'session'), 0) / 60 as hours_on_clock,
  max(updated_at)                                             as last_change
from public.progress
group by kind;

grant select on public.progress_overview to anon, authenticated;
