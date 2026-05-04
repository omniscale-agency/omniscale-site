-- ============================================================
-- Omniscale — Migration 8 : Programmation des posts LinkedIn
-- ============================================================
-- Ajoute scheduled_at à linkedin_posts pour permettre la
-- programmation. Un cron Vercel publiera les drafts dont
-- scheduled_at <= now() une fois par 5 minutes.

alter table public.linkedin_posts
  add column if not exists scheduled_at timestamptz;

create index if not exists idx_linkedin_posts_scheduled
  on public.linkedin_posts(scheduled_at)
  where scheduled_at is not null and status = 'draft';

-- Élargit le check status pour inclure 'scheduled' (état explicite avant publication auto)
do $$
begin
  if exists (
    select 1 from information_schema.constraint_column_usage
    where table_name = 'linkedin_posts' and constraint_name like '%status%check%'
  ) then
    alter table public.linkedin_posts drop constraint if exists linkedin_posts_status_check;
  end if;
  alter table public.linkedin_posts
    add constraint linkedin_posts_status_check
    check (status in ('draft','scheduled','published','failed'));
end$$;
