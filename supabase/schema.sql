-- GRE Lexicon — Supabase schema
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query).

create table if not exists public.user_word_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  word_id integer not null check (word_id > 0),
  status text not null default 'unseen' check (status in ('unseen', 'learning', 'reviewing', 'mastered')),
  is_starred boolean not null default false,
  correct_streak integer not null default 0 check (correct_streak >= 0),
  correct_count integer not null default 0 check (correct_count >= 0),
  incorrect_count integer not null default 0 check (incorrect_count >= 0),
  last_reviewed_at timestamptz,
  client_updated_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, word_id)
);

-- Safe to re-run on databases created before this column existed.
alter table public.user_word_progress add column if not exists client_updated_at timestamptz;

create index if not exists user_word_progress_user_status_idx
  on public.user_word_progress (user_id, status);
create index if not exists user_word_progress_user_starred_idx
  on public.user_word_progress (user_id) where is_starred;

create table if not exists public.user_stats (
  user_id uuid primary key references auth.users (id) on delete cascade,
  daily_streak integer not null default 0 check (daily_streak >= 0),
  last_study_date date,
  total_quizzes_taken integer not null default 0 check (total_quizzes_taken >= 0),
  last_active_deck integer not null default 1 check (last_active_deck > 0),
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_word_progress_touch on public.user_word_progress;
create trigger user_word_progress_touch
  before update on public.user_word_progress
  for each row execute function public.touch_updated_at();

drop trigger if exists user_stats_touch on public.user_stats;
create trigger user_stats_touch
  before update on public.user_stats
  for each row execute function public.touch_updated_at();

-- Row-Level Security: users can only ever see and modify their own rows.
alter table public.user_word_progress enable row level security;
alter table public.user_stats enable row level security;

-- Explicit Data API access (needed when "Automatically expose new tables" is off).
-- Only signed-in users get access, and RLS below limits them to their own rows.
revoke all on public.user_word_progress from anon;
revoke all on public.user_stats from anon;
grant select, insert, update, delete on public.user_word_progress to authenticated;
grant select, insert, update on public.user_stats to authenticated;

drop policy if exists "progress_select_own" on public.user_word_progress;
create policy "progress_select_own" on public.user_word_progress
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "progress_insert_own" on public.user_word_progress;
create policy "progress_insert_own" on public.user_word_progress
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "progress_update_own" on public.user_word_progress;
create policy "progress_update_own" on public.user_word_progress
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "progress_delete_own" on public.user_word_progress;
create policy "progress_delete_own" on public.user_word_progress
  for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "stats_select_own" on public.user_stats;
create policy "stats_select_own" on public.user_stats
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "stats_insert_own" on public.user_stats;
create policy "stats_insert_own" on public.user_stats
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "stats_update_own" on public.user_stats;
create policy "stats_update_own" on public.user_stats
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
