-- ============================================================
-- Omniscale — Migration 7 : Intégration LinkedIn (admin only)
-- ============================================================
-- Stocke le token OAuth + infos profil de la connexion LinkedIn de
-- l'agence, plus l'historique des posts publiés via le SaaS.
--
-- À exécuter dans Supabase Dashboard → SQL Editor.

-- ─────────────────────────────────────────────
-- 1. Connexion LinkedIn (singleton — 1 seul compte connecté)
-- ─────────────────────────────────────────────
create table if not exists public.linkedin_account (
  id int primary key default 1,
  linkedin_id text,                              -- "sub" du token OpenID
  name text,
  email text,
  picture_url text,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,                        -- access_token expiry
  scope text,                                    -- scopes accordés
  connected_at timestamptz default now(),
  connected_by uuid references auth.users(id),
  updated_at timestamptz default now(),
  check (id = 1)                                 -- forcé à 1 ligne max
);

drop trigger if exists trg_linkedin_account_updated on public.linkedin_account;
create trigger trg_linkedin_account_updated
  before update on public.linkedin_account
  for each row execute function public.touch_updated_at();

-- ─────────────────────────────────────────────
-- 2. Historique des posts LinkedIn publiés via le SaaS
-- ─────────────────────────────────────────────
create table if not exists public.linkedin_posts (
  id uuid primary key default uuid_generate_v4(),
  linkedin_post_id text,                         -- URN renvoyé par LinkedIn
  text_content text not null,
  status text not null default 'draft' check (status in ('draft','published','failed')),
  error_message text,
  published_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);
create index if not exists idx_linkedin_posts_status on public.linkedin_posts(status);
create index if not exists idx_linkedin_posts_created on public.linkedin_posts(created_at desc);

-- ─────────────────────────────────────────────
-- RLS — admin only sur les 2 tables (tokens OAuth = sensible)
-- ─────────────────────────────────────────────
alter table public.linkedin_account enable row level security;
alter table public.linkedin_posts enable row level security;

drop policy if exists "linkedin_account_admin_all" on public.linkedin_account;
create policy "linkedin_account_admin_all" on public.linkedin_account
  for all using (public.is_admin());

drop policy if exists "linkedin_posts_admin_all" on public.linkedin_posts;
create policy "linkedin_posts_admin_all" on public.linkedin_posts
  for all using (public.is_admin());

-- Realtime pour rafraîchir l'UI quand un post est publié
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname='public' and tablename='linkedin_posts'
  ) then
    alter publication supabase_realtime add table public.linkedin_posts;
  end if;
end$$;
