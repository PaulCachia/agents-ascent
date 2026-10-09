-- The Agent's Ascent — on-site quizzes. Run in the Supabase SQL editor after schema.sql.
--
-- Neither the questions nor the answer key can be read through the API: only the two SECURITY DEFINER
-- functions below touch them, so a climber only ever sees the 8 questions of the quiz they are sitting. A quiz is a server-issued session
-- (8 random questions, time-limited); grading happens on the server and writes the score to the climber's
-- module row itself. Rules: practice is unlimited and never posted; the test posts its latest score, a
-- retake opens 24 h after a fail (72 h after two fails: see your professor), and passing (>= 70 %) closes it.

create table if not exists public.quiz_questions (
  id      text primary key,                      -- e.g. m00-t03 (test) / m00-p03 (practice)
  module  text not null,                         -- m00 .. m23
  qset    text not null check (qset in ('test', 'practice')),
  prompt  text not null,
  options jsonb not null,                        -- array of 4 strings, in authoring order
  topic   text not null default '',              -- shown when a question is missed
  active  boolean not null default true
);
create index if not exists quiz_questions_module_set on public.quiz_questions (module, qset);
alter table public.quiz_questions enable row level security;
revoke all on public.quiz_questions from anon, authenticated;     -- no policies: unreadable through the API

create table if not exists public.quiz_answers (
  id          text primary key references public.quiz_questions (id) on delete cascade,
  correct     int  not null,                     -- index into options
  explanation text not null default ''
);
alter table public.quiz_answers enable row level security;
revoke all on public.quiz_answers from anon, authenticated;   -- no policies: unreadable through the API

create table if not exists public.quiz_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  module       text not null,
  qset         text not null,
  question_ids jsonb not null,
  started_at   timestamptz not null default now(),
  graded       boolean not null default false
);
alter table public.quiz_sessions enable row level security;
revoke all on public.quiz_sessions from anon, authenticated;

create table if not exists public.quiz_attempts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  module     text not null,
  qset       text not null,
  attempt    int  not null,
  score      int  not null,                      -- percent
  n          int  not null,
  correct_n  int  not null,
  missed     jsonb not null default '[]',        -- topics missed
  seconds    int  not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists quiz_attempts_user_module on public.quiz_attempts (user_id, module, qset, created_at desc);
alter table public.quiz_attempts enable row level security;
drop policy if exists "attempts public read" on public.quiz_attempts;
create policy "attempts public read" on public.quiz_attempts for select to anon, authenticated using (true);
grant select on public.quiz_attempts to anon, authenticated;

