-- ============================================================
-- Omniscale — Migration 13 : Intégration X (Twitter) — admin only
-- ============================================================
-- Mirror exact de migration-7 (LinkedIn) appliqué à X.
-- Stocke le token OAuth + infos compte connecté + historique des
-- tweets publiés via le SaaS + conversations IA dédiées.

-- ─────────────────────────────────────────────
-- 1. Connexion X (singleton — 1 seul compte connecté)
-- ─────────────────────────────────────────────
create table if not exists public.x_account (
  id int primary key default 1,
  x_user_id text,                                -- id numérique X
  username text,                                 -- handle sans @
  name text,
  picture_url text,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  scope text,
  connected_at timestamptz default now(),
  connected_by uuid references auth.users(id),
  updated_at timestamptz default now(),
  check (id = 1)
);

drop trigger if exists trg_x_account_updated on public.x_account;
create trigger trg_x_account_updated
  before update on public.x_account
  for each row execute function public.touch_updated_at();

-- ─────────────────────────────────────────────
-- 2. Historique des tweets publiés / programmés via le SaaS
-- ─────────────────────────────────────────────
create table if not exists public.x_posts (
  id uuid primary key default uuid_generate_v4(),
  x_post_id text,                                -- id du tweet renvoyé par X
  text_content text not null,
  status text not null default 'draft'
    check (status in ('draft','scheduled','published','failed')),
  scheduled_at timestamptz,
  error_message text,
  published_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);
create index if not exists idx_x_posts_status on public.x_posts(status);
create index if not exists idx_x_posts_scheduled on public.x_posts(scheduled_at);
create index if not exists idx_x_posts_created on public.x_posts(created_at desc);

-- ─────────────────────────────────────────────
-- 3. Historique conversations IA pour X (mirror linkedin_ai_conversations)
-- ─────────────────────────────────────────────
create table if not exists public.x_ai_conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default 'Nouvelle conversation',
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_x_ai_conv_user_updated
  on public.x_ai_conversations(user_id, updated_at desc);

drop trigger if exists trg_x_ai_conv_touch on public.x_ai_conversations;
create trigger trg_x_ai_conv_touch
  before update on public.x_ai_conversations
  for each row execute function public.touch_updated_at();

-- ─────────────────────────────────────────────
-- RLS — admin only sur les 3 tables
-- ─────────────────────────────────────────────
alter table public.x_account enable row level security;
alter table public.x_posts enable row level security;
alter table public.x_ai_conversations enable row level security;

drop policy if exists "x_account_admin_all" on public.x_account;
create policy "x_account_admin_all" on public.x_account
  for all using (public.is_admin());

drop policy if exists "x_posts_admin_all" on public.x_posts;
create policy "x_posts_admin_all" on public.x_posts
  for all using (public.is_admin());

drop policy if exists "x_ai_conv_admin_all" on public.x_ai_conversations;
create policy "x_ai_conv_admin_all" on public.x_ai_conversations
  for all using (public.is_admin());

-- Realtime pour rafraîchir l'UI à la publication
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname='public' and tablename='x_posts'
  ) then
    alter publication supabase_realtime add table public.x_posts;
  end if;
end$$;
