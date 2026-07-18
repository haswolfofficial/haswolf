-- HASWOLF v2 Premium: bir kez Supabase SQL Editor'da çalıştır.
alter table public.products add column if not exists old_price numeric null;
alter table public.products add column if not exists admin_note text null;
alter table public.profiles add column if not exists device_hash text null;
create unique index if not exists profiles_guest_device_unique on public.profiles(device_hash) where is_guest=true and device_hash is not null;
create unique index if not exists profiles_guest_ip_unique on public.profiles(ip_hash) where is_guest=true and ip_hash is not null;

-- Misafirlerin çekilişe katılmasını veritabanı seviyesinde de engeller.
create or replace function public.prevent_guest_raffle_entry() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if exists(select 1 from public.profiles where id=new.user_id and is_guest=true) then
    raise exception 'Misafir hesaplar çekilişlere katılamaz.';
  end if;
  return new;
end; $$;
drop trigger if exists trg_prevent_guest_raffle_entry on public.raffle_entries;
create trigger trg_prevent_guest_raffle_entry before insert on public.raffle_entries for each row execute function public.prevent_guest_raffle_entry();

-- admin_note alanını normal istemciden doğrudan okumayı engellemek için ürünleri bu view üzerinden yayınlamak önerilir.
-- Mevcut uygulama seçili kolonları çektiği için admin_note ana sayfaya gönderilmez.
