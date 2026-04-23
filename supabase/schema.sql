-- ============================================================
-- Omniscale — Schéma DB Phase 2.1
-- À exécuter dans Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- =========== EXTENSIONS ===========
create extension if not exists "uuid-ossp";

-- =========== PROFILES (extension de auth.users) ===========
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  brand text,
  role text not null default 'lead' check (role in ('admin', 'client', 'lead')),
  client_slug text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Trigger : créer un profil automatiquement à chaque nouveau signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, brand, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'brand',
    'lead'  -- tous les nouveaux comptes sont leads par défaut
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========== TODOS (admin → client) ===========
create table if not exists public.todos (
  id uuid primary key default uuid_generate_v4(),
  client_slug text not null,
  title text not null,
  done boolean not null default false,
  due_date date,
  assignee text,
  priority text check (priority in ('low','med','high')),
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);
create index if not exists idx_todos_client on public.todos(client_slug);

-- =========== EVENTS (RDV) ===========
create table if not exists public.events (
  id uuid primary key default uuid_generate_v4(),
  client_slug text not null,
  title text not null,
  starts_at timestamptz not null,
  duration int not null default 45,
  type text not null default 'call' check (type in ('call','shooting','review','workshop')),
  with_who text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);
create index if not exists idx_events_client on public.events(client_slug);
create index if not exists idx_events_starts on public.events(starts_at);

-- =========== OBJECTIVES (admin → client) ===========
create table if not exists public.objectives (
  id uuid primary key default uuid_generate_v4(),
  client_slug text not null,
  label text not null,
  current numeric not null default 0,
  target numeric not null,
  unit text not null default '',
  position int not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_objectives_client on public.objectives(client_slug);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists trg_objectives_updated on public.objectives;
create trigger trg_objectives_updated
  before update on public.objectives
  for each row execute function public.touch_updated_at();

-- =========== INVOICES ===========
create table if not exists public.invoices (
  id text primary key,                    -- F-2026-0042
  client_slug text not null,
  client_brand text not null,
  client_email text not null,
  type text not null default 'invoice' check (type in ('invoice','payment_request')),
  status text not null default 'draft' check (status in ('draft','sent','paid','overdue')),
  issued_at timestamptz not null,
  due_at timestamptz not null,
  lines jsonb not null,
  vat_rate numeric not null default 20,
  notes text,
  sent_at timestamptz,
  paid_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);
create index if not exists idx_invoices_client on public.invoices(client_slug);
create index if not exists idx_invoices_status on public.invoices(status);

-- =========== CONNECTIONS (comptes sociaux) ===========
create table if not exists public.connections (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('instagram','tiktok','youtube')),
  username text not null,
  followers int not null default 0,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  connected_at timestamptz default now(),
  unique(user_id, platform)
);

-- =========== COMPANY SETTINGS (singleton) ===========
create table if not exists public.company_settings (
  id int primary key default 1,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now(),
  check (id = 1)
);
insert into public.company_settings (id, data) values (1, '{}'::jsonb)
on conflict (id) do nothing;


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.todos enable row level security;
alter table public.events enable row level security;
alter table public.objectives enable row level security;
alter table public.invoices enable row level security;
alter table public.connections enable row level security;
alter table public.company_settings enable row level security;

-- Helper : retourne true si l'utilisateur courant est admin
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Helper : retourne le client_slug de l'utilisateur courant
create or replace function public.my_client_slug()
returns text
language sql
stable
security definer set search_path = public
as $$
  select client_slug from public.profiles where id = auth.uid();
$$;

-- Helper : slug "personnel" auto pour un user (utilisé quand pas de mock binding)
-- Pattern : 'user-{uuid}' — utilisé par les pages dashboard pour les comptes
-- non mappés à un dossier mock client.
create or replace function public.my_user_slug()
returns text
language sql
stable
security definer set search_path = public
as $$
  select 'user-' || auth.uid()::text;
$$;

-- ----- PROFILES -----
drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin());

-- ----- TODOS -----
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

drop policy if exists "todos_admin_write" on public.todos;
create policy "todos_admin_write" on public.todos
  for all using (public.is_admin());

-- ----- EVENTS -----
drop policy if exists "events_client_read" on public.events;
create policy "events_client_read" on public.events
  for select using (
    client_slug = public.my_client_slug()
    or client_slug = public.my_user_slug()
    or public.is_admin()
  );

drop policy if exists "events_admin_write" on public.events;
create policy "events_admin_write" on public.events
  for all using (public.is_admin());

-- ----- OBJECTIVES -----
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

-- ----- INVOICES -----
drop policy if exists "invoices_client_read" on public.invoices;
create policy "invoices_client_read" on public.invoices
  for select using (
    (
      (client_slug = public.my_client_slug() or client_slug = public.my_user_slug())
      and status != 'draft'
    )
    or public.is_admin()
  );

drop policy if exists "invoices_admin_write" on public.invoices;
create policy "invoices_admin_write" on public.invoices
  for all using (public.is_admin());

-- ----- CONNECTIONS -----
drop policy if exists "connections_owner" on public.connections;
create policy "connections_owner" on public.connections
  for all using (user_id = auth.uid() or public.is_admin());

-- ----- COMPANY SETTINGS -----
drop policy if exists "company_read_all" on public.company_settings;
create policy "company_read_all" on public.company_settings
  for select using (true);  -- tout le monde peut lire (pour afficher sur les factures)

drop policy if exists "company_admin_write" on public.company_settings;
create policy "company_admin_write" on public.company_settings
  for update using (public.is_admin());


-- ============================================================
-- REALTIME (pour la sync admin → client instantanée)
-- ============================================================

alter publication supabase_realtime add table public.todos;
alter publication supabase_realtime add table public.events;
alter publication supabase_realtime add table public.objectives;
alter publication supabase_realtime add table public.invoices;
alter publication supabase_realtime add table public.profiles;


-- ============================================================
-- SEED ADMIN — à faire APRÈS le 1er signup avec admin@omniscale.fr
-- (sinon tu n'auras aucun moyen de promouvoir des leads en clients)
-- ============================================================
-- Décommente et exécute APRÈS avoir créé le compte admin@omniscale.fr via /signup :
--
-- update public.profiles set role = 'admin'
-- where email = 'admin@omniscale.fr';
