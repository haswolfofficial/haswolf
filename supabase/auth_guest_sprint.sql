-- HASWOLF Sprint 1: Google + Misafir giriş altyapısı
create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists is_guest boolean not null default false,
  add column if not exists ip_hash text;

create unique index if not exists profiles_nickname_lower_unique
  on public.profiles (lower(nickname))
  where nickname is not null;

create sequence if not exists public.guest_nickname_seq start 1;

create or replace function public.allocate_guest_nickname()
returns text
language sql
security definer
set search_path = public
as $$
  select 'Misafir ' || nextval('public.guest_nickname_seq')::text;
$$;

grant execute on function public.allocate_guest_nickname() to authenticated, service_role;

create table if not exists public.ip_bans (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null unique,
  reason text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

alter table public.ip_bans enable row level security;

-- ip_bans tablosuna doğrudan istemci erişimi verilmez; yalnızca service role API kullanır.
