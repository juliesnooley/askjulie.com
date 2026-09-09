-- Ask Julie — run this once in the Supabase SQL editor.
-- Reads are public. Writes are impossible for the public key: every insert
-- goes through the `submit` Edge Function, which verifies a Turnstile token
-- first and then writes with the service-role key.

create table if not exists questions (
  id         uuid primary key default gen_random_uuid(),
  body       text not null check (char_length(body) between 5 and 400),
  name       text check (char_length(name) <= 40),
  category   text,
  votes      integer not null default 0,
  status     text not null default 'open' check (status in ('open','answered','hidden')),
  created_at timestamptz not null default now()
);

create table if not exists votes (
  id          bigserial primary key,
  question_id uuid not null references questions(id) on delete cascade,
  voter_hash  text not null,
  created_at  timestamptz not null default now(),
  unique (question_id, voter_hash)
);

create table if not exists prompt_feedback (
  id         bigserial primary key,
  prompt_id  text not null,
  verdict    text not null check (verdict in ('worked','failed')),
  note       text check (char_length(note) <= 600),
  voter_hash text not null,
  created_at timestamptz not null default now(),
  unique (prompt_id, voter_hash)
);

create index if not exists questions_rank on questions (votes desc, created_at desc);

-- Row Level Security ------------------------------------------------------
alter table questions       enable row level security;
alter table votes           enable row level security;
alter table prompt_feedback enable row level security;

-- The public key may READ questions (except ones Julie hides) and feedback.
drop policy if exists questions_public_read on questions;
create policy questions_public_read on questions
  for select using (status <> 'hidden');

drop policy if exists feedback_public_read on prompt_feedback;
create policy feedback_public_read on prompt_feedback
  for select using (true);

-- No insert/update/delete policies anywhere, and none on `votes` at all.
-- With RLS on and no policy, the anon key simply cannot write or read votes.
-- service_role bypasses RLS, which is why only the Edge Function can write.

-- Atomic vote: refuses a second vote from the same voter_hash ------------
create or replace function cast_vote(q uuid, vh text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare new_total integer;
begin
  insert into votes (question_id, voter_hash) values (q, vh)
  on conflict (question_id, voter_hash) do nothing;

  if not found then
    raise exception 'already_voted';
  end if;

  update questions set votes = votes + 1 where id = q returning votes into new_total;
  if new_total is null then
    raise exception 'no_such_question';
  end if;
  return new_total;
end $$;

revoke all on function cast_vote(uuid, text) from public, anon, authenticated;
