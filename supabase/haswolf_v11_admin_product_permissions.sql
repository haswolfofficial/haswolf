begin;

-- Founder + admin_members can manage marketplace products.
create or replace function public.haswolf_can_manage_products()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce((auth.jwt() ->> 'email') = 'haswolf666@gmail.com', false)
    or exists (
      select 1
      from public.admin_members am
      where am.user_id = auth.uid()
    );
$$;

grant execute on function public.haswolf_can_manage_products() to authenticated;

alter table public.products enable row level security;

-- Keep public storefront readable only for active products.
drop policy if exists "products public read active" on public.products;
create policy "products public read active"
on public.products
for select
to anon, authenticated
using (is_active = true or public.haswolf_can_manage_products());

-- Full CRUD for founder and every user listed in admin_members.
drop policy if exists "products admins insert" on public.products;
create policy "products admins insert"
on public.products
for insert
to authenticated
with check (public.haswolf_can_manage_products());

drop policy if exists "products admins update" on public.products;
create policy "products admins update"
on public.products
for update
to authenticated
using (public.haswolf_can_manage_products())
with check (public.haswolf_can_manage_products());

drop policy if exists "products admins delete" on public.products;
create policy "products admins delete"
on public.products
for delete
to authenticated
using (public.haswolf_can_manage_products());

-- Admin panel needs to see inactive rows too.
drop policy if exists "products admins read all" on public.products;
create policy "products admins read all"
on public.products
for select
to authenticated
using (public.haswolf_can_manage_products());

-- Allow the same admin accounts to upload/update/delete product images.
drop policy if exists "product images admins insert" on storage.objects;
create policy "product images admins insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and public.haswolf_can_manage_products()
);

drop policy if exists "product images admins update" on storage.objects;
create policy "product images admins update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'product-images'
  and public.haswolf_can_manage_products()
)
with check (
  bucket_id = 'product-images'
  and public.haswolf_can_manage_products()
);

drop policy if exists "product images admins delete" on storage.objects;
create policy "product images admins delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-images'
  and public.haswolf_can_manage_products()
);

commit;