-- Start a quiz: returns 8 random questions (no answers) and a session id. Enforces the test rules.
create or replace function public.start_quiz(p_module text, p_qset text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  last_t record; open_s record; qs jsonb; sid uuid; tries int := 0; passed boolean := false; per_q int := 90;
begin
  if uid is null then return jsonb_build_object('error', 'sign_in'); end if;
  if p_qset not in ('test', 'practice') then return jsonb_build_object('error', 'bad_set'); end if;

  -- A test session still within its time window can be resumed (a reload should not cost an attempt).
  select * into open_s from quiz_sessions where user_id = uid and module = p_module and qset = p_qset and not graded order by started_at desc limit 1;
  if found then
    if now() < open_s.started_at + make_interval(secs => jsonb_array_length(open_s.question_ids) * per_q) then
      select jsonb_agg(jsonb_build_object('id', q.id, 'prompt', q.prompt, 'options', q.options, 'topic', q.topic) order by ord.i) into qs
        from jsonb_array_elements_text(open_s.question_ids) with ordinality as ord(id, i) join quiz_questions q on q.id = ord.id;
      select count(*) into tries from quiz_attempts where user_id = uid and module = p_module and qset = p_qset;
      return jsonb_build_object('session', open_s.id, 'questions', qs, 'seconds_per_question', per_q, 'attempt', tries + 1,
        'resumed', true, 'remaining', greatest(0, extract(epoch from (open_s.started_at + make_interval(secs => jsonb_array_length(open_s.question_ids) * per_q) - now()))::int));
    end if;
    -- An expired, ungraded test session counts as a failed attempt (abandoning a test is not free).
    update quiz_sessions set graded = true where id = open_s.id;
    if p_qset = 'test' then
      select count(*) + 1 into tries from quiz_attempts where user_id = uid and module = p_module and qset = 'test';
      insert into quiz_attempts (user_id, module, qset, attempt, score, n, correct_n, missed, seconds)
        values (uid, p_module, 'test', tries, 0, jsonb_array_length(open_s.question_ids), 0, '["abandoned test"]', 0);
    end if;
  end if;

  select count(*) into tries from quiz_attempts where user_id = uid and module = p_module and qset = p_qset;
  if p_qset = 'test' then
    select exists (select 1 from quiz_attempts where user_id = uid and module = p_module and qset = 'test' and score >= 70) into passed;
    if passed then return jsonb_build_object('error', 'passed'); end if;
    select * into last_t from quiz_attempts where user_id = uid and module = p_module and qset = 'test' order by created_at desc limit 1;
    if found then
      if tries >= 2 and now() < last_t.created_at + interval '72 hours' then
        return jsonb_build_object('error', 'professor', 'next_at', last_t.created_at + interval '72 hours', 'attempts', tries);
      end if;
      if now() < last_t.created_at + interval '24 hours' then
        return jsonb_build_object('error', 'cooloff', 'next_at', last_t.created_at + interval '24 hours', 'attempts', tries);
      end if;
    end if;
  end if;

  select jsonb_agg(jsonb_build_object('id', id, 'prompt', prompt, 'options', options, 'topic', topic)) into qs
    from (select id, prompt, options, topic from quiz_questions where module = p_module and qset = p_qset and active order by random() limit 8) q;
  if qs is null then return jsonb_build_object('error', 'no_questions'); end if;
  insert into quiz_sessions (user_id, module, qset, question_ids)
    values (uid, p_module, p_qset, (select jsonb_agg(x -> 'id') from jsonb_array_elements(qs) x)) returning id into sid;
  return jsonb_build_object('session', sid, 'questions', qs, 'seconds_per_question', per_q, 'attempt', tries + 1, 'resumed', false);
end $$;

-- Grade a session. p_answers = array of chosen option indexes (authoring order), null for unanswered.
create or replace function public.grade_quiz(p_session uuid, p_answers jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid(); s record; n int; c int := 0; i int; qid text; given int; a record;
  missed jsonb := '[]'; review jsonb := '[]'; secs int; score int; att int; passed boolean := false; today text := to_char(now(), 'YYYY-MM-DD');
begin
  if uid is null then return jsonb_build_object('error', 'sign_in'); end if;
  select * into s from quiz_sessions where id = p_session and user_id = uid;
  if not found then return jsonb_build_object('error', 'no_session'); end if;
  if s.graded then return jsonb_build_object('error', 'already_graded'); end if;
  update quiz_sessions set graded = true where id = s.id;
  n := jsonb_array_length(s.question_ids);
  secs := extract(epoch from (now() - s.started_at))::int;

  for i in 0 .. n - 1 loop
    qid := s.question_ids ->> i;
    begin given := nullif(p_answers ->> i, '')::int; exception when others then given := null; end;
    select qa.correct, qa.explanation, qq.topic, qq.prompt into a from quiz_answers qa join quiz_questions qq on qq.id = qa.id where qa.id = qid;
    if given is not null and given = a.correct then c := c + 1; else missed := missed || to_jsonb(a.topic); end if;
    if s.qset = 'practice' then
      review := review || jsonb_build_object('id', qid, 'prompt', a.prompt, 'correct', a.correct, 'given', given, 'explanation', a.explanation);
    end if;
  end loop;

  if secs > n * 90 + 60 then score := 0; missed := '["time limit exceeded"]'::jsonb; else score := round(100.0 * c / n); end if;
  select count(*) + 1 into att from quiz_attempts where user_id = uid and module = s.module and qset = s.qset;
  insert into quiz_attempts (user_id, module, qset, attempt, score, n, correct_n, missed, seconds)
    values (uid, s.module, s.qset, att, score, n, c, missed, secs);

  if s.qset = 'test' then
    passed := score >= 70;
    insert into progress (user_id, kind, key, data)
      values (uid, 'module', s.module, jsonb_build_object('status', case when passed then 'done' else 'doing' end, 'quiz', score, 'quizAttempt', att, 'quizAt', today,
                                                         'date', case when passed then today else null end, 'notes', ''))
      on conflict (user_id, kind, key) do update
        set data = progress.data
          || jsonb_build_object('quiz', score, 'quizAttempt', att, 'quizAt', today)
          || case when passed and coalesce(progress.data ->> 'status', 'todo') not in ('done', 'skip') then jsonb_build_object('status', 'done', 'date', today) else '{}'::jsonb end
          || case when not passed and coalesce(progress.data ->> 'status', 'todo') = 'todo' then '{"status": "doing"}'::jsonb else '{}'::jsonb end;
  end if;

  return jsonb_build_object('module', s.module, 'set', s.qset, 'score', score, 'correct', c, 'n', n, 'passed', (s.qset = 'test' and passed),
                            'attempt', att, 'missed', missed, 'review', review, 'seconds', secs);
end $$;

revoke all on function public.start_quiz(text, text) from public, anon;
revoke all on function public.grade_quiz(uuid, jsonb) from public, anon;
grant execute on function public.start_quiz(text, text) to authenticated;
grant execute on function public.grade_quiz(uuid, jsonb) to authenticated;

-- Question bank: insert rows into quiz_questions (public) and quiz_answers (private). The bank is not in this
-- repository because it carries the answer key; the course owner keeps it and loads it through the SQL editor.
