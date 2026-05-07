-- ============================================================
-- Omniscale — Migration 12 : Historique des conversations IA LinkedIn
-- ============================================================
-- Persiste les conversations entre l'admin et l'assistant IA pour
-- pouvoir y revenir plus tard (sidebar dans /admin/integrations/linkedin).

create table if not exists public.linkedin_ai_conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default 'Nouvelle conversation',
  -- messages : JSON array of { role: 'user'|'assistant', content: string, toolCalls?: [...] }
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_linkedin_ai_conv_user_updated
  on public.linkedin_ai_conversations(user_id, updated_at desc);

alter table public.linkedin_ai_conversations enable row level security;

-- Admin lit/écrit tout (cohérent avec les autres tables admin)
drop policy if exists "linkedin_ai_conv_admin_all" on public.linkedin_ai_conversations;
create policy "linkedin_ai_conv_admin_all" on public.linkedin_ai_conversations
  for all using (public.is_admin());

-- Trigger updated_at automatique
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;

drop trigger if exists trg_linkedin_ai_conv_touch on public.linkedin_ai_conversations;
create trigger trg_linkedin_ai_conv_touch
  before update on public.linkedin_ai_conversations
  for each row execute function public.touch_updated_at();
