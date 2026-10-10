-- The Agent's Ascent — the course in the database, once, with each climber's plan as a layer on top.
-- Run once in Supabase (SQL Editor → New query → paste → Run), then run supabase/course_data.sql to load the
-- content. Re-running this file is safe: it only creates what is missing and replaces the functions.
--
--   course_meta    one row: the course version (goes up whenever the content changes) and where the page lives
--   course_phases  the nine phases: intro (objectives) and outro (phase project, checkpoint, pitfalls)
--   course_camps   the 24 camps: body text, resources and exercises (each with a stable id), ready check, pitfalls,
--                  and changed_in, the course version this camp last changed in
--
-- Everyone can read the course; nobody can write it through the API (no write policies): it changes only here,
-- in the SQL editor, from the generated course_data.sql. A climber's changes live in their own progress rows
-- (kind 'plan', key 'current'; earlier plans under keys starting 'h'), written by the site under their sign-in.
--
--   course_for(uid)       the merged course for one climber as JSON (what the My course page draws)
--   course_md(uid, camp)  the same as plain Markdown for the professor: one link, already merged.
--                         camp is optional: 'm05' or 'm05,m06' for just those camps.
-- Both are read-only, run with the caller's rights, and work with the public key over GET, e.g.
--   /rest/v1/rpc/course_md?uid=<climber id>&apikey=<publishable key>

create table if not exists public.course_meta (
  id         int primary key check (id = 1),
  version    int not null,
  released   date,
  title      text,
  page       text,
  updated_at timestamptz not null default now()
);

create table if not exists public.course_phases (
  id     text primary key,
  pos    int  not null,
  title  text not null,
  timing text,
  land   text,
  weeks  text,
  intro  text,
  outro  text
);

create table if not exists public.course_camps (
  key        text primary key check (key ~ '^m[0-9]{2}$'),
  pos        int  not null,
  phase      text not null,
  title      text not null,
  week_label text,
  week       int,
  hours      numeric,
  video_min  int  not null default 0,
  vids       text,
  core       boolean not null default false,
  capstone   boolean not null default false,
  body       text,
  items      jsonb not null default '[]',
  exercises  jsonb not null default '[]',
  ready      text,
  pitfalls   text,
  changed_in int  not null default 1,
  updated_at timestamptz not null default now()
);

comment on table public.course_camps is 'Agent''s Ascent: the shared course, one row per camp. items[].id and exercises[].id are stable ids a climber''s plan can drop or replace.';

alter table public.course_meta   enable row level security;
alter table public.course_phases enable row level security;
alter table public.course_camps  enable row level security;

drop policy if exists "course is public to read" on public.course_meta;
create policy "course is public to read" on public.course_meta   for select to anon, authenticated using (true);
drop policy if exists "course is public to read" on public.course_phases;
create policy "course is public to read" on public.course_phases for select to anon, authenticated using (true);
drop policy if exists "course is public to read" on public.course_camps;
create policy "course is public to read" on public.course_camps  for select to anon, authenticated using (true);

revoke insert, update, delete, truncate on public.course_meta, public.course_phases, public.course_camps from anon, authenticated;
grant select on public.course_meta, public.course_phases, public.course_camps to anon, authenticated;

-- A JSON value as an array, or an empty array (plans are written by people and AIs; never trust their shape).
create or replace function public.aa_arr(x jsonb)
returns jsonb language sql immutable as $$
  select case when jsonb_typeof(x) = 'array' then x else '[]'::jsonb end
$$;

