-- ============================================================
-- Omniscale — Migration 4 : Analytics + iClosed bookings
-- À exécuter dans Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Table bookings — events reçus par webhook iClosed
create table if not exists public.bookings (
  id uuid primary key default uuid_generate_v4(),
  external_id text unique,                       -- ID iClosed du booking
  source text not null default 'iclosed',        -- 'iclosed', 'calendly', etc.
  event text not null check (event in ('scheduled','rescheduled','cancelled','completed','no_show')),
  invitee_name text,
  invitee_email text,
  invitee_phone text,
  scheduled_at timestamptz,                      -- Date/heure du RDV
  duration_minutes int,
  closer text,                                   -- Sales rep assigné
  meeting_url text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  referrer text,
  raw jsonb default '{}'::jsonb,                 -- Payload brut iClosed
  matched_user_id uuid references auth.users(id) on delete set null,  -- Si le user finit par s'inscrire
  matched_at timestamptz,
  received_at timestamptz default now()
);
create index if not exists idx_bookings_event on public.bookings(event);
create index if not exists idx_bookings_email on public.bookings(invitee_email);
create index if not exists idx_bookings_scheduled on public.bookings(scheduled_at desc);
create index if not exists idx_bookings_received on public.bookings(received_at desc);

-- 2. Table analytics_events — sample local d'événements (pour requêtes admin sans dépendre de PostHog)
create table if not exists public.analytics_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,  -- null si anonyme
  anonymous_id text,                                          -- distinct_id PostHog
  event text not null,                                        -- 'page_view', 'lead_signup', 'social_connected', etc.
  properties jsonb default '{}'::jsonb,                       -- url, referrer, utm_*, platform, etc.
  session_id text,
  occurred_at timestamptz default now()
);
create index if not exists idx_analytics_event on public.analytics_events(event);
create index if not exists idx_analytics_user on public.analytics_events(user_id);
create index if not exists idx_analytics_occurred on public.analytics_events(occurred_at desc);

-- 3. RLS — admin only (la lecture des analytics est sensible)
alter table public.bookings enable row level security;
alter table public.analytics_events enable row level security;

drop policy if exists "bookings_admin_all" on public.bookings;
create policy "bookings_admin_all" on public.bookings
  for all using (public.is_admin());

drop policy if exists "analytics_admin_all" on public.analytics_events;
create policy "analytics_admin_all" on public.analytics_events
  for all using (public.is_admin());

-- Note : les inserts depuis le webhook /api/webhooks/iclosed et /api/analytics/track
-- utilisent le client serveur Supabase avec la anon key, et ces routes ne sont pas RLS-bypassables.
-- Pour insérer en bypass, on devrait utiliser la service_role key côté serveur.
-- Pour l'instant on accepte l'insert anon (les policies bloquent juste la LECTURE non-admin).
drop policy if exists "bookings_anon_insert" on public.bookings;
create policy "bookings_anon_insert" on public.bookings
  for insert with check (true);

drop policy if exists "analytics_anon_insert" on public.analytics_events;
create policy "analytics_anon_insert" on public.analytics_events
  for insert with check (true);

-- 4. Realtime pour /admin/analytics (live updates)
alter publication supabase_realtime add table public.bookings;
