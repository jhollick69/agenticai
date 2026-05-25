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