-- One camp with a climber's layer applied. m = plan.modules[key], side = plan.sideCamps, plan_cv = the course
-- version the plan was made on (null when unknown).
create or replace function public.course_camp_merged(c public.course_camps, m jsonb, side jsonb, plan_cv int)
returns jsonb language sql stable set search_path = public as $$
  with drops as (
    select distinct on (id) id, why from (
      select case jsonb_typeof(d) when 'string' then d #>> '{}' when 'object' then d->>'id' end as id,
             case jsonb_typeof(d) when 'object' then nullif(d->>'why', '') end as why
      from jsonb_array_elements(public.aa_arr(m->'drop')) d) q
    where id is not null
  ),
  pex as (
    select e, o from jsonb_array_elements(public.aa_arr(m->'exercises')) with ordinality t(e, o)
    where jsonb_typeof(e) = 'object' and coalesce(e->>'text', '') <> ''
  ),
  pitems as (
    select x, o from jsonb_array_elements(public.aa_arr(m->'extra')) with ordinality t(x, o)
    where jsonb_typeof(x) = 'object' and coalesce(x->>'title', x->>'url', '') <> ''
  )
  select jsonb_build_object(
    'key', c.key, 'pos', c.pos, 'phase', c.phase, 'title', c.title, 'week_label', c.week_label, 'week', c.week,
    'hours', c.hours, 'video_min', c.video_min, 'vids', c.vids, 'core', c.core, 'capstone', c.capstone,
    'body', c.body, 'ready', c.ready, 'pitfalls', c.pitfalls, 'changed_in', c.changed_in,
    'updated_since_plan', coalesce(plan_cv is not null and c.changed_in > plan_cv, false),
    'depth', coalesce(nullif(m->>'depth', ''), 'core'),
    'note', nullif(m->>'note', ''),
    'ready_add', nullif(m->>'ready', ''),
    'items',
      coalesce((select jsonb_agg(i || jsonb_build_object('source', 'course', 'dropped', d.id is not null)
                                   || case when d.why is not null then jsonb_build_object('drop_why', d.why) else '{}'::jsonb end
                                 order by t.o)
                from jsonb_array_elements(c.items) with ordinality t(i, o) left join drops d on d.id = i->>'id'), '[]'::jsonb)
      || coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
                      'id', c.key || '.p' || o, 'source', 'professor', 'title', coalesce(x->>'title', x->>'url'),
                      'url', case when x->>'url' ~* '^https?://' then x->>'url' end, 'len', nullif(x->>'len', ''),
                      'creator', nullif(x->>'creator', ''), 'why', nullif(x->>'why', ''), 'replaces', nullif(x->>'replaces', ''))) order by o)
                   from pitems), '[]'::jsonb),
    'exercises',
      coalesce((select jsonb_agg(t.e || jsonb_build_object('source', 'course',
                                   'replaced', exists (select 1 from pex where pex.e->>'replaces' = t.e->>'id')) order by t.o)
                from jsonb_array_elements(c.exercises) with ordinality t(e, o)), '[]'::jsonb)
      || coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object('id', c.key || '.px' || o, 'source', 'professor',
                      'text', e->>'text', 'replaces', nullif(e->>'replaces', ''))) order by o) from pex), '[]'::jsonb),
    'side',
      coalesce((select jsonb_agg(s || jsonb_build_object('source', 'professor') order by o)
                from jsonb_array_elements(public.aa_arr(side)) with ordinality t(s, o)
                where jsonb_typeof(s) = 'object' and s->>'after' = c.key), '[]'::jsonb)
  )
$$;

-- The whole course for one climber (uid null = the shared course with no plan).
create or replace function public.course_for(uid uuid default null)
returns jsonb language plpgsql stable security invoker set search_path = public as $$
declare
  pl jsonb; prof jsonb; cv int; meta public.course_meta;
begin
  if uid is not null then
    select data into pl from public.progress where user_id = uid and kind = 'plan' and key = 'current';
    select data into prof from public.progress where user_id = uid and kind = 'profile' and key = 'me';
  end if;
  select * into meta from public.course_meta where id = 1;
  if pl is not null and coalesce(pl->>'courseVersion', '') ~ '^[0-9]+$' then cv := (pl->>'courseVersion')::int; end if;
  return jsonb_build_object(
    'course', jsonb_build_object('version', meta.version, 'released', meta.released, 'title', meta.title, 'page', meta.page),
    'student', case when uid is null then null else jsonb_build_object('id', uid, 'name', prof->>'name', 'goal', prof->>'goal', 'start', prof->>'start') end,
    'plan', case when pl is null then null else jsonb_build_object(
              'version', pl->'version', 'checkpoint', nullif(pl->>'checkpoint', ''), 'summary', nullif(pl->>'summary', ''),
              'updatedAt', pl->>'updatedAt', 'appliedAt', pl->>'appliedAt', 'courseVersion', cv,
              'sideCamps', jsonb_array_length(public.aa_arr(pl->'sideCamps'))) end,
    'phases', coalesce((select jsonb_agg(to_jsonb(p) order by p.pos) from public.course_phases p), '[]'::jsonb),
    'camps', coalesce((select jsonb_agg(public.course_camp_merged(c, pl->'modules'->c.key, pl->'sideCamps', cv) order by c.pos)
                       from public.course_camps c), '[]'::jsonb)
  );
