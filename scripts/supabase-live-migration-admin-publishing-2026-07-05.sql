create extension if not exists pgcrypto;

create table if not exists public.advert_placements (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'draft' check (status in ('draft', 'published', 'paused', 'archived')),
  placement text not null default 'rotating_banner' check (placement in ('rotating_banner', 'advert_section', 'legal_updates', 'library_sponsored')),
  label text,
  headline text not null,
  body text,
  cta_label text,
  cta_url text,
  organization text,
  starts_at timestamptz,
  ends_at timestamptz,
  admin_note text
);

create table if not exists public.library_resources (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'draft' check (status in ('draft', 'published', 'paused', 'archived')),
  group_key text not null default 'books' check (group_key in ('articles', 'books', 'journals', 'external')),
  title text not null,
  area text,
  resource_type text,
  source text,
  summary text,
  action_label text,
  resource_url text,
  file_url text,
  file_name text,
  file_type text,
  admin_note text
);

create index if not exists advert_placements_status_placement_idx
  on public.advert_placements(status, placement, created_at desc);

create index if not exists library_resources_status_group_idx
  on public.library_resources(status, group_key, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists advert_placements_set_updated_at on public.advert_placements;
create trigger advert_placements_set_updated_at
  before update on public.advert_placements
  for each row execute function public.set_updated_at();

drop trigger if exists library_resources_set_updated_at on public.library_resources;
create trigger library_resources_set_updated_at
  before update on public.library_resources
  for each row execute function public.set_updated_at();

alter table public.advert_placements enable row level security;
alter table public.library_resources enable row level security;

drop policy if exists "Published advert placements are publicly readable" on public.advert_placements;
create policy "Published advert placements are publicly readable"
  on public.advert_placements
  for select
  to anon, authenticated
  using (
    status = 'published'
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
  );

drop policy if exists "Published library resources are publicly readable" on public.library_resources;
create policy "Published library resources are publicly readable"
  on public.library_resources
  for select
  to anon, authenticated
  using (status = 'published');

insert into public.advert_placements (status, placement, label, headline, body, cta_label, cta_url, organization)
values
  ('published', 'rotating_banner', 'Sponsored placement', 'Promote legal books, CPD events and professional services.', 'Admin can replace this with an approved paid advert.', 'Book advert', '#advertise', 'LearnedCircle'),
  ('published', 'rotating_banner', 'Featured opportunity', 'Advertise jobs, retainers, internships and consultancy briefs.', 'Show important opportunities to lawyers and legal professionals.', 'View jobs', '#classifieds', 'LearnedCircle'),
  ('published', 'rotating_banner', 'Library visibility', 'Feature approved journals, guides and law reports in the Library.', 'Promote credible legal research and professional materials.', 'Open Library', 'library.html', 'LearnedCircle')
on conflict do nothing;

insert into public.library_resources (status, group_key, title, area, resource_type, source, summary, action_label, resource_url)
values
  ('published', 'journals', 'LearnedCircle Law Report (LCLR)', 'Law Reports', 'Future law report', 'LearnedCircle', 'Curated law-report and case-note product for important decisions, commentary and practitioner research.', 'View plan', 'index.html#guest-blog'),
  ('published', 'external', 'AfricanLII', 'African Legal Research', 'External library', 'African Legal Information Institute', 'Free access to African case law, legislation and legal materials across several jurisdictions.', 'Open external library', 'https://africanlii.org/'),
  ('published', 'external', 'CommonLII', 'Commonwealth Legal Research', 'External library', 'Commonwealth Legal Information Institute', 'Research portal for Commonwealth case law, legislation and legal materials.', 'Open external library', 'http://www.commonlii.org/')
on conflict do nothing;

insert into storage.buckets (id, name, public)
values ('library-documents', 'library-documents', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Library documents are publicly readable" on storage.objects;
create policy "Library documents are publicly readable"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'library-documents');

select
  'learnedcircle_admin_publishing_migration_2026_07_05_applied' as migration,
  now() as applied_at;
