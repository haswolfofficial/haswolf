begin;

create table if not exists public.site_notifications(
  id uuid primary key default gen_random_uuid(),
  title text not null,
  notification_type text not null default 'announcement',
  product_id bigint references public.products(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.site_notifications add column if not exists body text;
alter table public.site_notifications add column if not exists link text;
alter table public.site_notifications add column if not exists image_url text;
alter table public.site_notifications add column if not exists is_pinned boolean not null default false;
alter table public.site_notifications add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.site_notifications add column if not exists updated_at timestamptz not null default now();

alter table public.site_notifications enable row level security;

drop policy if exists "site notifications public read" on public.site_notifications;
create policy "site notifications public read"
on public.site_notifications for select
to anon, authenticated
using (is_active = true or public.is_admin_member());

drop policy if exists "site notifications admin manage" on public.site_notifications;
create policy "site notifications admin manage"
on public.site_notifications for all
to authenticated
using (public.is_admin_member())
with check (public.is_admin_member());

create index if not exists site_notifications_live_idx
on public.site_notifications(is_active, is_pinned desc, created_at desc);

alter publication supabase_realtime add table public.site_notifications;

commit;