end $$;

-- One resource as a Markdown list item.
create or replace function public.course_md_item(it jsonb)
returns text language sql immutable as $$
  select case
    when it->>'source' = 'professor' then
      '- ★ PROFESSOR [' || (it->>'id') || '] ' || coalesce(it->>'title', '') || coalesce(' — ' || (it->>'creator'), '')
      || coalesce(' · ' || (it->>'len'), '') || coalesce(E'\n  ' || (it->>'url'), '') || coalesce(E'\n  ' || (it->>'why'), '')
      || coalesce(E'\n  (replaces ' || (it->>'replaces') || ')', '')
    when (it->>'dropped')::boolean then
      '- ~~[' || (it->>'id') || '] ' || coalesce(it->>'title', '') || '~~ — dropped for this student' || coalesce(': ' || (it->>'drop_why'), '')
    else
      '- [' || (it->>'id') || '] ' || coalesce(it->>'title', '') || coalesce(' — ' || nullif(it->>'creator', ''), '')
      || coalesce(' · ' || nullif(it->>'len', ''), '') || coalesce(' · ' || nullif(it->>'date', ''), '') || coalesce(' · ' || nullif(it->>'cost', ''), '')
      || coalesce(' [' || nullif(it->>'status', '') || ']', '')
      || coalesce(E'\n  ' || coalesce(nullif(it->>'link', ''), nullif(it->>'url', '')), '') || coalesce(E'\n  ' || nullif(it->>'why', ''), '')
  end
$$;

-- The merged course as Markdown for the professor. camp: null for everything, or 'm05' / 'm05,m06'.
create or replace function public.course_md(uid uuid default null, camp text default null)
returns text language plpgsql stable security invoker set search_path = public as $$
declare
  d jsonb := public.course_for(uid);
  pl jsonb := nullif(d->'plan', 'null'::jsonb);  -- JSON null (no plan) → SQL null
  out text[] := '{}';
  phases jsonb := '{}';
  ph jsonb; c jsonb; it jsonb; ex jsonb; s jsonb;
  started text[] := '{}'; closed text[] := '{}';
  cur text := null; hit int := 0;
  want text[] := case when coalesce(camp, '') = '' then null else string_to_array(replace(lower(camp), ' ', ''), ',') end;
  api text := 'https://ijznfijgzqgedwprulfb.supabase.co/rest/v1/';
  akey text := 'apikey=sb_publishable_jQRHdKBORCh8RmEKmNnWyg_1f9et7W4';
  hrs text;
