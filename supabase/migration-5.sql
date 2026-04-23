-- ============================================================
-- Omniscale — Migration 5 : Objectifs + fix RLS pour clients
-- non-bindés (slug 'user-{uuid}')
-- À exécuter dans Supabase Dashboard → SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. Table OBJECTIVES
-- ─────────────────────────────────────────────
create table if not exists public.objectives (
  id uuid primary key default uuid_generate_v4(),
  client_slug text not null,
  label text not null,
  current numeric not null default 0,
  target numeric not null,
  unit text not null default '',                  -- '€', '%', 'k', 'RDV', etc.
  position int not null default 0,                -- ordre d'affichage
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_objectives_client on public.objectives(client_slug);

-- Trigger : updated_at auto
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists trg_objectives_updated on public.objectives;
create trigger trg_objectives_updated
  before update on public.objectives
  for each row execute function public.touch_updated_at();

-- RLS
alter table public.objectives enable row level security;

-- Helper : slug "personnel" auto pour un user (utilisé quand pas de mock binding)
create or replace function public.my_user_slug()
returns text
language sql
stable
security definer set search_path = public
as $$
  select 'user-' || auth.uid()::text;
$$;

drop policy if exists "objectives_client_read" on public.objectives;
create policy "objectives_client_read" on public.objectives
  for select using (
    client_slug = public.my_client_slug()
    or client_slug = public.my_user_slug()
    or public.is_admin()
  );

drop policy if exists "objectives_admin_write" on public.objectives;
create policy "objectives_admin_write" on public.objectives
  for all using (public.is_admin());

-- Realtime
alter publication supabase_realtime add table public.objectives;


-- ─────────────────────────────────────────────
-- 2. FIX RLS — autoriser la lecture des todos/events
--    pour les users sans client_slug bindé (cas
--    où admin envoie sur slug 'user-{uuid}')
-- ─────────────────────────────────────────────

drop policy if exists "todos_client_read" on public.todos;
create policy "todos_client_read" on public.todos
  for select using (
    client_slug = public.my_client_slug()
    or client_slug = public.my_user_slug()
    or public.is_admin()
  );

drop policy if exists "todos_client_update" on public.todos;
create policy "todos_client_update" on public.todos
  for update using (
    client_slug = public.my_client_slug()
    or client_slug = public.my_user_slug()
    or public.is_admin()
  );

drop policy if exists "events_client_read" on public.events;
create policy "events_client_read" on public.events
  for select using (
    client_slug = public.my_client_slug()
    or client_slug = public.my_user_slug()
    or public.is_admin()
  );

-- Aligne aussi invoices pour cohérence (visible si bindé OU si user-perso)
drop policy if exists "invoices_client_read" on public.invoices;
create policy "invoices_client_read" on public.invoices
  for select using (
    (
      (client_slug = public.my_client_slug() or client_slug = public.my_user_slug())
      and status != 'draft'
    )
    or public.is_admin()
  );
