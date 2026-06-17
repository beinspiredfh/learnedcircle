create extension if not exists pgcrypto;

create type public.account_role as enum ('client', 'lawyer', 'law_firm', 'employer', 'advertiser', 'admin');
create type public.moderation_status as enum ('draft', 'pending_review', 'approved', 'rejected', 'archived');
create type public.membership_status as enum ('free', 'premium_pending', 'premium_active', 'premium_expired');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role public.account_role not null default 'client',
  membership public.membership_status not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lawyer_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  display_name text not null,
  profile_picture_url text,
  credentials text,
  year_of_call text,
  supreme_court_number text,
  show_call_details_public boolean not null default false,
  location text,
  firm text,
  practice_areas text[] not null default '{}',
  languages text,
  fees text,
  availability text,
  pro_bono_open boolean not null default false,
  verification_note text,
  verified boolean not null default false,
  direct_client_contact boolean not null default false,
  rating numeric(2,1),
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.job_posts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  title text not null,
  organization text,
  location text,
  engagement_type text,
  practice_areas text[] not null default '{}',
  budget text,
  description text not null,
  status public.moderation_status not null default 'pending_review',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles(id) on delete set null,
  title text not null,
  practice_area text,
  summary text,
  body text,
  byline text,
  status public.moderation_status not null default 'pending_review',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.guest_articles (
  id uuid primary key default gen_random_uuid(),
  contributor_name text not null,
  contributor_title text,
  contributor_image_url text,
  approved_byline text not null,
  title text not null,
  summary text,
  body text,
  status public.moderation_status not null default 'pending_review',
  published_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles(id) on delete set null,
  title text not null,
  practice_area text,
  body text not null,
  status public.moderation_status not null default 'pending_review',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references public.profiles(id) on delete set null,
  recipient_id uuid references public.profiles(id) on delete set null,
  subject text,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table public.lawyer_follows (
  follower_id uuid references public.profiles(id) on delete cascade,
  followed_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followed_id),
  check (follower_id <> followed_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  activity_type text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.moderation_queue (
  id uuid primary key default gen_random_uuid(),
  submitter_id uuid references public.profiles(id) on delete set null,
  item_type text not null,
  item_id uuid,
  payload jsonb not null default '{}'::jsonb,
  status public.moderation_status not null default 'pending_review',
  reviewer_id uuid references public.profiles(id) on delete set null,
  reviewer_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table public.advert_requests (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  organization text not null,
  advert_type text,
  target_audience text,
  campaign_note text,
  advert_plan text not null default 'free' check (advert_plan in ('free', 'paid')),
  visibility_note text,
  payment_status text not null default 'not_required',
  status public.moderation_status not null default 'pending_review',
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigserial primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_table text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role = 'admin'
  );
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at before update on public.profiles
for each row execute function public.touch_updated_at();
create trigger lawyer_profiles_touch_updated_at before update on public.lawyer_profiles
for each row execute function public.touch_updated_at();
create trigger job_posts_touch_updated_at before update on public.job_posts
for each row execute function public.touch_updated_at();
create trigger articles_touch_updated_at before update on public.articles
for each row execute function public.touch_updated_at();
create trigger guest_articles_touch_updated_at before update on public.guest_articles
for each row execute function public.touch_updated_at();
create trigger forum_posts_touch_updated_at before update on public.forum_posts
for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.lawyer_profiles enable row level security;
alter table public.job_posts enable row level security;
alter table public.articles enable row level security;
alter table public.guest_articles enable row level security;
alter table public.forum_posts enable row level security;
alter table public.messages enable row level security;
alter table public.lawyer_follows enable row level security;
alter table public.notifications enable row level security;
alter table public.moderation_queue enable row level security;
alter table public.advert_requests enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles owner read" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles owner update" on public.profiles for update using (id = auth.uid() or public.is_admin());
create policy "profiles insert self" on public.profiles for insert with check (id = auth.uid());

create policy "public approved lawyer profiles" on public.lawyer_profiles for select using (verified = true or user_id = auth.uid() or public.is_admin());
create policy "lawyer profile owner write" on public.lawyer_profiles for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

create policy "public approved jobs" on public.job_posts for select using (status = 'approved' or owner_id = auth.uid() or public.is_admin());
create policy "job owner insert" on public.job_posts for insert with check (owner_id = auth.uid() or public.is_admin());
create policy "job owner update draft" on public.job_posts for update using (owner_id = auth.uid() or public.is_admin());

create policy "public approved articles" on public.articles for select using (status = 'approved' or author_id = auth.uid() or public.is_admin());
create policy "article owner write" on public.articles for all using (author_id = auth.uid() or public.is_admin()) with check (author_id = auth.uid() or public.is_admin());

create policy "public approved guest articles" on public.guest_articles for select using (status = 'approved' or public.is_admin());
create policy "admin guest article write" on public.guest_articles for all using (public.is_admin()) with check (public.is_admin());

create policy "public approved forum posts" on public.forum_posts for select using (status = 'approved' or author_id = auth.uid() or public.is_admin());
create policy "forum owner write" on public.forum_posts for all using (author_id = auth.uid() or public.is_admin()) with check (author_id = auth.uid() or public.is_admin());

create policy "message participants read" on public.messages for select using (sender_id = auth.uid() or recipient_id = auth.uid() or public.is_admin());
create policy "message sender insert" on public.messages for insert with check (sender_id = auth.uid() or public.is_admin());
create policy "message recipient update read" on public.messages for update using (recipient_id = auth.uid() or public.is_admin());

create policy "follow public read" on public.lawyer_follows for select using (true);
create policy "follow owner write" on public.lawyer_follows for all using (follower_id = auth.uid() or public.is_admin()) with check (follower_id = auth.uid() or public.is_admin());

create policy "notification recipient read" on public.notifications for select using (recipient_id = auth.uid() or public.is_admin());
create policy "notification recipient update" on public.notifications for update using (recipient_id = auth.uid() or public.is_admin());
create policy "notification service insert" on public.notifications for insert with check (public.is_admin());

grant usage on schema public to anon, authenticated;
grant insert on public.moderation_queue to anon, authenticated;

create policy "moderation submitter read own" on public.moderation_queue for select using (submitter_id = auth.uid() or public.is_admin());
create policy "moderation public insert" on public.moderation_queue for insert to anon, authenticated with check (true);
create policy "moderation admin update" on public.moderation_queue for update using (public.is_admin());

create policy "advert owner read" on public.advert_requests for select using (owner_id = auth.uid() or public.is_admin());
create policy "advert owner insert" on public.advert_requests for insert with check (owner_id = auth.uid() or public.is_admin());
create policy "advert admin update" on public.advert_requests for update using (public.is_admin());

create policy "audit admin only" on public.audit_logs for all using (public.is_admin()) with check (public.is_admin());