begin
  for ph in select value from jsonb_array_elements(d->'phases') loop phases := phases || jsonb_build_object(ph->>'id', ph); end loop;

  out := out || ('# The Agent''s Ascent — ' || coalesce(nullif(d->'student'->>'name', '') || '''s course', 'the shared course')
                 || case when want is not null then ' (camps ' || array_to_string(want, ', ') || ')' else '' end);
  out := out || ('Course version ' || coalesce(d->'course'->>'version', '?') || ', released ' || coalesce(d->'course'->>'released', '?')
                 || '. General sections (TL;DR, schedules, toolkit, glossary, sources): ' || coalesce(d->'course'->>'page', ''));
  if uid is not null then
    out := out || ('Student: ' || coalesce(nullif(d->'student'->>'name', ''), 'unnamed') || ' (climber id ' || uid::text || ')'
                   || coalesce('. Started ' || nullif(d->'student'->>'start', ''), '') || coalesce('. End goal: ' || nullif(d->'student'->>'goal', ''), '') || '.'
                   || E'\nTheir rows (camps, check-ins, study sessions, profile, plans): ' || api || 'progress?user_id=eq.' || uid::text || '&select=kind,key,data,updated_at&order=updated_at.desc&' || akey
                   || E'\nTheir test attempts: ' || api || 'quiz_attempts?user_id=eq.' || uid::text || '&select=module,qset,attempt,score,missed,seconds,created_at&order=created_at.desc&' || akey);
  end if;
  if pl is null then
    out := out || 'Plan: none applied yet; this is the course exactly as written.'::text;
  else
    out := out || ('Plan: v' || coalesce(pl->>'version', '?') || coalesce(' · ' || (pl->>'checkpoint'), '')
                   || coalesce(' · applied ' || left(pl->>'appliedAt', 10), coalesce(' · dated ' || left(pl->>'updatedAt', 10), ''))
                   || coalesce(' · made on course v' || (pl->>'courseVersion'), '')
                   || case when (pl->>'sideCamps')::int > 0 then ' · ' || (pl->>'sideCamps') || ' side camp(s)' else '' end
                   || coalesce(E'\nSummary: ' || (pl->>'summary'), ''));
  end if;
  out := out || 'Legend: [id] = course material, the same for every climber and checked when the course was researched. ★ PROFESSOR = added for this student by their professor (not checked by the course). ~~struck~~ = dropped for this student. SIDE CAMP = an extra camp the professor added (no test). A plan refers to things by these ids.'::text;

  for c in select value from jsonb_array_elements(d->'camps') loop
    if want is not null and not ((c->>'key') = any(want)) then continue; end if;
    hit := hit + 1;
    -- Leaving a phase for the first time: its checkpoint (project, ready check, pitfalls).
    if want is null and cur is not null and cur <> (c->>'phase') and not (cur = any(closed)) then
      if coalesce(phases->cur->>'outro', '') <> '' then out := out || ('#### ' || (phases->cur->>'title') || ': phase checkpoint') || (phases->cur->>'outro'); end if;
      closed := closed || cur;
    end if;
    if not ((c->>'phase') = any(started)) then
      ph := phases->(c->>'phase');
      out := out || ('## ' || (ph->>'title') || coalesce(' (' || nullif(ph->>'timing', '') || ')', ''));
      if coalesce(ph->>'intro', '') <> '' then out := out || (ph->>'intro'); end if;
      if want is not null and coalesce(ph->>'outro', '') <> '' then out := out || '#### Phase checkpoint'::text || (ph->>'outro'); end if;
      started := started || (c->>'phase');
    elsif cur is distinct from (c->>'phase') then
      out := out || ('## ' || (phases->(c->>'phase')->>'title') || ' (continued)');
    end if;
    cur := c->>'phase';

    hrs := case when c->>'hours' is null then 'inside m18''s budget' else (c->>'hours') || ' h' end;
    out := out || ('### ' || (c->>'key') || ' · ' || (c->>'title'));
    out := out || (coalesce(c->>'week_label', '') || ' · budget ' || hrs
                   || ' · video ' || case when (c->>'video_min')::int > 0 then '~' || round((c->>'video_min')::numeric / 60, 1) || ' h' else 'none set' end
                   || case when (c->>'core')::boolean then ' · essential spine (can be lightened, never dropped)' else ' · optional (can be skipped if already known)' end
                   || case when (c->>'capstone')::boolean then ' · CAPSTONE' else '' end
                   || ' · depth for this student: ' || upper(c->>'depth'));
    if (c->>'updated_since_plan')::boolean then
      out := out || ('> The course updated this camp (v' || (c->>'changed_in') || ') after this student''s plan was made. Check the plan still fits.');
    end if;
    if c->>'note' is not null then out := out || ('★ PROFESSOR''S NOTE: ' || (c->>'note')); end if;
    if coalesce(c->>'body', '') <> '' then out := out || (c->>'body'); end if;
    if jsonb_array_length(c->'items') > 0 then
      out := out || 'Resources:'::text;
      out := out || (select string_agg(public.course_md_item(value), E'\n' order by ord) from jsonb_array_elements(c->'items') with ordinality t(value, ord));
    end if;
    if jsonb_array_length(c->'exercises') > 0 then
      out := out || 'Exercises:'::text;
      out := out || (select string_agg(
                       case when e->>'source' = 'professor' then '- ★ PROFESSOR [' || (e->>'id') || '] ' || (e->>'text') || coalesce(' (replaces ' || (e->>'replaces') || ')', '')
                            when (e->>'replaced')::boolean then '- ~~[' || (e->>'id') || '] ' || coalesce((e->>'label') || ': ', '') || (e->>'text') || '~~ — replaced for this student'
                            else '- [' || (e->>'id') || '] ' || coalesce((e->>'label') || ': ', '') || (e->>'text') end, E'\n' order by ord)
                     from jsonb_array_elements(c->'exercises') with ordinality t(e, ord));
    end if;
    if coalesce(c->>'ready', '') <> '' then out := out || ('Ready to move on when… ' || (c->>'ready')); end if;
    if c->>'ready_add' is not null then out := out || ('★ PROFESSOR adds to the ready check: ' || (c->>'ready_add')); end if;
    if coalesce(c->>'pitfalls', '') <> '' then out := out || ('Pitfalls: ' || (c->>'pitfalls')); end if;
    for s in select value from jsonb_array_elements(c->'side') loop
      out := out || ('#### SIDE CAMP ' || coalesce(s->>'id', '?') || ' · ' || coalesce(s->>'title', 'untitled') || coalesce(' · ~' || (s->>'hours') || ' h', '')
                     || ' (★ added by the professor; comes after ' || (c->>'key') || '; no test)');
      if coalesce(s->>'note', '') <> '' then out := out || (s->>'note'); end if;
      if jsonb_array_length(public.aa_arr(s->'items')) > 0 then
        out := out || (select string_agg(public.course_md_item(jsonb_strip_nulls(jsonb_build_object('source', 'professor', 'id', (s->>'id') || '.' || ord,
                         'title', value->>'title', 'url', value->>'url', 'len', value->>'len', 'why', value->>'why'))), E'\n' order by ord)
                       from jsonb_array_elements(public.aa_arr(s->'items')) with ordinality t(value, ord) where jsonb_typeof(value) = 'object');
      end if;
      if coalesce(s->>'exercise', '') <> '' then out := out || ('Exercise: ' || (s->>'exercise')); end if;
    end loop;
  end loop;

  if want is null and cur is not null and not (cur = any(closed)) and coalesce(phases->cur->>'outro', '') <> '' then
    out := out || ('#### ' || (phases->cur->>'title') || ': phase checkpoint') || (phases->cur->>'outro');
  end if;
  if hit = 0 then out := out || ('No camp matches "' || coalesce(camp, '') || '". Camps are m00 to m23.'); end if;
  return array_to_string(out, E'\n\n');
end $$;

revoke all on function public.course_camp_merged(public.course_camps, jsonb, jsonb, int) from public;
grant execute on function public.aa_arr(jsonb) to anon, authenticated;
grant execute on function public.course_camp_merged(public.course_camps, jsonb, jsonb, int) to anon, authenticated;
grant execute on function public.course_for(uuid) to anon, authenticated;
grant execute on function public.course_md_item(jsonb) to anon, authenticated;
grant execute on function public.course_md(uuid, text) to anon, authenticated;

-- Plans are kept, not overwritten: the site writes the plan in force as (kind 'plan', key 'current') and every plan
-- ever applied as (kind 'plan', key 'h<timestamp>'). Both are ordinary progress rows, owner-written under RLS.
comment on table public.progress is 'Agent''s Ascent course progress. kind=module → key m00..m23 (or side:<id> for a professor''s side camp); kind=checkin/session → record id; kind=profile → key me; kind=plan → key current (the plan in force) and h<timestamp> (every plan applied, newest last).';
