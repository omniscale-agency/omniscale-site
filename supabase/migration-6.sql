-- ============================================================
-- Omniscale — Migration 6 : KPIs mensuels (saisie manuelle admin)
-- ============================================================
-- Permet à l'admin d'entrer les vrais chiffres clients
-- (CA, dépense pub, ROAS, engagement, abonnés gagnés…) chaque mois,
-- et au client de les voir en temps réel sur son dashboard.
--
-- Architecture : 1 ligne = 1 (client, mois, KPI). Permet d'ajouter de
-- nouveaux KPIs sans changer le schéma.
--
-- À exécuter dans Supabase Dashboard → SQL Editor.

create table if not exists public.client_metrics (
  id uuid primary key default uuid_generate_v4(),
  client_slug text not null,
  period date not null,                       -- 1er du mois (ex: 2026-04-01)
  metric text not null,                       -- 'revenue', 'ad_spend', 'roas', etc.
  value numeric not null default 0,
  unit text not null default '',              -- '€', '%', 'x', '' (count)
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(client_slug, period, metric)
);
create index if not exists idx_client_metrics_slug on public.client_metrics(client_slug);
create index if not exists idx_client_metrics_period on public.client_metrics(period desc);
create index if not exists idx_client_metrics_metric on public.client_metrics(metric);

-- Trigger updated_at (réutilise touch_updated_at déjà créé en migration-5)
drop trigger if exists trg_client_metrics_updated on public.client_metrics;
create trigger trg_client_metrics_updated
  before update on public.client_metrics
  for each row execute function public.touch_updated_at();

-- RLS
alter table public.client_metrics enable row level security;

drop policy if exists "client_metrics_client_read" on public.client_metrics;
create policy "client_metrics_client_read" on public.client_metrics
  for select using (
    client_slug = public.my_client_slug()
    or client_slug = public.my_user_slug()
    or public.is_admin()
  );

drop policy if exists "client_metrics_admin_write" on public.client_metrics;
create policy "client_metrics_admin_write" on public.client_metrics
  for all using (public.is_admin());

-- Realtime
alter publication supabase_realtime add table public.client_metrics;
