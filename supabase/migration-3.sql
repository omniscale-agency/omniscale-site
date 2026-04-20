-- ============================================================
-- Omniscale — Migration 3 : Vraies APIs sociales (Phase 2.4)
-- À exécuter dans Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Étendre la table connections pour stocker les vraies données OAuth
alter table public.connections add column if not exists provider_user_id text;
alter table public.connections add column if not exists scope text;
alter table public.connections add column if not exists metrics_cache jsonb default '{}'::jsonb;
alter table public.connections add column if not exists last_synced_at timestamptz;
alter table public.connections add column if not exists avatar_url text;

-- 2. Table des vidéos / posts importés depuis les APIs sociales
create table if not exists public.social_videos (
  id uuid primary key default uuid_generate_v4(),
  connection_id uuid not null references public.connections(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('instagram','tiktok','youtube')),
  external_id text not null,           -- ID de la vidéo chez le provider
  title text,
  thumbnail_url text,
  permalink text,
  published_at timestamptz,
  views int default 0,
  likes int default 0,
  comments int default 0,
  shares int default 0,
  raw jsonb default '{}'::jsonb,
  fetched_at timestamptz default now(),
  unique(connection_id, external_id)
);
create index if not exists idx_social_videos_user on public.social_videos(user_id);
create index if not exists idx_social_videos_platform on public.social_videos(platform);
create index if not exists idx_social_videos_published on public.social_videos(published_at desc);

-- 3. RLS sur social_videos — owner-only (admin voit tout)
alter table public.social_videos enable row level security;

drop policy if exists "social_videos_owner" on public.social_videos;
create policy "social_videos_owner" on public.social_videos
  for all using (user_id = auth.uid() or public.is_admin());

-- 4. Realtime pour rafraîchir l'UI quand un sync termine
alter publication supabase_realtime add table public.social_videos;
