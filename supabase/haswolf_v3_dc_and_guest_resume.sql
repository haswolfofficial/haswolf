-- HASWOLF v3: DC'nin M bazlı gösterimi uygulama tarafındadır.
-- Bu SQL, ana sayfada aktif ürünlerin anonim/kayıtlı ziyaretçilere görünmesini
-- ve ürün değişikliklerinin Realtime ile anında yansımasını güvenli biçimde sağlar.

alter table public.products enable row level security;

drop policy if exists "products public active read" on public.products;
create policy "products public active read"
on public.products
for select
to anon, authenticated
using (is_active = true and stock > 0);

-- Admin işlemleri için mevcut politikanız varsa korunur. Yoksa aşağıdaki politika
-- admin e-postasına göre ekleme/güncelleme/silme yetkisi verir.
drop policy if exists "products admin full access" on public.products;
create policy "products admin full access"
on public.products
for all
to authenticated
using ((auth.jwt() ->> 'email') = 'haswolf666@gmail.com')
with check ((auth.jwt() ->> 'email') = 'haswolf666@gmail.com');

-- Realtime publication'a products tablosunu ekle; zaten ekliyse hata vermez.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'products'
  ) then
    alter publication supabase_realtime add table public.products;
  end if;
end $$;
