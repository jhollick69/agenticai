-- Run this once in the Supabase SQL Editor (Dashboard → SQL → New query).
-- It creates the profiles table that stores entitlement, locks it down with RLS,
-- and auto-creates a profile row whenever a new auth user signs up.

create table if not exists public.profiles (
  id                  uuid primary key references auth.users (id) on delete cascade,
  email               text,
  stripe_customer_id  text unique,
  is_premium          boolean not null default false,
  current_period_end  timestamptz,
  updated_at          timestamptz not null default now()
);

-- Row Level Security: users may READ their own profile, but NOBODY can write via the
-- anon/auth key. Only the service-role key (used by the Stripe webhook) can update
-- premium status — that's what makes the paywall tamper-proof.
alter table public.profiles enable row level security;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Auto-create a profile when a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Index for the webhook's lookup by Stripe customer.
create index if not exists profiles_stripe_customer_idx
  on public.profiles (stripe_customer_id);

-- ─── Per-user quiz progress ───────────────────────────────────────────────────
-- One row per user per topic. Unlike profiles, this is the user's OWN data, so RLS
-- lets the signed-in browser read and write its own rows (never anyone else's).
create table if not exists public.progress (
  user_id     uuid not null references auth.users (id) on delete cascade,
  topic_id    text not null,
  best_score  int not null default 0,
  last_score  int not null default 0,
  total       int not null default 0,
  attempts    int not null default 0,
  completed   boolean not null default false,
  updated_at  timestamptz not null default now(),
  primary key (user_id, topic_id)
);

alter table public.progress enable row level security;

drop policy if exists "progress select own" on public.progress;
create policy "progress select own"
  on public.progress for select
  using (auth.uid() = user_id);

drop policy if exists "progress insert own" on public.progress;
create policy "progress insert own"
  on public.progress for insert
  with check (auth.uid() = user_id);

drop policy if exists "progress update own" on public.progress;
create policy "progress update own"
  on public.progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Editable question bank ───────────────────────────────────────────────────
-- Questions live here so they can be edited/added without a redeploy. RLS is on
-- with NO policies, so neither the anon nor the signed-in key can read or write
-- this table — only the server's service-role key (used after the paywall check)
-- can. That keeps premium questions from leaking to the browser.
create table if not exists public.questions (
  id          uuid primary key default gen_random_uuid(),
  topic_id    text not null,
  level       text not null default 'gcse',
  q           text not null,
  options     jsonb not null,
  correct     int not null default 0,
  concept     text not null default '',
  deeper      text not null default '',
  analogy     text not null default '',
  source      text not null default 'manual',
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.questions enable row level security;
-- (Intentionally no policies — service role only.)

create index if not exists questions_topic_idx on public.questions (topic_id) where active;
