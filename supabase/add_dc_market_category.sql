-- Supabase SQL Editor içinde bir kez çalıştırın.
-- products.category alanındaki mevcut CHECK kısıtını bulup DC kategorisini ekler.
do $$
declare
  constraint_name text;
begin
  select con.conname into constraint_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace nsp on nsp.oid = rel.relnamespace
  where nsp.nspname = 'public'
    and rel.relname = 'products'
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) ilike '%category%';

  if constraint_name is not null then
    execute format('alter table public.products drop constraint %I', constraint_name);
  end if;
end $$;

alter table public.products
  add constraint products_category_check
  check (category in ('item', 'yang', 'dc', 'account'));
