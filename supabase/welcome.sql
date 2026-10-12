-- The Agent's Ascent — one welcome email per climber. Run in the Supabase SQL editor.
--
-- The welcome Edge Function (supabase/functions/welcome) calls claim_welcome() with the climber's own sign-in
-- token: it returns true only the first time for that climber, so the email goes out once. If sending fails, the
-- function calls release_welcome() so the next sign-in tries again. The table can't be read through the API.

create table if not exists public.welcome_emails (
  user_id uuid primary key references auth.users (id) on delete cascade,
  sent_at timestamptz not null default now()
);
alter table public.welcome_emails enable row level security;   -- no policies: unreadable through the API
revoke all on public.welcome_emails from anon, authenticated;

create or replace function public.claim_welcome() returns boolean
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); n int;
begin
  if uid is null then return false; end if;
  insert into public.welcome_emails (user_id) values (uid) on conflict (user_id) do nothing;
  get diagnostics n = row_count;
  return n = 1;
end $$;

create or replace function public.release_welcome() returns void
language sql security definer set search_path = public as $$
  delete from public.welcome_emails where user_id = auth.uid() and sent_at > now() - interval '5 minutes';
$$;

revoke all on function public.claim_welcome() from public, anon;
revoke all on function public.release_welcome() from public, anon;
grant execute on function public.claim_welcome() to authenticated;
grant execute on function public.release_welcome() to authenticated;
