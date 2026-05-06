-- ============================================================
-- Omniscale — Migration 10 : Webhook logs (debug iClosed)
-- ============================================================
-- Capture toutes les requêtes entrantes sur /api/webhooks/iclosed,
-- même celles qui échouent (401, secret manquant, JSON invalide).
-- Permet de diagnostiquer si iClosed envoie effectivement les webhooks.

create table if not exists public.webhook_logs (
  id uuid primary key default uuid_generate_v4(),
  endpoint text not null,                    -- ex: 'iclosed'
  method text not null default 'POST',
  status_code int,                           -- 200, 401, 500…
  result text,                               -- 'ok', 'unauthorized', 'invalid_json', 'unknown_event'…
  headers jsonb,                             -- headers reçus (sans secrets)
  body_preview text,                         -- premier 2000 char du body
  ip text,
  user_agent text,
  received_at timestamptz not null default now()
);

create index if not exists idx_webhook_logs_received on public.webhook_logs(received_at desc);
create index if not exists idx_webhook_logs_endpoint on public.webhook_logs(endpoint, received_at desc);

alter table public.webhook_logs enable row level security;

-- Admin lit tout
drop policy if exists "webhook_logs_admin_all" on public.webhook_logs;
create policy "webhook_logs_admin_all" on public.webhook_logs
  for all using (public.is_admin());

-- Anonymous peut INSERT (pour que le handler webhook puisse logger sans auth)
drop policy if exists "webhook_logs_anon_insert" on public.webhook_logs;
create policy "webhook_logs_anon_insert" on public.webhook_logs
  for insert with check (true);

-- Realtime (pour le tableau de bord debug)
do $$
begin
  perform 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'webhook_logs';
  if not found then
    alter publication supabase_realtime add table public.webhook_logs;
  end if;
end$$;

-- Vérification : voir les 10 derniers logs
-- select endpoint, status_code, result, received_at, body_preview
-- from public.webhook_logs order by received_at desc limit 10;
