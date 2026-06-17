alter table public.guest_articles
  add column if not exists contributor_image_url text;

select
  'learnedcircle_guest_blog_writer_image_migration_2026_06_16_applied' as migration,
  now() as applied_at;
