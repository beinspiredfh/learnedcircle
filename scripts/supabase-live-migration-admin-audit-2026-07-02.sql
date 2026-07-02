create extension if not exists pgcrypto;

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  action_type text not null,
  target_table text,
  target_id uuid,
  previous_state jsonb not null default '{}'::jsonb,
  new_state jsonb not null default '{}'::jsonb,
  admin_note text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists admin_audit_log_created_at_idx
  on public.admin_audit_log(created_at desc);

create index if not exists admin_audit_log_action_type_idx
  on public.admin_audit_log(action_type);

create index if not exists admin_audit_log_target_idx
  on public.admin_audit_log(target_table, target_id);

alter table public.admin_audit_log enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'admin_audit_log'
      and policyname = 'admin audit access'
  ) then
    create policy "admin audit access" on public.admin_audit_log
      for all using (public.is_admin()) with check (public.is_admin());
  end if;
end $$;

grant select, insert on public.admin_audit_log to authenticated;

select
  'learnedcircle_admin_audit_2026_07_02_applied' as migration,
  now() as applied_at;
