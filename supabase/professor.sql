-- The Agent's Ascent — the professor connector's side of the database.
-- Run once in Supabase (SQL Editor → New query → paste → Run). Safe to re-run.
--
-- A climber creates a professor key on My profile (signed in). The key goes into their professor's connector
-- link. Holding the key lets the professor do exactly two things for that one climber:
--   * see who it is teaching (professor_whoami) and the status of plans it sent (professor_proposals);
--   * send a plan (professor_propose). A sent plan waits in plan_proposals until the climber applies or
--     declines it on the Ascent page. Nothing a professor sends changes the course by itself.
-- Keys are long random strings; only their owner can read theirs back; making a new one retires the old.

create table if not exists public.professor_keys (
  user_id    uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  key        text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.plan_proposals (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  plan       jsonb not null,
  message    text,
  status     text not null default 'pending' check (status in ('pending', 'applied', 'declined', 'superseded')),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create index if not exists plan_proposals_user_status on public.plan_proposals (user_id, status, created_at desc);

comment on table public.plan_proposals is 'Agent''s Ascent: plans a professor sent through the connector. pending until the climber applies or declines it on the Ascent page; a newer plan supersedes an older pending one.';

alter table public.professor_keys enable row level security;
alter table public.plan_proposals enable row level security;

-- Owners read their own key (to show the connector link again) and their own proposals, and record their decision.
drop policy if exists "owner reads own key" on public.professor_keys;
create policy "owner reads own key" on public.professor_keys for select to authenticated using (auth.uid() = user_id);
drop policy if exists "owner reads own proposals" on public.plan_proposals;
create policy "owner reads own proposals" on public.plan_proposals for select to authenticated using (auth.uid() = user_id);
drop policy if exists "owner decides own proposals" on public.plan_proposals;
create policy "owner decides own proposals" on public.plan_proposals for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

revoke all on public.professor_keys from anon;
revoke insert, update, delete, truncate on public.professor_keys from authenticated;
grant select on public.professor_keys to authenticated;
revoke all on public.plan_proposals from anon;
revoke insert, update, delete, truncate on public.plan_proposals from authenticated;
grant select, update (status, decided_at) on public.plan_proposals to authenticated;

-- Make (or remake) the signed-in climber's key. Returns it; the old key stops working at once.
create or replace function public.create_professor_key()
returns text language plpgsql security definer set search_path = public as $$
declare k text;
begin
  if auth.uid() is null then raise exception 'Sign in first.'; end if;
  k := 'aap_' || replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  insert into public.professor_keys (user_id, key) values (auth.uid(), k)
    on conflict (user_id) do update set key = excluded.key, created_at = now();
  return k;
end $$;

-- Turn the connector off: delete the key.
create or replace function public.delete_professor_key()
returns void language sql security definer set search_path = public as $$
  delete from public.professor_keys where user_id = auth.uid();
$$;

-- Which climber a key belongs to (null for an unknown key).
create or replace function public.professor_whoami(p_key text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('user_id', k.user_id, 'name', p.data->>'name')
  from public.professor_keys k
  left join public.progress p on p.user_id = k.user_id and p.kind = 'profile' and p.key = 'me'
  where length(coalesce(p_key, '')) >= 40 and k.key = p_key
$$;

-- Send a plan. The connector checks it against the course first; the site checks it again before it applies.
create or replace function public.professor_propose(p_key text, p_plan jsonb, p_message text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid; n int; new_id bigint;
begin
  select user_id into uid from public.professor_keys where length(coalesce(p_key, '')) >= 40 and key = p_key;
  if uid is null then raise exception 'This connector link is not valid any more. Make a new one on My profile.'; end if;
  if jsonb_typeof(p_plan) is distinct from 'object' or length(p_plan::text) > 40000 then
    raise exception 'A plan must be one JSON object, under 40 KB.';
  end if;
  select count(*) into n from public.plan_proposals where user_id = uid and created_at > now() - interval '1 day';
  if n >= 30 then raise exception 'That is 30 plans in a day; wait before sending another.'; end if;
  update public.plan_proposals set status = 'superseded', decided_at = now() where user_id = uid and status = 'pending';
  insert into public.plan_proposals (user_id, plan, message) values (uid, p_plan, left(nullif(trim(p_message), ''), 1000))
    returning id into new_id;
  return jsonb_build_object('id', new_id, 'status', 'pending');
end $$;

-- The last ten plans this professor sent, and what happened to each.
create or replace function public.professor_proposals(p_key text)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'status', status, 'sent', created_at, 'decided', decided_at,
                                               'checkpoint', plan->>'checkpoint', 'summary', plan->>'summary') order by created_at desc), '[]'::jsonb)
  from (select * from public.plan_proposals
        where user_id = (select user_id from public.professor_keys where length(coalesce(p_key, '')) >= 40 and key = p_key)
        order by created_at desc limit 10) q
$$;

revoke all on function public.create_professor_key() from public, anon;
revoke all on function public.delete_professor_key() from public, anon;
grant execute on function public.create_professor_key() to authenticated;
grant execute on function public.delete_professor_key() to authenticated;
revoke all on function public.professor_whoami(text) from public;
revoke all on function public.professor_propose(text, jsonb, text) from public;
revoke all on function public.professor_proposals(text) from public;
grant execute on function public.professor_whoami(text) to anon, authenticated;
grant execute on function public.professor_propose(text, jsonb, text) to anon, authenticated;
grant execute on function public.professor_proposals(text) to anon, authenticated;
