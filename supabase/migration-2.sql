-- ============================================================
-- Omniscale — Migration 2 : champs profils enrichis
-- ============================================================

-- Ajouter les colonnes manquantes à profiles
alter table public.profiles
  add column if not exists sector text,
  add column if not exists city text,
  add column if not exists phone text,
  add column if not exists monthly_revenue text,
  add column if not exists website text;

-- Mettre à jour le trigger handle_new_user pour inclure ces champs
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, brand, sector, city, phone, monthly_revenue, website, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'brand',
    new.raw_user_meta_data->>'sector',
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'monthly_revenue',
    new.raw_user_meta_data->>'website',
    'lead'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
