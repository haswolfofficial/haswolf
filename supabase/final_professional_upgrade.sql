create extension if not exists pgcrypto;

create table if not exists public.raffle_managers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.raffles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  prize text not null,
  banner_url text,
  rules text,
  status text not null default 'draft' check (status in ('draft','active','completed','cancelled')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  winner_count integer not null default 1 check (winner_count between 1 and 100),
  created_by uuid references auth.users(id),
  drawn_by uuid references auth.users(id),
  drawn_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.raffles add column if not exists banner_url text;

create table if not exists public.raffle_entries (
  id uuid primary key default gen_random_uuid(),
  raffle_id uuid not null references public.raffles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  is_valid boolean not null default true,
  created_at timestamptz not null default now(),
  unique (raffle_id,user_id)
);

create table if not exists public.raffle_winners (
  id uuid primary key default gen_random_uuid(),
  raffle_id uuid not null references public.raffles(id) on delete cascade,
  entry_id uuid references public.raffle_entries(id),
  user_id uuid references auth.users(id),
  display_name text not null,
  position integer not null,
  drawn_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (raffle_id,position)
);

alter table public.raffles enable row level security;
alter table public.raffle_entries enable row level security;
alter table public.raffle_winners enable row level security;
alter table public.raffle_managers enable row level security;

drop policy if exists "raffles public read" on public.raffles;
create policy "raffles public read" on public.raffles for select using (status in ('active','completed'));

drop policy if exists "raffle entries authenticated insert" on public.raffle_entries;
create policy "raffle entries authenticated insert" on public.raffle_entries for insert to authenticated with check (auth.uid()=user_id);

drop policy if exists "raffle entries authenticated read" on public.raffle_entries;
create policy "raffle entries authenticated read" on public.raffle_entries for select to authenticated using (true);

drop policy if exists "raffle winners public read" on public.raffle_winners;
create policy "raffle winners public read" on public.raffle_winners for select using (true);

-- Ana admin kullanıcı UUID'sini ve yetki verilecek kişinin UUID'sini yazarak çalıştır:
-- insert into public.raffle_managers(user_id,granted_by)
-- values ('YETKILI_UUID','ANA_ADMIN_UUID') on conflict(user_id) do nothing;
