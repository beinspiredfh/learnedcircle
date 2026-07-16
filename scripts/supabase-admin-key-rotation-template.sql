-- LearnedCircle admin key rotation template.
-- Replace __ADMIN_ACCESS_CODE__ with the current private admin key before running in Supabase SQL editor.
-- Do not commit a filled-in copy of this file.

create or replace function public.admin_moderation_list(p_admin_key text)
returns table (
  id uuid,
  created_at timestamptz,
  item_type text,
  status public.moderation_status,
  source text,
  payload jsonb,
  reviewer_note text,
  reviewed_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_admin_key is distinct from '__ADMIN_ACCESS_CODE__' then
    raise exception 'Unauthorized moderation access' using errcode = '28000';
  end if;

  return query
  select
    q.id,
    q.created_at,
    q.item_type,
    q.status,
    q.payload ->> 'source' as source,
    q.payload,
    q.reviewer_note,
    q.reviewed_at
  from public.moderation_queue q
  order by
    case when q.status = 'pending_review' then 0 else 1 end,
    q.created_at desc
  limit 100;
end;
$$;

create or replace function public.admin_moderation_update(
  p_admin_key text,
  p_id uuid,
  p_status text,
  p_reviewer_note text default null
)
returns table (
  id uuid,
  status public.moderation_status,
  reviewer_note text,
  reviewed_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_admin_key is distinct from '__ADMIN_ACCESS_CODE__' then
    raise exception 'Unauthorized moderation access' using errcode = '28000';
  end if;

  if p_status not in ('pending_review', 'approved', 'rejected', 'archived') then
    raise exception 'Invalid moderation status' using errcode = '22023';
  end if;

  return query
  update public.moderation_queue q
  set
    status = p_status::public.moderation_status,
    reviewer_note = nullif(p_reviewer_note, ''),
    reviewed_at = case when p_status = 'pending_review' then null else now() end
  where q.id = p_id
  returning q.id, q.status, q.reviewer_note, q.reviewed_at;
end;
$$;

grant execute on function public.admin_moderation_list(text) to anon, authenticated;
grant execute on function public.admin_moderation_update(text, uuid, text, text) to anon, authenticated;

select
  'learnedcircle_admin_key_rotation_template_ready' as migration,
  now() as prepared_at;
