-- HASWOLF MEZAT V1
-- Run once in Supabase SQL Editor after the existing HASWOLF schema.

create table if not exists public.auctions (
  id uuid primary key default gen_random_uuid(),
  product_id bigint not null references public.products(id) on delete restrict,
  title text not null,
  description text,
  server text not null default 'EPHESUS' check (server in ('EPHESUS','PERGAMON','TEOS')),
  start_price numeric(14,2) not null check (start_price > 0),
  current_price numeric(14,2) not null check (current_price >= 0),
  min_increment numeric(14,2) not null default 250 check (min_increment > 0),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  extension_seconds integer not null default 30 check (extension_seconds between 5 and 300),
  max_extension_seconds integer not null default 300 check (max_extension_seconds between 0 and 3600),
  extended_seconds integer not null default 0,
  status text not null default 'scheduled' check (status in ('scheduled','active','ended','cancelled')),
  winner_user_id uuid references auth.users(id) on delete set null,
  winner_bid_id uuid,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists public.auction_bids (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.auctions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  bidder_name text not null,
  amount numeric(14,2) not null check (amount > 0),
  created_at timestamptz not null default now()
);

create index if not exists auctions_status_ends_idx on public.auctions(status, ends_at);
create index if not exists auctions_product_idx on public.auctions(product_id);
create index if not exists auction_bids_auction_created_idx on public.auction_bids(auction_id, created_at desc);
create index if not exists auction_bids_user_idx on public.auction_bids(user_id);

alter table public.auctions enable row level security;
alter table public.auction_bids enable row level security;

do $$ begin
  create policy auctions_public_read
    on public.auctions for select to anon, authenticated using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy auction_bids_public_read
    on public.auction_bids for select to anon, authenticated using (true);
exception when duplicate_object then null; end $$;

-- Direct client inserts/updates are intentionally not allowed.
-- Bids go through the atomic SECURITY DEFINER function below.

create or replace function public.place_auction_bid(
  p_auction_id uuid,
  p_amount numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auction public.auctions;
  v_user_id uuid := auth.uid();
  v_bid public.auction_bids;
  v_bidder_name text;
  v_new_end timestamptz;
  v_extension integer := 0;
begin
  if v_user_id is null then
    raise exception 'Giriş yapmalısınız';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Geçersiz teklif';
  end if;

  select * into v_auction
  from public.auctions
  where id = p_auction_id
  for update;

  if not found then
    raise exception 'Mezat bulunamadı';
  end if;

  if v_auction.status <> 'active' then
    raise exception 'Mezat aktif değil';
  end if;

  if now() < v_auction.starts_at then
    raise exception 'Mezat henüz başlamadı';
  end if;

  if now() >= v_auction.ends_at then
    raise exception 'Mezat sona erdi';
  end if;

  if p_amount < greatest(v_auction.start_price, v_auction.current_price + v_auction.min_increment) then
    raise exception 'Teklif en az % olmalı', greatest(v_auction.start_price, v_auction.current_price + v_auction.min_increment);
  end if;

  select coalesce(
    nullif(trim(coalesce(raw_user_meta_data->>'username','')), ''),
    nullif(trim(coalesce(raw_user_meta_data->>'name','')), ''),
    split_part(coalesce(email,''),'@',1),
    'Oyuncu'
  )
  into v_bidder_name
  from auth.users
  where id = v_user_id;

  insert into public.auction_bids(auction_id,user_id,bidder_name,amount)
  values (v_auction.id,v_user_id,left(v_bidder_name,80),p_amount)
  returning * into v_bid;

  v_new_end := v_auction.ends_at;

  if extract(epoch from (v_auction.ends_at - now())) <= v_auction.extension_seconds
     and v_auction.extended_seconds < v_auction.max_extension_seconds then
    v_extension := least(
      v_auction.extension_seconds,
      v_auction.max_extension_seconds - v_auction.extended_seconds
    );
    v_new_end := v_auction.ends_at + make_interval(secs => v_extension);
  end if;

  update public.auctions
  set current_price = p_amount,
      ends_at = v_new_end,
      extended_seconds = extended_seconds + v_extension,
      winner_user_id = v_user_id,
      winner_bid_id = v_bid.id,
      updated_at = now()
  where id = v_auction.id;

  return jsonb_build_object(
    'bid_id', v_bid.id,
    'auction_id', v_auction.id,
    'amount', p_amount,
    'ends_at', v_new_end,
    'extended_seconds', v_auction.extended_seconds + v_extension
  );
end;
$$;

revoke all on function public.place_auction_bid(uuid,numeric) from public;
grant execute on function public.place_auction_bid(uuid,numeric) to authenticated;

create or replace function public.sync_auction_statuses()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.auctions
  set status = 'active', updated_at = now()
  where status = 'scheduled' and starts_at <= now() and ends_at > now();

  update public.auctions
  set status = 'ended', updated_at = now()
  where status = 'active' and ends_at <= now();
end;
$$;

revoke all on function public.sync_auction_statuses() from public;
grant execute on function public.sync_auction_statuses() to anon, authenticated;
