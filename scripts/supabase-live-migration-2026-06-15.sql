create extension if not exists pgcrypto;

do $$
begin
  create type public.account_role as enum ('client', 'lawyer', 'law_firm', 'employer', 'advertiser', 'admin');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.moderation_status as enum ('draft', 'pending_review', 'approved', 'rejected', 'archived');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.membership_status as enum ('free', 'premium_pending', 'premium_active', 'premium_expired');
exception
  when duplicate_object then null;
end $$;

alter table public.lawyer_profiles
  add column if not exists profile_picture_url text,
  add column if not exists year_of_call text,
  add column if not exists supreme_court_number text,
  add column if not exists show_call_details_public boolean not null default false,
  add column if not exists pro_bono_open boolean not null default false;

create table if not exists public.lawyer_follows (
  follower_id uuid references public.profiles(id) on delete cascade,
  followed_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followed_id),
  check (follower_id <> followed_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  activity_type text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists lawyer_profiles_user_id_idx on public.lawyer_profiles(user_id);
create index if not exists lawyer_profiles_verified_idx on public.lawyer_profiles(verified);
create index if not exists lawyer_profiles_scn_idx on public.lawyer_profiles(supreme_court_number);
create index if not exists lawyer_follows_followed_id_idx on public.lawyer_follows(followed_id);
create index if not exists notifications_recipient_id_idx on public.notifications(recipient_id);
create index if not exists notifications_created_at_idx on public.notifications(created_at desc);

alter table public.lawyer_follows enable row level security;
alter table public.notifications enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'lawyer_follows'
      and policyname = 'follow public read'
  ) then
    create policy "follow public read" on public.lawyer_follows
      for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'lawyer_follows'
      and policyname = 'follow owner write'
  ) then
    create policy "follow owner write" on public.lawyer_follows
      for all
      using (follower_id = auth.uid() or public.is_admin())
      with check (follower_id = auth.uid() or public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'notifications'
      and policyname = 'notification recipient read'
  ) then
    create policy "notification recipient read" on public.notifications
      for select using (recipient_id = auth.uid() or public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'notifications'
      and policyname = 'notification recipient update'
  ) then
    create policy "notification recipient update" on public.notifications
      for update using (recipient_id = auth.uid() or public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'notifications'
      and policyname = 'notification service insert'
  ) then
    create policy "notification service insert" on public.notifications
      for insert with check (public.is_admin());
  end if;
end $$;

grant select, insert, update, delete on public.lawyer_follows to authenticated;
grant select, update on public.notifications to authenticated;

select
  'learnedcircle_live_migration_2026_06_15_applied' as migration,
  now() as applied_at;
