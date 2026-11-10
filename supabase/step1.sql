-- PreCog: server-side draw. The browser never sees the targets until all guesses are in.

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(trim(name)) between 1 and 40),
  player uuid,
  n smallint not null,
  targets text not null,
  salt text not null,
  seal text not null,
  finished_at timestamptz
);
-- Private: RLS on with no policies, and no grants to the public roles.
alter table public.sessions enable row level security;
revoke all on public.sessions from anon, authenticated;

-- Draw a sealed round. Returns only the session id, length and fingerprint.
create or replace function public.start_round(p_name text, p_player uuid default null)
returns table (session_id uuid, n int, seal text)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_n int := 7;
  v_bytes bytea := extensions.gen_random_bytes(v_n);
  v_targets text := '';
  v_salt text := encode(extensions.gen_random_bytes(6), 'hex');
  v_seal text;
  v_id uuid;
begin
  if p_name is null or char_length(trim(p_name)) not between 1 and 40 then
    raise exception 'name must be 1 to 40 characters';
  end if;
  -- 256 is divisible by 4, so byte % 4 is perfectly uniform.
  for i in 0..v_n - 1 loop
    v_targets := v_targets || substr('SCTD', (get_byte(v_bytes, i) % 4) + 1, 1);
  end loop;
  v_seal := encode(extensions.digest(v_salt || ':' || v_targets, 'sha256'), 'hex');
  insert into public.sessions (name, player, n, targets, salt, seal)
  values (trim(p_name), p_player, v_n, v_targets, v_salt, v_seal)
  returning id into v_id;
  return query select v_id, v_n, v_seal;
end $$;

-- Lock in all guesses at once, log the round, then reveal the answers.
create or replace function public.submit_round(p_session uuid, p_guesses text)
returns table (targets text, salt text, seal text, hits int, n int, pct numeric)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare s public.sessions%rowtype; r public.rounds%rowtype;
begin
  select * into s from public.sessions where id = p_session for update;
  if not found then raise exception 'unknown round'; end if;
  if s.finished_at is not null then raise exception 'round already submitted'; end if;
  if s.created_at < now() - interval '3 hours' then raise exception 'round expired'; end if;
  if p_guesses !~ '^[SCTD]+$' or char_length(p_guesses) <> s.n then
    raise exception 'guesses must be % of S, C, T, D', s.n;
  end if;
  update public.sessions set finished_at = now() where id = s.id;
  insert into public.rounds (name, player, targets, guesses, salt, seal)
  values (s.name, s.player, s.targets, p_guesses, s.salt, s.seal)
  returning * into r;
  return query select s.targets, s.salt, s.seal, r.hits::int, r.n::int, r.pct;
end $$;

revoke all on function public.start_round(text, uuid) from public;
revoke all on function public.submit_round(uuid, text) from public;
grant execute on function public.start_round(text, uuid) to anon, authenticated;
grant execute on function public.submit_round(uuid, text) to anon, authenticated;
