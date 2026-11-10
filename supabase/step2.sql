-- Rounds can now only be logged through submit_round.
drop policy if exists "anyone can add" on public.rounds;
revoke insert on public.rounds from anon, authenticated;
